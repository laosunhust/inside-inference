"""Serve the browser application as static assets; no compute service."""
import argparse
from pathlib import Path
from scripts import ROOT
from scripts.dev.port import release_port
from scripts.dev.http_runtimes_generated import socket_server


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--directory', type=Path, default=ROOT / 'out/intro-page')
    args = parser.parse_args()
    directory = args.directory.resolve()
    if not directory.is_relative_to((ROOT / 'out').resolve()):
        parser.error('Generated site directory must be under out/')
    release_port(args.port)
    server = socket_server(('127.0.0.1', args.port), directory=directory)
    print(f'Inside Inference: http://127.0.0.1:{args.port}/', flush=True)
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally: server.server_close()


if __name__ == '__main__': main()
