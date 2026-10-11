"""Export or verify an inspectable forward run."""
import argparse
import json
from pathlib import Path
from inside_inference.generation import DEFAULT_REQUEST, run_token_step, replay_token_step
from inside_inference.workload import default_workload, replay_workload, run_workload
from inside_inference.model import canonical
from inside_inference.contract_runtime import decode_json


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--checkpoint', type=Path, help='Explicit compatible checkpoint; default is the shipped trained checkpoint')
    parser.add_argument('--text')
    parser.add_argument('--max-new-tokens', type=int)
    source = parser.add_mutually_exclusive_group()
    source.add_argument('--step', type=Path, help='Execute one declared raw-prefix token step')
    source.add_argument('--replay', type=Path)
    source.add_argument('--workload', type=Path, help='Execute the canonical Workload JSON sent by the website')
    parser.add_argument('--output', type=Path, default=Path('out/experiments/naive-gpt/run.json'))
    args = parser.parse_args()
    if (args.workload or args.replay or args.step) and (args.text is not None or args.max_new_tokens is not None):
        parser.error('Use a workload/replay record or prompt controls, not both')
    if args.replay and args.checkpoint:
        parser.error('Replay uses its embedded checkpoint; do not override it')
    checkpoint = decode_json(args.checkpoint.read_text()) if args.checkpoint else None
    if args.replay:
        record = decode_json(args.replay.read_text())
        result = replay_token_step(record) if 'computation' in record else replay_workload(record)
    elif args.step:
        result = run_token_step(decode_json(args.step.read_text()), checkpoint=checkpoint)
    elif args.workload:
        result = run_workload(decode_json(args.workload.read_text()), checkpoint=checkpoint)
    else:
        request = {'text': DEFAULT_REQUEST['text'] if args.text is None else args.text,
                   'generation':dict(DEFAULT_REQUEST['generation'])}
        if args.max_new_tokens is not None: request['generation']['max_new_tokens'] = args.max_new_tokens
        result = run_workload(default_workload(request).to_dict(), checkpoint=checkpoint)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(canonical(result) + b'\n')
    if 'computation' in result:
        print(f'{args.output}: one actual token step; selected {result["computation"]["selection"]["selected_id"]}')
        return
    trace = result['traces'][0]
    print(f'{args.output}: {len(trace["passes"])} passes; {trace["outcome"]["stop_reason"]}; output {trace["output_display"]!r}')


if __name__ == '__main__':
    main()
