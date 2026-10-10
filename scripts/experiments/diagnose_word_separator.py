"""Reproduce separator evidence from maintained preparation inputs and a served run."""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urljoin

from inside_inference.declarations_generated import API_PATHS, RunRecord
from inside_inference.generation import select_greedy, token_display
from inside_inference.model import identity
from inside_inference.preparation import prepare_examples, batch_tensors
from inside_inference.tokenizer import Tokenizer
from inside_inference.workload import run_workload
from scripts import ROOT


class EmbeddedRun(HTMLParser):
    def __init__(self):
        super().__init__()
        self.active = False
        self.parts = []

    def handle_starttag(self, tag, attrs):
        self.active = tag == 'script' and dict(attrs).get('id') == 'inference-data'

    def handle_endtag(self, tag):
        if tag == 'script':
            self.active = False

    def handle_data(self, data):
        if self.active:
            self.parts.append(data)


def dump(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def inspect_run(run, tokenizer):
    RunRecord.from_dict(run)
    require(len(run['traces']) == 1, 'Diagnosis requires a single-request run')
    trace = run['traces'][0]
    checkpoint = trace['checkpoint']
    require(identity(checkpoint) == run['declaration']['model']['checkpoint_sha256'],
            'Recorded weights do not match declaration')
    end = tokenizer.token_id('control', 'TURN_END')
    space = tokenizer.token_id('space', ' ')
    selected = [p['selection']['selected_id'] for p in trace['passes']]
    require(selected == trace['output_ids'], 'Selection IDs differ from output IDs')
    details = []
    for p in trace['passes']:
        choice = p['selection']
        logits = choice['raw_logits']
        require(select_greedy(logits)['selected_id'] == choice['selected_id'], 'Non-argmax selection')
        details.append({'selected_id': choice['selected_id'], 'space_logit': logits[space],
                        'selected_logit': logits[choice['selected_id']],
                        'space_rank': sorted(range(len(logits)), key=lambda i: (-logits[i], i)).index(space) + 1})
    published = [i for i in selected if i != end]
    events = [e['payload'] for e in run['events'] if e['payload']['kind'] == 'token-published']
    require([i for e in events for i in e['token_ids']] == published, 'Publication dropped selected IDs')
    text = ''.join(token_display(tokenizer, i) for i in published)
    require(text == trace['output_display'] == ''.join(e['display_delta'] for e in events),
            'Published text differs from token display')
    # This observed run has textual pieces. Fail explicitly if strict decoding is
    # not defined; do not substitute diagnostic markers or UTF-8 replacement.
    require(tokenizer.decode(published) == text, 'Strict decoding differs from display')
    return {'checkpoint_identity': identity(checkpoint), 'provenance': checkpoint['provenance'],
            'request': trace['declaration']['request'], 'selected_ids': selected,
            'pieces': [tokenizer.tokens[i].piece for i in selected], 'output': text,
            'selected_spaces': selected.count(space), 'predictions': details,
            'strict_decode_matches_publication': True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://127.0.0.1:8000/index.html')
    parser.add_argument('--output', type=Path, default=ROOT / 'out/experiments/word-separator')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    tokenizer = Tokenizer()
    space = tokenizer.token_id('space', ' ')
    examples = prepare_examples()  # No training and no model test split.
    dump(args.output / 'regenerated-examples.json', examples)
    counts = {}
    for split, rows in examples.items():
        inputs, targets = batch_tensors(rows, tokenizer.token_id('control', 'PAD'))
        require(int((targets != -100).sum()) == sum(len(e['response_ids']) for e in rows),
                'Supervised positions differ from declared response targets')
        all_ids = [i for e in rows for i in e['prompt_ids'] + e['response_ids']]
        counts[split] = {
            'responses': len(rows), 'space_targets': int((targets == space).sum()),
            'spaces_in_nonpadding_input_positions': int((inputs == space).sum()),
            'prompt_ids': sum(len(e['prompt_ids']) for e in rows),
            'response_ids': sum(len(e['response_ids']) for e in rows),
            'spaces_in_full_sequences': all_ids.count(space), 'full_sequence_positions': len(all_ids),
            'space_fraction_full_sequences': all_ids.count(space) / len(all_ids),
            'acceptable_answers': sum(len(e['acceptable_answers']) for e in rows),
            'multiword_acceptable_answers': sum(len(a.split()) > 1 for e in rows for a in e['acceptable_answers']),
        }
    with urlopen(args.url, timeout=15) as response:
        page = response.read()
    (args.output / 'observed-page.html').write_bytes(page)
    embedded = EmbeddedRun()
    embedded.feed(page.decode('utf-8'))
    observed = json.loads(''.join(embedded.parts))
    dump(args.output / 'observed-run.json', observed)
    result = inspect_run(observed, tokenizer)
    workload = observed['declaration']['workload']
    replay = run_workload(workload, checkpoint=observed['traces'][0]['checkpoint'])
    require(inspect_run(replay, tokenizer) == result, 'Fresh local replay differs from served run')
    for old, new in zip(observed['traces'][0]['passes'], replay['traces'][0]['passes'], strict=True):
        require(old['selection']['raw_logits'] == new['selection']['raw_logits'], 'Replay logits differ')
    request = Request(urljoin(args.url, API_PATHS['run']), data=json.dumps(workload).encode(),
                      headers={'Content-Type': 'application/json'})
    with urlopen(request, timeout=30) as response:
        live = json.load(response)
    require(inspect_run(live, tokenizer) == result, 'Live endpoint differs from embedded run')
    dump(args.output / 'replayed-run.json', replay)
    dump(args.output / 'live-run.json', live)
    sources = ['data/tokenizer/vocabulary.json', 'data/corpus/recipe.json',
               'inside_inference/corpus.py', 'inside_inference/preparation.py',
               'inside_inference/tokenizer.py', 'scripts/experiments/diagnose_word_separator.py']
    report = {'original_browser_session': 'Not recovered; observations are the currently served initial run and fresh replays.',
              'url': args.url, 'source_identities': {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in sources},
              'counts': counts, 'observed': result, 'exact_replay_logits': True,
              'live_endpoint_matches': True, 'training_performed': False}
    dump(args.output / 'report.json', report)
    print(json.dumps({'counts': counts, 'observed': result, 'report': str(args.output / 'report.json')}, indent=2))


if __name__ == '__main__':
    main()
