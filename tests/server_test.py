import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path
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

    def test_parent_path_is_rejected(self):
        self.assertIsNone(server.resolve_app_file("/../server.py"))
        self.assertIsNone(server.resolve_app_file("/../../etc/passwd"))


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
