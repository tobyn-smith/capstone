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
        }
        with patch.dict(os.environ, env):
            text = "\n".join(server.startup_lines(8000))
        self.assertIn("https://ts-6010-db607dbe410e.herokuapp.com/admin", text)
        self.assertIn("Findings are stored in Postgres.", text)
        self.assertNotIn("do-not-print-this", text)
        self.assertNotIn("127.0.0.1", text)

    def test_local_startup_still_prints_the_passphrase(self):
        env = {"DYNO": "", "PASSPHRASE": "local-phrase", "DATABASE_URL": ""}
        with patch.dict(os.environ, env):
            text = "\n".join(server.startup_lines(8000))
        self.assertIn("http://127.0.0.1:8000/admin", text)
        self.assertIn("local-phrase", text)


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
        status, body = self.fetch("/")
        self.assertEqual(status, 200)
        self.assertIn(b"INTL 6010", body)
        self.assertIn(b"game.js", body)

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


if __name__ == "__main__":
    unittest.main()
