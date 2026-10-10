"""Execute or replay the KV residency lab using its declared experiment input."""
import argparse
from pathlib import Path
from inside_inference.cache_lab import run_cache_experiment,replay_cache,default_experiment
from inside_inference.contract_runtime import decode_json
from inside_inference.model import canonical
from scripts import ROOT


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--spec',type=Path,help='KVExperimentInput JSON; default is the embedded three-request example')
    parser.add_argument('--checkpoint',type=Path)
    parser.add_argument('--backend',choices=['reference','cuda'],help='Explicitly override the declared backend before creating a new run')
    parser.add_argument('--replay',type=Path)
    parser.add_argument('--output',type=Path,default=ROOT/'out/experiments/kv-cache/run.json')
    args=parser.parse_args()
    if args.replay and any((args.spec,args.checkpoint,args.backend)):
        parser.error('Replay uses the recorded experiment and checkpoint without overrides')
    output=args.output.resolve()
    if not output.is_relative_to((ROOT/'out/experiments').resolve()):parser.error('Outputs must stay under out/experiments')
    if args.replay:result=replay_cache(decode_json(args.replay.read_text()))
    else:
        spec=decode_json(args.spec.read_text()) if args.spec else default_experiment()
        if args.backend:spec['system']['backend']=args.backend
        checkpoint=decode_json(args.checkpoint.read_text()) if args.checkpoint else None
        result=run_cache_experiment(spec,checkpoint=checkpoint)
    output.parent.mkdir(parents=True,exist_ok=True);output.write_bytes(canonical(result)+b'\n')
    print(f"Wrote {output}: {len(result['computations'])} computations, {len(result['events'])} events")


if __name__=='__main__':main()
