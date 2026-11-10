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


INQUIRY = {
    "account": "Officials set the goal and someone carried out the measures after the tanker.",
    "single": "oracle",
    "last_human": "no",
    "clarity": 3,
    "sureness": 5,
}


def inquiry(**overrides):
    row = dict(INQUIRY)
    row.update(overrides)
    return row


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

    def test_admin_tools_page(self):
        found = server.resolve_app_file("/admin/tools")
        self.assertEqual(found.name, "tools.html")
        self.assertTrue(found.is_file())
        self.assertNotEqual(found.resolve(), server.resolve_app_file("/admin").resolve())

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
        sid = "ab" * 8
        assigned = {"session_id": sid, "condition": "sequence"}
        good = server.clean_response(
            {
                "condition": "sequence",
                "session_id": sid,
                "confidence_bar": None,
                "inquiry": inquiry(
                    last_human_who="should be dropped",
                ),
            },
            "t",
            assigned,
        )
        self.assertEqual(good["single_actor"], "oracle")
        self.assertEqual(good["last_human_who"], "")
        self.assertEqual(good["clarity"], 3)
        for bad in (
            {"clarity": 9},
            {"clarity": True},
            {"clarity": "3"},
            {"single": "anyone"},
            {"last_human": "maybe"},
        ):
            with self.assertRaises(ValueError):
                server.clean_response(
                    {"condition": "sequence", "session_id": sid, "inquiry": {**INQUIRY, **bad}},
                    "t",
                    assigned,
                )
        with self.assertRaises(ValueError):
            server.clean_response({"condition": "sequence", "session_id": "../x", "inquiry": {}}, "t")
        with self.assertRaises(ValueError):
            server.clean_response({"condition": "sequence", "inquiry": {}}, "t")

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
        sid = "ab" * 8
        assigned = {"session_id": sid, "condition": "sequence"}
        record = server.clean_response(
            {
                "condition": "sequence",
                "session_id": sid,
                "inquiry": inquiry(account="Officials set the goal and ORACLE acted after the tanker was damaged."),
            },
            "t",
            assigned,
        )
        self.assertEqual(record["condition"], "sequence")
        self.assertEqual(record["night_kind"], "sequence")
        self.assertEqual(record["who_executed"], "oracle")
        self.assertEqual(
            record["inquiry_account"],
            "Officials set the goal and ORACLE acted after the tanker was damaged.",
        )

    def test_a_blank_code_stays_blank_and_notes_are_kept(self):
        sid = "ab" * 8
        assigned = {"session_id": sid, "condition": "sequence"}
        record = server.clean_response(
            {
                "condition": "sequence",
                "session_id": sid,
                "participant_code": "",
                    "inquiry": inquiry(
                    account="Officials set the goal and ORACLE acted after the tanker was damaged.",
                    notes="A spare thought.",
                ),
            },
            "t",
            assigned,
        )
        self.assertEqual(record["participant_code"], "")
        self.assertEqual(record["notes"], "A spare thought.")
        self.assertEqual(record["other_notes"], "A spare thought.")
        self.assertNotIn("goal", record)
        self.assertNotIn("preauthorised", record)
        self.assertNotIn("injury", record)
        self.assertNotIn("shared", record)

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
        advice_sid = "aa" * 8
        agent_sid = "bb" * 8
        advice = server.clean_response(
            {
                "condition": "advice",
                "session_id": advice_sid,
                "inquiry": inquiry(account="Officials asked ORACLE and then chose to issue the four measures."),
            },
            "t",
            {"session_id": advice_sid, "condition": "advice"},
        )
        agent = server.clean_response(
            {
                "condition": "agent",
                "session_id": agent_sid,
                "inquiry": inquiry(account="Officials set the agenda and ORACLE issued the four measures."),
            },
            "t",
            {"session_id": agent_sid, "condition": "agent"},
        )
        self.assertEqual(advice["condition"], "advice")
        self.assertEqual(advice["who_executed"], "officials")
        self.assertEqual(advice["final_actions"], ["warning", "patrols", "freeze", "inspections"])
        self.assertTrue(advice["harm"])
        self.assertEqual(advice["night_kind"], "matched")
        self.assertTrue(advice["in_main_comparison"])
        self.assertEqual(advice["gov_attribution"], 0)
        self.assertEqual(agent["condition"], "agent")
        self.assertEqual(agent["who_executed"], "oracle")
        self.assertEqual(agent["night_kind"], "matched")
        with self.assertRaises(ValueError):
            server.clean_response({"condition": "watch", "inquiry": {}}, "t")


class AssignmentTests(unittest.TestCase):
    def setUp(self):
        import tempfile

        self.folder = Path(tempfile.mkdtemp())
        self.assignments = self.folder / "assignments.jsonl"
        self.responses = self.folder / "responses.jsonl"
        self.env = patch.dict(os.environ, {"DATABASE_URL": "", "ENABLE_TWO_VERSIONS": "1"}, clear=False)
        self.env.start()
        self.p_assign = patch.object(server, "ASSIGNMENTS", self.assignments)
        self.p_resp = patch.object(server, "RESPONSES", self.responses)
        self.p_assign.start()
        self.p_resp.start()

    def tearDown(self):
        self.p_resp.stop()
        self.p_assign.stop()
        self.env.stop()

    def test_flag_off_still_assigns_advice_or_agent(self):
        for value in ("0", "false", "off", "no"):
            with patch.dict(os.environ, {"ENABLE_TWO_VERSIONS": value, "DATABASE_URL": ""}):
                rows = []
                for _ in range(20):
                    rows.append({"condition": server.pick_condition(rows)})
                live = [row["condition"] for row in rows]
                self.assertTrue(all(key in ("advice", "agent") for key in live), value)
                self.assertLessEqual(abs(live.count("advice") - live.count("agent")), 1, value)
                self.assertTrue(server.two_versions_enabled())

    def test_unset_flag_assigns_advice_or_agent(self):
        with patch.dict(os.environ, {"ENABLE_TWO_VERSIONS": "", "DATABASE_URL": ""}):
            rows = []
            for _ in range(20):
                rows.append({"condition": server.pick_condition(rows)})
            live = [row["condition"] for row in rows]
            self.assertTrue(all(key in ("advice", "agent") for key in live))
            self.assertLessEqual(abs(live.count("advice") - live.count("agent")), 1)

    def test_forced_starts_do_not_count_toward_balance(self):
        with patch.dict(os.environ, {"ENABLE_TWO_VERSIONS": "1", "DATABASE_URL": ""}):
            rows = [{"condition": "agent", "forced_condition": True}] * 8
            for _ in range(20):
                rows.append({"condition": server.pick_condition(rows)})
            live = [row["condition"] for row in rows if not row.get("forced_condition")]
            self.assertEqual(len(live), 20)
            self.assertLessEqual(abs(live.count("advice") - live.count("agent")), 1)

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

    def test_a_preview_condition_is_forced(self):
        with patch.dict(os.environ, {"ENABLE_TWO_VERSIONS": "1", "DATABASE_URL": ""}):
            advice = server.start_record(wanted="advice")
            agent = server.start_record(wanted="agent")
        self.assertEqual(advice["condition"], "advice")
        self.assertTrue(advice["forced_condition"])
        self.assertEqual(agent["condition"], "agent")
        self.assertTrue(agent["forced_condition"])

    def test_a_preview_arm_does_not_reuse_the_other_arm(self):
        with patch.dict(os.environ, {"ENABLE_TWO_VERSIONS": "1", "DATABASE_URL": ""}):
            advice = server.start_record(wanted="advice")
            agent = server.start_record(advice["session_id"], wanted="agent")
            same = server.start_record(advice["session_id"], wanted="advice")
        self.assertEqual(advice["condition"], "advice")
        self.assertEqual(agent["condition"], "agent")
        self.assertTrue(agent["forced_condition"])
        self.assertNotEqual(advice["session_id"], agent["session_id"])
        self.assertEqual(same["session_id"], advice["session_id"])
        self.assertEqual(same["condition"], "advice")

    def test_new_actor_codes_are_kept(self):
        sid = "cd" * 8
        assigned = {"session_id": sid, "condition": "agent"}
        row = server.clean_response(
            {
                "condition": "agent",
                "session_id": sid,
                "inquiry": {
                    "account": "Officials set the goal and ORACLE acted after the tanker was damaged.",
                    "single": "lei",
                    "last_human": "yes",
                    "last_human_who": "the duty officer",
                    "clarity": 2,
                    "sureness": 4,
                    "other_who": "",
                    "notes": "Lei, and a note.",
                },
            },
            "t",
            assigned,
        )
        self.assertEqual(row["single_actor"], "lei")
        self.assertEqual(row["notes"], "Lei, and a note.")
        self.assertEqual(row["gov_attribution"], 0)

    def test_submit_must_match_the_start(self):
        sid = "ab" * 8
        self.assignments.write_text(
            '{"session_id":"%s","condition":"advice","forced_condition":false,"started_at":"t"}\n' % sid,
            encoding="utf-8",
        )
        ok = server.clean_response(
            {"condition": "advice", "session_id": sid, "inquiry": inquiry()},
            "t",
        )
        self.assertEqual(ok["condition"], "advice")
        with self.assertRaises(ValueError):
            server.clean_response(
                {"condition": "agent", "session_id": sid, "inquiry": inquiry()},
                "t",
            )
        with self.assertRaises(ValueError):
            server.clean_response(
                {"condition": "advice", "inquiry": inquiry()},
                "t",
            )
        with self.assertRaises(ValueError):
            server.clean_response(
                {
                    "condition": "advice",
                    "session_id": "ee" * 8,
                    "inquiry": inquiry(),
                },
                "t",
            )

    def test_an_advice_finding_records_the_matched_later_night(self):
        sid = "ab" * 8
        self.assignments.write_text(
            '{"session_id":"%s","condition":"advice","forced_condition":false,"started_at":"t","two_versions":true}\n' % sid,
            encoding="utf-8",
        )
        record = server.clean_response(
            {
                "condition": "advice",
                "session_id": sid,
                "inquiry": inquiry(account="Officials asked ORACLE for advice and then issued the four measures."),
            },
            "t",
        )
        self.assertEqual(record["final_actions"], ["warning", "patrols", "freeze", "inspections"])
        self.assertEqual(record["outcome"], "escalated")
        self.assertTrue(record["harm"])
        self.assertEqual(record["who_executed"], "officials")
        self.assertEqual(record["night_kind"], "matched")
        self.assertTrue(record["two_versions"])
        self.assertTrue(record["in_main_comparison"])
        self.assertEqual(record["gov_attribution"], 0)

    def test_forced_advice_is_not_in_the_main_comparison(self):
        sid = "ab" * 8
        self.assignments.write_text(
            '{"session_id":"%s","condition":"advice","forced_condition":true,"started_at":"t","two_versions":true}\n' % sid,
            encoding="utf-8",
        )
        record = server.clean_response(
            {
                "condition": "advice",
                "session_id": sid,
                "forced_condition": True,
                "inquiry": inquiry(single="me"),
            },
            "t",
        )
        self.assertTrue(record["forced_condition"])
        self.assertFalse(record["in_main_comparison"])
        self.assertEqual(record["gov_attribution"], 1)

    def test_inquiry_answers_are_required(self):
        sid = "ab" * 8
        assigned = {"session_id": sid, "condition": "agent", "forced_condition": False}
        with self.assertRaises(ValueError):
            server.clean_response(
                {"condition": "agent", "session_id": sid, "inquiry": inquiry(account="Too short.")},
                "t",
                assigned,
            )
        with self.assertRaises(ValueError):
            server.clean_response(
                {"condition": "agent", "session_id": sid, "inquiry": inquiry(single="other", other_who="")},
                "t",
                assigned,
            )
        with self.assertRaises(ValueError):
            server.clean_response(
                {
                    "condition": "agent",
                    "session_id": sid,
                    "inquiry": inquiry(last_human="yes", last_human_who=""),
                },
                "t",
                assigned,
            )
        with self.assertRaises(ValueError):
            server.clean_response(
                {"condition": "agent", "session_id": sid, "inquiry": inquiry(clarity=None)},
                "t",
                assigned,
            )
        kept = server.clean_response(
            {
                "condition": "agent",
                "session_id": sid,
                "inquiry": inquiry(single="other", other_who="a neighbouring ministry"),
            },
            "t",
            assigned,
        )
        self.assertEqual(kept["other_who"], "a neighbouring ministry")
        self.assertEqual(kept["gov_attribution"], 0)
        with self.assertRaises(ValueError):
            server.clean_response(
                {
                    "condition": "agent",
                    "session_id": sid,
                    "inquiry": inquiry(single="other", other_who="x"),
                },
                "t",
                assigned,
            )

    def test_started_at_comes_from_the_assignment(self):
        sid = "ab" * 8
        assigned = {
            "session_id": sid,
            "condition": "advice",
            "forced_condition": False,
            "started_at": "2026-11-09T12:00:00+00:00",
        }
        record = server.clean_response(
            {
                "condition": "advice",
                "session_id": sid,
                "started_at": "",
                "inquiry": inquiry(),
            },
            "t",
            assigned,
        )
        self.assertEqual(record["started_at"], "2026-11-09T12:00:00+00:00")

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
        self.assertTrue(counts["two_versions"])
        self.assertEqual(counts["night_kind"]["starts"]["matched"], 3)
        self.assertEqual(counts["night_kind"]["starts"]["sequence"], 1)
        self.assertEqual(counts["night_kind"]["findings"]["unmatched"], 1)
        self.assertEqual(counts["night_kind"]["findings"]["sequence"], 1)
        self.assertEqual(counts["forced"]["starts"]["unforced"], 4)
        self.assertEqual(counts["in_main_comparison"]["starts"]["yes"], 3)
        self.assertEqual(counts["in_main_comparison"]["findings"]["yes"], 0)
        self.assertEqual(counts["who_executed"]["starts"]["officials"], 1)
        self.assertEqual(counts["who_executed"]["starts"]["oracle"], 3)
        leftover_ids = {row["session_id"] for row in counts["audit"]["starts_without_finding"]}
        self.assertEqual(leftover_ids, {"bbbbbbbbbbbbbbbb", "cccccccccccccccc"})

    def test_a_second_finding_for_the_same_session_is_kept_as_the_first(self):
        sid = "ab" * 8
        self.assignments.write_text(
            '{"session_id":"%s","condition":"advice","forced_condition":false,"started_at":"t"}\n' % sid,
            encoding="utf-8",
        )
        first = server.clean_response(
            {
                "condition": "advice",
                "session_id": sid,
                "inquiry": inquiry(account="The first finding is the one that stays on the file."),
            },
            "t1",
        )
        self.responses.write_text(json.dumps(first) + "\n", encoding="utf-8")
        self.assertTrue(server.finding_exists(sid))
        with self.assertRaises(ValueError):
            server.clean_response(
                {
                    "condition": "agent",
                    "session_id": sid,
                    "inquiry": inquiry(account="A later write must not change the version on the file."),
                },
                "t2",
            )

    def test_remove_needs_a_hex_session_id(self):
        self.assertTrue(server.SESSION_ID.fullmatch("ab" * 8))
        self.assertIsNone(server.SESSION_ID.fullmatch("drop"))
        self.assertIsNone(server.SESSION_ID.fullmatch(""))


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
        self.assertIn(b'href="/admin"', body)
        self.assertIn(b"[admin]", body)
        self.assertNotIn(b"Passphrase", body)
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

    def test_register_shows_the_other_write_in(self):
        source = (Path(__file__).resolve().parents[1] / "app" / "export.js").read_text(encoding="utf-8")
        self.assertIn("function namedActor(row)", source)
        self.assertIn("row.other_who", source)

    def test_admin_and_export_are_the_same_page(self):
        status, admin = self.fetch("/admin")
        self.assertEqual(status, 200)
        self.assertIn(b"Register of findings", admin)
        self.assertNotIn(b"Commission of Inquiry", admin)
        status, export = self.fetch("/export")
        self.assertEqual(status, 200)
        self.assertEqual(admin, export)

    def test_admin_tools_is_a_second_page(self):
        status, tools = self.fetch("/admin/tools")
        self.assertEqual(status, 200)
        self.assertIn(b"Study tools", tools)
        self.assertIn(b'src="/tools.js"', tools)
        self.assertIn(b'href="/styles.css"', tools)
        self.assertNotIn(b"Register of findings", tools)
        status, admin = self.fetch("/admin")
        self.assertNotEqual(tools, admin)

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

    def test_start_is_still_two_arm_when_the_flag_is_off(self):
        import tempfile

        folder = Path(tempfile.mkdtemp())
        with patch.dict(os.environ, {"DATABASE_URL": "", "ENABLE_TWO_VERSIONS": "0"}):
            with patch.object(server, "ASSIGNMENTS", folder / "assignments.jsonl"), patch.object(
                server, "RESPONSES", folder / "responses.jsonl"
            ):
                first = self._start(b"{}")
        self.assertIn(first["condition"], ("advice", "agent"))
        self.assertTrue(first["two_versions"])
        self.assertFalse(first["forced_condition"])

    def test_start_preview_opens_the_other_arm(self):
        import tempfile

        folder = Path(tempfile.mkdtemp())
        assignments = folder / "assignments.jsonl"
        responses = folder / "responses.jsonl"
        with patch.dict(os.environ, {"DATABASE_URL": "", "ENABLE_TWO_VERSIONS": "1"}):
            with patch.object(server, "ASSIGNMENTS", assignments), patch.object(
                server, "RESPONSES", responses
            ):
                first = self._start(json.dumps({"condition": "advice"}).encode("utf-8"))
                second = self._start(
                    json.dumps({"session_id": first["session_id"], "condition": "agent"}).encode("utf-8")
                )
                again = self._start(
                    json.dumps({"session_id": first["session_id"], "condition": "advice"}).encode("utf-8")
                )
        self.assertEqual(first["condition"], "advice")
        self.assertTrue(first["forced_condition"])
        self.assertEqual(second["condition"], "agent")
        self.assertTrue(second["forced_condition"])
        self.assertNotEqual(first["session_id"], second["session_id"])
        self.assertEqual(again["session_id"], first["session_id"])

    def test_start_defaults_to_advice_or_agent(self):
        import tempfile

        folder = Path(tempfile.mkdtemp())
        with patch.dict(os.environ, {"DATABASE_URL": "", "ENABLE_TWO_VERSIONS": ""}):
            with patch.object(server, "ASSIGNMENTS", folder / "assignments.jsonl"), patch.object(
                server, "RESPONSES", folder / "responses.jsonl"
            ):
                first = self._start(b"{}")
        self.assertIn(first["condition"], ("advice", "agent"))
        self.assertTrue(first["two_versions"])

    def test_a_second_save_keeps_the_first_finding(self):
        import tempfile

        folder = Path(tempfile.mkdtemp())
        assignments = folder / "assignments.jsonl"
        responses = folder / "responses.jsonl"
        finding = {
            "condition": "",
            "session_id": "",
            "inquiry": inquiry(account="Officials set the goal and ORACLE acted first after the tanker."),
        }
        later = {
            "condition": "",
            "session_id": "",
            "inquiry": inquiry(account="A second write tried to replace the first finding on the file."),
        }
        with patch.dict(os.environ, {"DATABASE_URL": "", "ENABLE_TWO_VERSIONS": ""}):
            with patch.object(server, "ASSIGNMENTS", assignments), patch.object(
                server, "RESPONSES", responses
            ):
                started = self._start(b"{}")
                finding["condition"] = started["condition"]
                later["condition"] = started["condition"]
                finding["session_id"] = started["session_id"]
                later["session_id"] = started["session_id"]
                for payload in (finding, later):
                    request = urllib.request.Request(
                        "http://127.0.0.1:%s/api/responses" % self.port,
                        data=json.dumps(payload).encode("utf-8"),
                        headers={"Content-Type": "application/json"},
                    )
                    with urllib.request.urlopen(request) as response:
                        self.assertEqual(response.status, 200)
                rows = [
                    json.loads(line)
                    for line in responses.read_text(encoding="utf-8").splitlines()
                    if line.strip()
                ]
        self.assertEqual(len(rows), 1)
        self.assertIn("acted first", rows[0]["inquiry_account"])

    def test_remove_rejects_a_session_id_that_is_not_hex(self):
        with patch.object(server.Handler, "authorised_export", return_value=True):
            try:
                urllib.request.urlopen(
                    urllib.request.Request(
                        "http://127.0.0.1:%s/api/responses/remove" % self.port,
                        data=b'{"session_id":"drop"}',
                        headers={"Content-Type": "application/json"},
                    )
                )
            except urllib.error.HTTPError as error:
                self.assertEqual(error.code, 400)
            else:
                self.fail("remove should refuse a session id that is not 16 hex characters")

    def test_a_finding_with_an_unknown_session_is_refused(self):
        import tempfile

        folder = Path(tempfile.mkdtemp())
        with patch.dict(os.environ, {"DATABASE_URL": ""}):
            with patch.object(server, "ASSIGNMENTS", folder / "assignments.jsonl"), patch.object(
                server, "RESPONSES", folder / "responses.jsonl"
            ):
                request = urllib.request.Request(
                    "http://127.0.0.1:%s/api/responses" % self.port,
                    data=json.dumps(
                        {
                            "condition": "sequence",
                            "session_id": "ee" * 8,
                            "inquiry": inquiry(),
                        }
                    ).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                try:
                    urllib.request.urlopen(request)
                except urllib.error.HTTPError as error:
                    self.assertEqual(error.code, 400)
                else:
                    self.fail("a finding with no start row should be refused")

    def test_a_finding_without_a_session_is_refused(self):
        request = urllib.request.Request(
            "http://127.0.0.1:%s/api/responses" % self.port,
            data=json.dumps(
                {
                    "condition": "sequence",
                    "inquiry": inquiry(),
                }
            ).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )
        try:
            urllib.request.urlopen(request)
        except urllib.error.HTTPError as error:
            self.assertEqual(error.code, 400)
        else:
            self.fail("a finding with no session should be refused")

    def test_export_and_counts_need_the_passphrase(self):
        for path in ("/api/responses", "/api/responses?set=main", "/api/counts"):
            try:
                urllib.request.urlopen("http://127.0.0.1:%s%s" % (self.port, path))
            except urllib.error.HTTPError as error:
                self.assertEqual(error.code, 401, path)
            else:
                self.fail("%s should need the passphrase" % path)

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


class InquiryFormTests(unittest.TestCase):
    def test_all_inquiry_questions_are_in_the_form_on_open(self):
        source = (Path(__file__).resolve().parents[1] / "app" / "game.js").read_text(encoding="utf-8")
        inquiry = source.split("function inquiry()", 1)[1].split("function syncInquiry", 1)[0]
        self.assertNotIn("accountReady", source)
        self.assertNotIn("open ?", inquiry)
        self.assertNotIn("const open", inquiry)
        for line in (
            'qhead(1, "Who was responsible for what Araknes did?")',
            'qhead(2, "Name one actor, or say you can\'t.")',
            'qhead(3, "Could a person still have stopped this?")',
            'qhead(4, "How clear was it who was responsible?")',
            'qhead(5, "How sure are you?")',
            '"Notes, if you want"',
            "codeField()",
            'win("The file"',
            '"File the finding"',
        ):
            self.assertIn(line, inquiry)
        self.assertLess(inquiry.find('"Notes, if you want"'), inquiry.find("codeField()"))
        self.assertLess(inquiry.find("codeField()"), inquiry.find('win("The file"'))
        self.assertLess(inquiry.find('win("The file"'), inquiry.find('"File the finding"'))
        self.assertIn("Participant code, if you were given one", source)
        self.assertIn('q.lastHuman === "yes" || q.lastHuman === "unsure"', inquiry)
        self.assertIn("onChange:", inquiry)
        self.assertIn('(q.otherWho || "").trim().length < 2', source)
        self.assertIn("previewMismatches", source)
        self.assertIn("who_executed", source)
        self.assertIn('night_kind: nightKind()', source)
        self.assertNotIn("preauthorised:", source)
        self.assertIn("ADVICE_ACTS", source)
        self.assertIn("AGENT_ACTS", source)
        self.assertIn('if (state.condition === "advice")', source)
        self.assertIn("ADVICE_HOLD", source)
        self.assertNotIn('return [SCENES[0], SCENES[1]]', source)
        chrome = source.split("function paintChrome()", 1)[1].split("function render()", 1)[0]
        self.assertIn('next.hidden = state.step === "inquiry"', chrome)
        self.assertNotIn('"File the finding"', chrome)
        consent = source.split("function consent()", 1)[1].split("function codeField", 1)[0]
        self.assertNotIn("codeField()", consent)
        self.assertNotIn("real name", consent)
        self.assertIn("Please answer truthfully.", consent)
        self.assertIn("fifteen minutes", consent)
        self.assertIn("tile-contact", consent)
        self.assertNotIn("tile-note", consent)


class ToolsExportTests(unittest.TestCase):
    def setUp(self):
        import tempfile

        self.folder = Path(tempfile.mkdtemp())
        self.assignments = self.folder / "assignments.jsonl"
        self.responses = self.folder / "responses.jsonl"
        self.env = patch.dict(os.environ, {"DATABASE_URL": ""}, clear=False)
        self.env.start()
        self.p_assign = patch.object(server, "ASSIGNMENTS", self.assignments)
        self.p_resp = patch.object(server, "RESPONSES", self.responses)
        self.p_assign.start()
        self.p_resp.start()

    def tearDown(self):
        self.p_resp.stop()
        self.p_assign.stop()
        self.env.stop()

    def test_main_export_drops_forced_sequence_and_unmatched_advice(self):
        main = server.clean_response(
            {"condition": "advice", "session_id": "aa" * 8, "inquiry": inquiry(single="me")},
            "t1",
            {"session_id": "aa" * 8, "condition": "advice", "forced_condition": False},
        )
        forced = server.clean_response(
            {"condition": "agent", "session_id": "bb" * 8, "inquiry": inquiry(), "forced_condition": True},
            "t2",
            {"session_id": "bb" * 8, "condition": "agent", "forced_condition": True},
        )
        sequence = server.clean_response(
            {"condition": "sequence", "session_id": "cc" * 8, "inquiry": inquiry()},
            "t3",
            {"session_id": "cc" * 8, "condition": "sequence"},
        )
        unmatched = {
            "session_id": "dd" * 8,
            "condition": "advice",
            "forced_condition": False,
            "final_actions": [],
            "night_kind": "",
        }
        self.responses.write_text(
            "".join(json.dumps(row) + "\n" for row in (main, forced, sequence, unmatched)),
            encoding="utf-8",
        )
        rows = server.export_rows("main")
        self.assertEqual([row["session_id"] for row in rows], ["aa" * 8])
        self.assertTrue(rows[0]["in_main_comparison"])
        all_rows = server.export_rows()
        self.assertEqual(len(all_rows), 4)

    def test_old_matched_rows_without_night_kind_enter_the_main_export(self):
        old = {
            "session_id": "ee" * 8,
            "condition": "agent",
            "forced_condition": False,
            "final_actions": ["warning", "patrols", "freeze", "inspections"],
            "night_kind": "",
            "who_executed": "",
        }
        self.responses.write_text(json.dumps(old) + "\n", encoding="utf-8")
        analysed = server.with_analysis(old)
        self.assertEqual(analysed["night_kind"], "matched")
        self.assertEqual(analysed["who_executed"], "oracle")
        self.assertTrue(analysed["in_main_comparison"])
        rows = server.export_rows("main")
        self.assertEqual([row["session_id"] for row in rows], ["ee" * 8])

    def test_tools_page_can_remove_a_start_with_no_finding(self):
        source = (Path(__file__).resolve().parents[1] / "app" / "tools.js").read_text(encoding="utf-8")
        self.assertIn("removeSitting", source)
        self.assertIn("Starts with no finding", source)
        self.assignments.write_text(
            '{"session_id":"%s","condition":"advice","forced_condition":false,"started_at":"t"}\n' % ("ab" * 8),
            encoding="utf-8",
        )
        counts = server.register_counts()
        leftover = counts["audit"]["starts_without_finding"]
        self.assertEqual(len(leftover), 1)
        server.drop_session("ab" * 8)
        self.assertEqual(server.register_counts()["starts"]["advice"], 0)


if __name__ == "__main__":
    unittest.main()
