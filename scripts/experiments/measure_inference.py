"""Local execution feasibility, independent from hypothetical hardware costs."""
import json
from pathlib import Path
import platform
import resource
import time

from inside_inference.generation import run_request
from inside_inference.provenance import execution_provenance
from inside_inference.model import Model, canonical, default_checkpoint
from inside_inference.tokenizer import Tokenizer


def main():
    records = []
    start = time.perf_counter()
    run = run_request()
    execution = time.perf_counter() - start
    start = time.perf_counter()
    payload = canonical(run)
    records.append({'workload': 'default chat request', 'passes': len(run['passes']),
                    'positions': [len(p['input_ids']) for p in run['passes']],
                    'execution_seconds': execution, 'serialization_seconds': time.perf_counter() - start,
                    'json_bytes': len(payload), 'run_id': run['id'],
                    'checkpoint_sha256': run['declaration']['model']['checkpoint_sha256']})
    tokenizer = Tokenizer()
    model = Model(default_checkpoint())
    # Stress the full allowed trace shape, independently of early stop decisions.
    # These are supplied continuations, not sampled model responses.
    ids = [tokenizer.words['cat']] * 128
    start = time.perf_counter()
    passes = [model.forward(ids[:n], step=n-121) for n in range(121, 129)]
    execution = time.perf_counter() - start
    start = time.perf_counter()
    payload = canonical(passes)
    records.append({'workload': 'eight forward passes with supplied IDs; no selection',
                    'positions': list(range(121, 129)), 'execution_seconds': execution,
                    'serialization_seconds': time.perf_counter() - start,
                    'json_bytes': len(payload), 'checkpoint_sha256': model.sha256})
    report = {'platform': platform.platform(), 'machine': platform.machine(), 'python': platform.python_version(),
              'provenance': execution_provenance(), 'records': records,
              'process_peak_rss_kib_linux': resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
              'scope': 'one local sample each; process peak includes both records and JSON; not GPU or serving latency'}
    path = Path('out/experiments/naive-gpt/execution-cost.json')
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
