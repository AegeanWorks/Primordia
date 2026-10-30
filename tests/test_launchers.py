"""One-click launchers: present, CRLF-safe on Windows and pointed at start.py."""

import sys
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import start  # noqa: E402  (the project root must be importable first)

START = ROOT / "start.py"
BATCH = ROOT / "start.bat"
SHELL = ROOT / "start.sh"
COMMAND = ROOT / "start.command"
ATTRIBUTES = ROOT / ".gitattributes"


class LauncherTests(unittest.TestCase):
    def test_every_launcher_exists(self):
        for path in (START, BATCH, SHELL, COMMAND, ATTRIBUTES):
            self.assertTrue(path.is_file(), path.name)

    def test_the_batch_file_uses_crlf(self):
        data = BATCH.read_bytes()
        self.assertEqual(0, data.replace(b"\r\n", b"").count(b"\n"),
                         "start.bat must use CRLF so cmd.exe parses it reliably")

    def test_the_launchers_point_at_start_py(self):
        self.assertIn("start.py", BATCH.read_text(encoding="utf-8"))
        self.assertIn("start.py", SHELL.read_text(encoding="utf-8"))
        self.assertIn("start.sh", COMMAND.read_text(encoding="utf-8"))
        self.assertIn("--open", START.read_text(encoding="utf-8"))

    def test_a_batch_failure_stays_visible(self):
        self.assertIn("pause", BATCH.read_text(encoding="utf-8").lower())

    def test_gitattributes_pins_launcher_line_endings(self):
        attributes = ATTRIBUTES.read_text(encoding="utf-8")
        self.assertIn("*.bat text eol=crlf", attributes)
        self.assertIn("*.sh text eol=lf", attributes)
        self.assertIn("*.command text eol=lf", attributes)

    def test_start_forwards_flags_to_the_web_command(self):
        with mock.patch.object(start, "main", return_value=0) as main:
            self.assertEqual(start.start(["--seed", "7", "--port", "9000"]), 0)
        main.assert_called_once_with(["web", "--open", "--seed", "7", "--port", "9000"])


if __name__ == "__main__":
    unittest.main()
