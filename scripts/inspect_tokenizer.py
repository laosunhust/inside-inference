"""Export actual tokenizer decisions for text or an exact UTF-8 file."""

import argparse
import json
from pathlib import Path

from observable_gpt.tokenizer import MANIFEST, Tokenizer


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument('--text')
    source.add_argument('--file', type=Path)
    parser.add_argument('--manifest', type=Path, default=MANIFEST)
    parser.add_argument('--context-limit', type=int)
    args = parser.parse_args()
    codec = Tokenizer(args.manifest)
    if args.file is not None:
        encoding = codec.encode_utf8(args.file.read_bytes(), context_limit=args.context_limit)
    else:
        encoding = codec.encode(args.text, context_limit=args.context_limit)
    result = encoding.to_dict()
    result['decoded_text'] = codec.decode(encoding.ids)
    result['token_count'] = len(encoding.ids)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
