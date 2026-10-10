"""Real subprocess listeners verify bounded replacement and port isolation."""
import subprocess
import sys
import unittest
from scripts.dev.port import release_port


class DevPortTests(unittest.TestCase):
    def listener(self, ignore_term=False):
        code = ('import socket,signal,time; '
                + ('signal.signal(signal.SIGTERM,signal.SIG_IGN); ' if ignore_term else '')
                + 's=socket.socket(); s.bind(("127.0.0.1",0)); s.listen(); '
                  'print(s.getsockname()[1],flush=True); time.sleep(60)')
        child = subprocess.Popen([sys.executable, '-c', code], stdout=subprocess.PIPE, text=True)
        def cleanup():
            if child.poll() is None: child.kill()
            child.wait(); child.stdout.close()
        self.addCleanup(cleanup)
        return child, int(child.stdout.readline())

    def test_replaces_listener_and_preserves_other_ports(self):
        child, port = self.listener()
        other, _ = self.listener()
        release_port(port)
        child.wait(timeout=3)
        self.assertIsNone(other.poll())
        release_port(port)  # An empty port remains a valid start.
        replacement = subprocess.run([sys.executable, '-c',
            f'import socket; s=socket.socket(); s.bind(("127.0.0.1",{port})); s.listen()'], check=True)
        self.assertEqual(replacement.returncode, 0)

    def test_unresponsive_listener_is_killed(self):
        child, port = self.listener(ignore_term=True)
        release_port(port)
        self.assertEqual(child.wait(timeout=3), -9)
