import json
import os
import socket
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path
from unittest.mock import patch
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import server


class ResolveTests(unittest.TestCase):
    def test_root_is_the_class_page(self):
        found = server.resolve_app_file("/")
        self.assertEqual(found.resolve(), (server.APP / "index.html").resolve())
        self.assertTrue(found.is_file())

    def test_export_page(self):
        found = server.resolve_app_file("/export")
        self.assertEqual(found.name, "export.html")
        self.assertTrue(found.is_file())

    def test_admin_page(self):
        found = server.resolve_app_file("/admin")
        self.assertEqual(found.resolve(), server.resolve_app_file("/export").resolve())
        self.assertTrue(found.is_file())

    def test_absolute_form_request_is_the_class_page(self):
        found = server.resolve_app_file("http://127.0.0.1:8000/")
        self.assertEqual(found.resolve(), (server.APP / "index.html").resolve())

    def test_parent_path_is_rejected(self):
        self.assertIsNone(server.resolve_app_file("/../server.py"))
        self.assertIsNone(server.resolve_app_file("/../../etc/passwd"))
        self.assertIsNone(server.resolve_app_file("/index.html%00.png"))

    def test_preview_worker_files_are_not_served(self):
        self.assertIsNone(server.resolve_app_file("/_worker.js"))
        self.assertIsNone(server.resolve_app_file("/_headers"))
        self.assertIsNone(server.resolve_app_file("/_redirects"))

    def test_a_finding_rejects_a_bad_score_and_a_bad_actor(self):
        good = server.clean_response(
            {
                "condition": "sequence",
                "session_id": "ab" * 8,
                "confidence_bar": None,
                "inquiry": {
                    "account": "Officials set the goal.",
                    "single": "oracle",
                    "last_human": "no",
                    "last_human_who": "should be dropped",
                    "clarity": 3,
                    "sureness": 5,
                },
            },
            "t",
        )
        self.assertEqual(good["single_actor"], "oracle")
        self.assertEqual(good["last_human_who"], "")
        self.assertEqual(good["clarity"], 3)
        for inquiry in (
            {"clarity": 9},
            {"clarity": True},
            {"clarity": "3"},
            {"single": "anyone"},
            {"last_human": "maybe"},
        ):
            with self.assertRaises(ValueError):
                server.clean_response({"condition": "sequence", "inquiry": inquiry}, "t")
        with self.assertRaises(ValueError):
            server.clean_response({"condition": "sequence", "session_id": "../x", "inquiry": {}}, "t")

    def test_heroku_database_url_asks_for_ssl(self):
        with patch.dict(os.environ, {"DATABASE_URL": "postgres://u:p@host:5432/db"}):
            self.assertEqual(
                server.database_url(),
                "postgresql://u:p@host:5432/db?sslmode=require",
            )
        with patch.dict(os.environ, {"DATABASE_URL": "postgresql://u:p@host/db?sslmode=verify-full"}):
            self.assertEqual(server.database_url(), "postgresql://u:p@host/db?sslmode=verify-full")
        with patch.dict(os.environ, {"DATABASE_URL": "postgresql://u:p@host/db?pool=1"}):
            self.assertEqual(server.database_url(), "postgresql://u:p@host/db?pool=1&sslmode=require")
        with patch.dict(os.environ, {"DATABASE_URL": ""}):
            self.assertEqual(server.database_url(), "")

    def test_heroku_startup_names_the_class_host_and_hides_the_passphrase(self):
        env = {
            "DYNO": "web.1",
            "PASSPHRASE": "do-not-print-this",
            "DATABASE_URL": "postgres://u:p@host:5432/db",
            "HEROKU_APP_NAME": "ts-6010",
        }
        with patch.dict(os.environ, env):
            text = "\n".join(server.startup_lines(8000))
        self.assertIn("https://ts-6010-db607dbe410e.herokuapp.com/admin", text)
        self.assertNotIn("https://ts-6010.herokuapp.com", text)
        self.assertIn("Findings are stored in Postgres.", text)
        self.assertNotIn("do-not-print-this", text)
        self.assertNotIn("127.0.0.1", text)

    def test_the_night_is_a_valid_finding(self):
        record = server.clean_response(
            {"condition": "sequence", "inquiry": {"account": "Officials set the goal and ORACLE acted."}},
            "t",
        )
        self.assertEqual(record["condition"], "sequence")
        self.assertEqual(record["inquiry_account"], "Officials set the goal and ORACLE acted.")

    def test_a_blank_code_stays_blank_and_notes_are_kept(self):
        record = server.clean_response(
            {
                "condition": "sequence",
                "participant_code": "",
                "inquiry": {
                    "account": "Officials set the goal and ORACLE acted.",
                    "other_notes": "A spare thought.",
                },
            },
            "t",
        )
        self.assertEqual(record["participant_code"], "")
        self.assertEqual(record["other_notes"], "A spare thought.")

    def test_drop_session_removes_the_local_row(self):
        import tempfile
        from pathlib import Path

        folder = Path(tempfile.mkdtemp())
        responses = folder / "responses.jsonl"
        assignments = folder / "assignments.jsonl"
        responses.write_text(
            '{"session_id":"keep","condition":"advice"}\n{"session_id":"drop","condition":"agent"}\n',
            encoding="utf-8",
        )
        assignments.write_text(
            '{"session_id":"keep","condition":"advice"}\n{"session_id":"drop","condition":"agent","forced_condition":false}\n',
            encoding="utf-8",
        )
        with patch.dict(os.environ, {"DATABASE_URL": ""}):
            with patch.object(server, "RESPONSES", responses), patch.object(server, "ASSIGNMENTS", assignments):
                server.drop_session("drop")
        left = responses.read_text(encoding="utf-8")
        started = assignments.read_text(encoding="utf-8")
        self.assertIn("keep", left)
        self.assertNotIn("drop", left)
        self.assertIn("keep", started)
        self.assertNotIn("drop", started)

    def test_local_startup_still_prints_the_passphrase(self):
        env = {"DYNO": "", "PASSPHRASE": "local-phrase", "DATABASE_URL": ""}
        with patch.dict(os.environ, env):
            text = "\n".join(server.startup_lines(8000))
        self.assertIn("http://127.0.0.1:8000/admin", text)
        self.assertIn("local-phrase", text)

    def test_old_advice_and_agent_rows_still_load(self):
        advice = server.clean_response(
            {"condition": "advice", "inquiry": {"account": "Officials set the goal and ORACLE advised."}},
            "t",
        )
        agent = server.clean_response(
            {"condition": "agent", "inquiry": {"account": "Officials set the goal and ORACLE acted."}},
            "t",
        )
        self.assertEqual(advice["condition"], "advice")
        self.assertEqual(agent["condition"], "agent")
        with self.assertRaises(ValueError):
            server.clean_response({"condition": "watch", "inquiry": {}}, "t")


class AssignmentTests(unittest.TestCase):
    def setUp(self):
        import tempfile

        self.folder = Path(tempfile.mkdtemp())
        self.assignments = self.folder / "assignments.jsonl"
        self.responses = self.folder / "responses.jsonl"
        self.env = patch.dict(os.environ, {"DATABASE_URL": "", "ENABLE_TWO_VERSIONS": ""}, clear=False)
        self.env.start()
        self.p_assign = patch.object(server, "ASSIGNMENTS", self.assignments)
        self.p_resp = patch.object(server, "RESPONSES", self.responses)
        self.p_assign.start()
        self.p_resp.start()

    def tearDown(self):
        self.p_resp.stop()
        self.p_assign.stop()
        self.env.stop()

    def test_flag_off_assigns_sequence_only(self):
        rows = []
        for _ in range(12):
            rows.append({"condition": server.pick_condition(rows)})
        self.assertTrue(all(row["condition"] == "sequence" for row in rows))

    def test_assignment_balance_when_flag_on(self):
        with patch.dict(os.environ, {"ENABLE_TWO_VERSIONS": "1", "DATABASE_URL": ""}):
            rows = [{"condition": "sequence"}] * 7
            for _ in range(20):
                rows.append({"condition": server.pick_condition(rows)})
            live = [row["condition"] for row in rows if row["condition"] in ("advice", "agent")]
            advice = live.count("advice")
            agent = live.count("agent")
            self.assertEqual(advice + agent, 20)
            self.assertLessEqual(abs(advice - agent), 1)

    def test_same_session_keeps_the_version(self):
        with patch.dict(os.environ, {"ENABLE_TWO_VERSIONS": "1", "DATABASE_URL": ""}):
            first = server.start_record()
            again = server.start_record(first["session_id"])
        self.assertEqual(first["session_id"], again["session_id"])
        self.assertEqual(first["condition"], again["condition"])
        self.assertIn(first["condition"], ("advice", "agent"))

    def test_submit_must_match_the_start(self):
        sid = "ab" * 8
        self.assignments.write_text(
            '{"session_id":"%s","condition":"advice","forced_condition":false,"started_at":"t"}\n' % sid,
            encoding="utf-8",
        )
        ok = server.clean_response(
            {"condition": "advice", "session_id": sid, "inquiry": {"account": "A finding."}},
            "t",
        )
        self.assertEqual(ok["condition"], "advice")
        with self.assertRaises(ValueError):
            server.clean_response(
                {"condition": "agent", "session_id": sid, "inquiry": {"account": "A finding."}},
                "t",
            )

    def test_counts_split_starts_and_findings(self):
        self.assignments.write_text(
            "\n".join(
                [
                    '{"session_id":"aaaaaaaaaaaaaaaa","condition":"advice"}',
                    '{"session_id":"bbbbbbbbbbbbbbbb","condition":"agent"}',
                    '{"session_id":"cccccccccccccccc","condition":"agent"}',
                    '{"session_id":"dddddddddddddddd","condition":"sequence"}',
                ]
            )
            + "\n",
            encoding="utf-8",
        )
        self.responses.write_text(
            "\n".join(
                [
                    '{"session_id":"aaaaaaaaaaaaaaaa","condition":"advice"}',
                    '{"session_id":"dddddddddddddddd","condition":"sequence"}',
                ]
            )
            + "\n",
            encoding="utf-8",
        )
        counts = server.register_counts()
        self.assertEqual(counts["starts"]["advice"], 1)
        self.assertEqual(counts["starts"]["agent"], 2)
        self.assertEqual(counts["starts"]["sequence"], 1)
        self.assertEqual(counts["findings"]["advice"], 1)
        self.assertEqual(counts["findings"]["agent"], 0)
        self.assertEqual(counts["findings"]["sequence"], 1)
        self.assertEqual(counts["starts_without_finding"]["agent"], 2)
        self.assertEqual(counts["starts_without_finding"]["advice"], 0)


class ServeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        cls.port = cls.httpd.server_address[1]
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()

    def fetch(self, path):
        with urllib.request.urlopen("http://127.0.0.1:%s%s" % (self.port, path)) as response:
            return response.status, response.read()

    def test_root_returns_the_class_page(self):
        with urllib.request.urlopen("http://127.0.0.1:%s/" % self.port) as response:
            body = response.read()
            headers = response.headers
        self.assertEqual(response.status, 200)
        self.assertIn(b"INTL 6010", body)
        self.assertIn(b"game.js", body)
        self.assertEqual(headers["X-Content-Type-Options"], "nosniff")
        self.assertEqual(headers["X-Frame-Options"], "DENY")
        self.assertIn("script-src 'self'", headers["Content-Security-Policy"])
        self.assertNotIn("Passphrase", headers.get("Content-Security-Policy", ""))

    def test_browser_sends_the_full_address(self):
        sock = socket.create_connection(("127.0.0.1", self.port))
        request = (
            "GET http://127.0.0.1:%s/ HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n"
            % self.port
        )
        sock.sendall(request.encode("ascii"))
        data = b""
        while True:
            chunk = sock.recv(4096)
            if not chunk:
                break
            data += chunk
        sock.close()
        self.assertTrue(data.startswith(b"HTTP/1.0 200"))
        self.assertIn(b"INTL 6010", data)
        self.assertNotIn(b"Nothing matches the given URI", data)

    def test_admin_and_export_are_the_same_page(self):
        status, admin = self.fetch("/admin")
        self.assertEqual(status, 200)
        self.assertIn(b"Register of findings", admin)
        self.assertNotIn(b"Commission of Inquiry", admin)
        status, export = self.fetch("/export")
        self.assertEqual(status, 200)
        self.assertEqual(admin, export)

    def test_static_files_load(self):
        status, css = self.fetch("/styles.css")
        self.assertEqual(status, 200)
        self.assertIn(b".welcome", css)
        status, logo = self.fetch("/uga-logo.png")
        self.assertEqual(status, 200)
        self.assertTrue(logo.startswith(b"\x89PNG"))

    def test_missing_page_is_plain(self):
        try:
            self.fetch("/no-such-page")
        except urllib.error.HTTPError as error:
            body = error.read()
            self.assertEqual(error.code, 404)
            self.assertIn(b"That page is not in the file.", body)
            self.assertNotIn(b"Nothing matches the given URI", body)
        else:
            self.fail("missing page should 404")

    def _start(self, payload):
        request = urllib.request.Request(
            "http://127.0.0.1:%s/api/start" % self.port,
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(request) as response:
            return json.loads(response.read().decode("utf-8"))

    def test_start_keeps_the_same_version_on_reopen(self):
        import tempfile

        folder = Path(tempfile.mkdtemp())
        assignments = folder / "assignments.jsonl"
        responses = folder / "responses.jsonl"
        with patch.dict(os.environ, {"DATABASE_URL": "", "ENABLE_TWO_VERSIONS": "1"}):
            with patch.object(server, "ASSIGNMENTS", assignments), patch.object(server, "RESPONSES", responses):
                first = self._start(b"{}")
                again = self._start(json.dumps({"session_id": first["session_id"]}).encode("utf-8"))
        self.assertEqual(first["session_id"], again["session_id"])
        self.assertEqual(first["condition"], again["condition"])
        self.assertIn(first["condition"], ("advice", "agent"))
        self.assertTrue(first["two_versions"])

    def test_start_is_sequence_when_the_second_night_is_off(self):
        import tempfile

        folder = Path(tempfile.mkdtemp())
        with patch.dict(os.environ, {"DATABASE_URL": "", "ENABLE_TWO_VERSIONS": ""}):
            with patch.object(server, "ASSIGNMENTS", folder / "assignments.jsonl"), patch.object(
                server, "RESPONSES", folder / "responses.jsonl"
            ):
                first = self._start(b"{}")
        self.assertEqual(first["condition"], "sequence")
        self.assertFalse(first["two_versions"])

    def test_a_full_register_refuses_another_start(self):
        with patch.object(server, "too_many_sessions", return_value=True):
            try:
                urllib.request.urlopen(
                    urllib.request.Request(
                        "http://127.0.0.1:%s/api/start" % self.port,
                        data=b"{}",
                        headers={"Content-Type": "application/json"},
                    )
                )
            except urllib.error.HTTPError as error:
                self.assertEqual(error.code, 429)
            else:
                self.fail("a full register should refuse a new sitting")


if __name__ == "__main__":
    unittest.main()
