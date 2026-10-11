"""Compose static preview and the shared HTTP application on the socket runtime."""
import argparse
from pathlib import Path
from scripts import ROOT
from scripts.dev.port import release_port
from scripts.dev.http_runtimes_generated import socket_server
from inside_inference.delivery.store import FileStore
from inside_inference.contract_runtime import decode_json


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--checkpoint', type=Path)
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--directory', type=Path, default=ROOT / 'out/intro-page')
    parser.add_argument('--evidence-directory', type=Path, default=ROOT / 'out/evidence')
    args = parser.parse_args()
    directory = args.directory.resolve()
    if not directory.is_relative_to((ROOT / 'out').resolve()):
        parser.error('Generated site directory must be under out/')
    checkpoint = decode_json(args.checkpoint.read_text()) if args.checkpoint else None
    release_port(args.port)
    server = socket_server(('127.0.0.1', args.port), directory=directory,
                           store=FileStore(args.evidence_directory), checkpoint=checkpoint)
    print(f'Inside Inference: http://127.0.0.1:{args.port}/index.html', flush=True)
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally: server.server_close()


if __name__ == '__main__': main()
