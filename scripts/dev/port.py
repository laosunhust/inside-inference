"""Replace TCP listeners on the explicitly selected local development port."""
import os
import shutil
import signal
import subprocess
import time


def listeners(port):
    result = subprocess.run(['lsof', '-nP', '-t', f'-iTCP:{port}', '-sTCP:LISTEN'],
                            capture_output=True, text=True)
    if result.returncode not in (0, 1) or result.stderr.strip():
        raise RuntimeError(f'Cannot inspect port {port}: {result.stderr.strip()}')
    return {int(pid) for pid in result.stdout.split()}


def release_port(port):
    if not 0 <= port <= 65535:
        raise ValueError('Port must be between 0 and 65535')
    if port == 0:  # Let the OS choose an unused port.
        return
    if not shutil.which('lsof'):
        raise RuntimeError('serve-intro requires lsof to replace an occupied port')
    pids = listeners(port)
    if not pids:
        return
    if os.getpid() in pids:
        raise RuntimeError('Refusing to terminate the current process')
    print(f'Replacing listener(s) on port {port}: {sorted(pids)}', flush=True)
    for sig in (signal.SIGTERM, signal.SIGKILL):
        for pid in pids:
            try:
                os.kill(pid, sig)
            except ProcessLookupError:
                pass
        deadline = time.monotonic() + 2
        while time.monotonic() < deadline:
            current = listeners(port)
            if not current:
                return
            if current - pids:
                raise RuntimeError(f'Port {port} was acquired by another process during replacement')
            pids &= current
            time.sleep(0.05)
    raise RuntimeError(f'Could not release port {port}')
