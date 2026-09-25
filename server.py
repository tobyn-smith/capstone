#!/usr/bin/env python3
"""Serve the wargame and keep the inquiry answers on this machine."""

from __future__ import annotations

import csv
import io
import json
import os
import secrets
import threading
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
APP = ROOT / "app"
DATA = ROOT / "data"
DATA.mkdir(exist_ok=True)

RESPONSES = DATA / "responses.jsonl"
ASSIGNMENTS = DATA / "assignments.jsonl"
PASSPHRASE_FILE = DATA / "passphrase.txt"

LOCK = threading.Lock()
MAX_BODY = 200_000
MAX_TEXT = 5_000

COLUMNS = [
    "participant_code",
    "condition",
    "forced_condition",
    "goal",
    "confidence_bar",
    "preauthorised",
    "first_decision",
    "authorised",
    "stopped",
    "final_actions",
    "outcome",
    "harm",
    "injury",
    "inquiry_account",
    "single_actor",
    "last_human",
    "last_human_who",
    "clarity",
    "sureness",
    "shared",
    "other_notes",
    "started_at",
    "submitted_at",
    "received_at",
    "session_id",
]


def database_url() -> str:
    url = os.environ.get("DATABASE_URL", "").strip()
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://") :]
    return url


def passphrase() -> str:
    env = os.environ.get("PASSPHRASE", "").strip()
    if env:
        return env
    if PASSPHRASE_FILE.exists():
        value = PASSPHRASE_FILE.read_text(encoding="utf-8").strip()
        if value:
            return value
    value = secrets.token_urlsafe(8)
    PASSPHRASE_FILE.write_text(value + "\n", encoding="utf-8")
    return value


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(row, dict):
            rows.append(row)
    return rows


def clip(value, limit: int = MAX_TEXT) -> str:
    if value is None:
        return ""
    text = value if isinstance(value, str) else str(value)
    return text.strip()[:limit]


def as_list(value) -> list[str]:
    if not isinstance(value, list):
        return []
    return [clip(item, 80) for item in value if clip(item, 80)]


def join(value) -> str:
    if isinstance(value, bool):
        return "yes" if value else "no"
    if isinstance(value, list):
        return " | ".join(clip(item, 200) for item in value)
    return clip(value, 500)


def csv_safe(value) -> str:
    text = "" if value is None else str(value)
    if text[:1] in ("=", "+", "-", "@"):
        return "'" + text
    return text


def db_connect():
    import psycopg

    return psycopg.connect(database_url())


def init_db() -> None:
    if not database_url():
        return
    with db_connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS assignments (
                session_id TEXT PRIMARY KEY,
                condition TEXT NOT NULL,
                forced BOOLEAN NOT NULL,
                started_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS responses (
                session_id TEXT PRIMARY KEY,
                payload JSONB NOT NULL
            )
            """
        )
        conn.commit()


def save_assignment(record: dict) -> None:
    with db_connect() as conn:
        conn.execute(
            """
            INSERT INTO assignments (session_id, condition, forced, started_at)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (session_id) DO NOTHING
            """,
            (
                record["session_id"],
                record["condition"],
                bool(record["forced_condition"]),
                record["started_at"],
            ),
        )
        conn.commit()


def save_response(record: dict) -> None:
    from psycopg.types.json import Jsonb

    with db_connect() as conn:
        conn.execute(
            """
            INSERT INTO responses (session_id, payload)
            VALUES (%s, %s)
            ON CONFLICT (session_id) DO UPDATE SET payload = EXCLUDED.payload
            """,
            (record.get("session_id") or secrets.token_hex(8), Jsonb(record)),
        )
        conn.commit()


def load_assignments() -> list[dict]:
    if not database_url():
        return read_jsonl(ASSIGNMENTS)
    with db_connect() as conn:
        rows = conn.execute(
            "SELECT session_id, condition, forced, started_at FROM assignments"
        ).fetchall()
    return [
        {
            "session_id": session_id,
            "condition": condition,
            "forced_condition": forced,
            "started_at": started_at,
        }
        for session_id, condition, forced, started_at in rows
    ]


def load_responses() -> list[dict]:
    if not database_url():
        return read_jsonl(RESPONSES)
    with db_connect() as conn:
        rows = conn.execute(
            "SELECT payload FROM responses ORDER BY payload->>'received_at'"
        ).fetchall()
    loaded = []
    for (payload,) in rows:
        if isinstance(payload, str):
            payload = json.loads(payload)
        if isinstance(payload, dict):
            loaded.append(payload)
    return loaded


def assignment_counts() -> tuple[int, int]:
    advice = agent = 0
    for row in load_assignments():
        if row.get("forced_condition"):
            continue
        if row.get("condition") == "advice":
            advice += 1
        elif row.get("condition") == "agent":
            agent += 1
    return advice, agent


def next_condition() -> str:
    advice, agent = assignment_counts()
    return "advice" if advice <= agent else "agent"


def clean_response(payload: dict, received_at: str) -> dict:
    condition = payload.get("condition")
    if condition not in ("advice", "agent"):
        raise ValueError("condition")
    inquiry = payload.get("inquiry") if isinstance(payload.get("inquiry"), dict) else {}
    return {
        "participant_code": clip(payload.get("participant_code"), 40),
        "condition": condition,
        "forced_condition": bool(payload.get("forced_condition")),
        "goal": clip(payload.get("goal"), 200),
        "confidence_bar": payload.get("confidence_bar"),
        "preauthorised": as_list(payload.get("preauthorised")),
        "first_decision": clip(payload.get("first_decision"), 40),
        "authorised": as_list(payload.get("authorised")),
        "stopped": as_list(payload.get("stopped")),
        "final_actions": as_list(payload.get("final_actions")),
        "outcome": clip(payload.get("outcome"), 40),
        "harm": bool(payload.get("harm")),
        "injury": bool(payload.get("injury")),
        "inquiry_account": clip(inquiry.get("account")),
        "single_actor": clip(inquiry.get("single"), 80),
        "last_human": clip(inquiry.get("last_human"), 20),
        "last_human_who": clip(inquiry.get("last_human_who")),
        "clarity": inquiry.get("clarity"),
        "sureness": inquiry.get("sureness"),
        "shared": as_list(inquiry.get("shared")),
        "other_notes": clip(inquiry.get("other_notes")),
        "started_at": clip(payload.get("started_at"), 40),
        "submitted_at": clip(payload.get("submitted_at"), 40),
        "received_at": received_at,
        "session_id": clip(payload.get("session_id"), 80),
    }


def resolve_app_file(url_path: str) -> Path | None:
    """Map a request path onto a file inside app/.

    The standard library's directory handler can answer the site root
    with 'File not found' when the folder path ends in a slash. Open the
    file ourselves instead.
    """
    path = unquote(urlparse(url_path).path)
    if path == "/export":
        path = "/export.html"
    if path in ("", "/"):
        path = "/index.html"
    elif path.endswith("/"):
        path += "index.html"
    parts = []
    for part in path.split("/"):
        if part in ("", "."):
            continue
        if part == "..":
            return None
        parts.append(part)
    if not parts:
        parts = ["index.html"]
    candidate = APP.joinpath(*parts)
    try:
        candidate.resolve().relative_to(APP.resolve())
    except ValueError:
        return None
    if candidate.is_dir():
        candidate = candidate / "index.html"
    return candidate


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Set this before the base class handles the request. Some Python
        # versions store the directory argument only after the response.
        self.directory = str(APP)
        super().__init__(*args, directory=self.directory, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/responses":
            self.handle_export()
            return
        target = resolve_app_file(self.path)
        if target is None or not target.is_file():
            self.send_missing()
            return
        body = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", self.guess_type(str(target)))
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_missing(self):
        body = (
            "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\">"
            "<title>File not found</title></head><body>"
            "<h1>That page is not in the file.</h1>"
            "<p>The game is at <a href=\"/\">the start page</a>.</p>"
            "<p>If that page is the one you opened, stop this window with Ctrl-C. "
            "Go to the folder that contains server.py and the app folder, then run python3 server.py again.</p>"
            "</body></html>"
        ).encode("utf-8")
        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/start":
            self.handle_start()
            return
        if parsed.path == "/api/responses":
            self.handle_save()
            return
        self.send_error(404)

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length < 0 or length > MAX_BODY:
            raise ValueError("size")
        raw = self.rfile.read(length) if length else b"{}"
        payload = json.loads(raw.decode("utf-8"))
        if not isinstance(payload, dict):
            raise ValueError("object")
        return payload

    def send_json(self, payload, status: int = 200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def authorised_export(self) -> bool:
        given = self.headers.get("X-Passphrase", "")
        return secrets.compare_digest(given, passphrase())

    def handle_start(self):
        try:
            payload = self.read_json()
        except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
            self.send_error(400, "Bad start")
            return
        forced = payload.get("condition")
        is_forced = forced in ("advice", "agent")
        condition = forced if is_forced else next_condition()
        record = {
            "session_id": secrets.token_hex(8),
            "condition": condition,
            "forced_condition": is_forced,
            "started_at": now(),
        }
        with LOCK:
            if database_url():
                save_assignment(record)
            else:
                with ASSIGNMENTS.open("a", encoding="utf-8") as handle:
                    handle.write(json.dumps(record) + "\n")
        self.send_json(record)

    def handle_save(self):
        try:
            payload = self.read_json()
            record = clean_response(payload, now())
        except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
            self.send_error(400, "Bad response")
            return
        with LOCK:
            if database_url():
                save_response(record)
            else:
                with RESPONSES.open("a", encoding="utf-8") as handle:
                    handle.write(json.dumps(record, ensure_ascii=False) + "\n")
        self.send_json({"ok": True})

    def handle_export(self):
        if not self.authorised_export():
            self.send_error(401, "Wrong passphrase")
            return
        rows = load_responses()
        accept = self.headers.get("Accept", "")
        if "text/csv" in accept:
            buffer = io.StringIO()
            writer = csv.DictWriter(buffer, fieldnames=COLUMNS, extrasaction="ignore")
            writer.writeheader()
            for row in rows:
                flat = {key: csv_safe(join(row.get(key))) for key in COLUMNS}
                writer.writerow(flat)
            body = buffer.getvalue().encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/csv; charset=utf-8")
            self.send_header("Content-Disposition", "attachment; filename=oracle-responses.csv")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        self.send_json(rows)

    def log_message(self, fmt: str, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))


def main():
    import os

    port = int(os.environ.get("PORT", "8000"))
    code = passphrase()
    def say(line=""):
        print(line, flush=True)

    say("")
    say("The wargame is running. Leave this window open.")
    say("")
    say("  Play:    http://127.0.0.1:%s" % port)
    say("  Answers: http://127.0.0.1:%s/export" % port)
    say("  Passphrase for the answers page: %s" % code)
    say("")
    say("That address only works on this computer.")
    say("Press Ctrl-C here when you want to stop.")
    say("")
    init_db()
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    server.serve_forever()


if __name__ == "__main__":
    main()
