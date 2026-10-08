"""Build a portable offline laboratory from admitted contracts and recorded execution."""
import argparse
import html
import json
from pathlib import Path
import re
import shutil

from inside_inference.labs.kda import demo
from inside_inference.labs.journey import scenarios
from inside_inference.workload import run_workload
from scripts.build.generate_data_models import generate, read

from scripts import ROOT
CATALOG = ROOT / 'catalog/stack.json'
STATUS = {'mechanical-demo': 'Mechanical demo', 'planned': 'Lab planned'}


def load_catalog(path=CATALOG):
    data = json.loads(path.read_text())
    ids = set()
    for group in ('layers', 'innovations'):
        if not data[group]:
            raise ValueError(f'Empty {group}')
        for entry in data[group]:
            identifier = entry['id']
            if not re.fullmatch(r'[a-z][a-z0-9-]*', identifier) or identifier in ids:
                raise ValueError(f'Invalid or duplicate id: {identifier}')
            ids.add(identifier)
    layers = {entry['id'] for entry in data['layers']}
    for entry in data['layers']:
        for field in ('name', 'invariant', 'observe', 'examples', 'benefit', 'cost', 'fit'):
            if not entry.get(field):
                raise ValueError(f"Missing {field} in {entry['id']}")
    for entry in data['innovations']:
        for field in ('name', 'summary', 'mechanism', 'benefit', 'cost', 'limit', 'question'):
            if not entry.get(field):
                raise ValueError(f"Missing {field} in {entry['id']}")
        steps = entry.get('journey_steps')
        if not isinstance(steps, list) or not steps or any(s not in ('prefill', 'decode') for s in steps) or len(set(steps)) != len(steps):
            raise ValueError(f"Invalid journey steps in {entry['id']}")
        if entry['primary'] not in layers or not set(entry['related']) <= layers:
            raise ValueError(f"Unknown layer in {entry['id']}")
        if entry['status'] not in STATUS:
            raise ValueError(f"Unknown status in {entry['id']}")
        if entry['status'] == 'mechanical-demo' and entry['id'] != 'kimi-delta-attention':
            raise ValueError('A mechanical demo requires a registered implementation')
        for source in entry['sources']:
            if not source['url'].startswith('https://') or not source['title']:
                raise ValueError('Sources require an HTTPS URL and title')
    return data


def esc(value):
    return html.escape(str(value), quote=True)


def shell(title, body, prefix=''):
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} · Inside Inference</title><link rel="stylesheet" href="{prefix}style.css"></head>
<body><header><a href="{prefix}index.html">Inside Inference</a><span>THE INFERENCE ATLAS</span></header>
<main>{body}</main><footer>Mechanism → evidence → limits. An open laboratory, always incomplete.</footer>
<script src="{prefix}app.js" defer></script></body></html>'''


def warning():
    return '''<aside class="warning"><strong>A microscope is not a production benchmark.</strong>
Tiny experiments can produce <b>false positives</b> (a toy win disappears at scale) and
<b>false negatives</b> (a useful production technique fails in the toy).
Mechanics may transfer; learned quality, speed, cost, and rankings often do not.
Evidence applies only to its stated model, workload, implementation, and hardware.</aside>'''


def ontology_terms():
    """Read canonical meanings directly from the ontology's Entities table."""
    source = (ROOT / 'docs/ontology/inference.md').read_text()
    section = source.split('## Entities\n', 1)[1].split('## Relationships', 1)[0]
    terms = {}
    for line in section.splitlines():
        if not line.startswith('| ') or line.startswith(('| Term ', '| ---')):
            continue
        term, meaning = [cell.strip() for cell in line.strip('|').split('|')]
        terms[term] = dict(meaning=meaning, anchor=term.lower().replace(' ', '-'))
    return terms


def build(output):
    generate(check=True)
    data = load_catalog()
    output.mkdir(parents=True, exist_ok=True)
    (output / 'labs').mkdir(exist_ok=True)
    for name in ('style.css', 'app.js', 'journey.js', 'inference.js', 'inference.css', 'contract-validators.generated.js', 'contract-runtime.js', 'declarations.generated.js', 'inspection-session.js'):
        shutil.copyfile(ROOT / 'web' / name, output / name)
    layers = {x['id']: x for x in data['layers']}
    nav = ''.join(f'<a href="#layer-{x["id"]}">{i:02d} {esc(x["name"])}</a>'
                  for i, x in enumerate(data['layers'], 1))
    cards = []
    for i, layer in enumerate(data['layers'], 1):
        linked = [x for x in data['innovations']
                  if layer['id'] in [x['primary'], *x['related']]]
        links = ''.join(f'<a class="lab-link" href="labs/{x["id"]}.html">{esc(x["name"])}'
                        f' <small>{STATUS[x["status"]]} · {"primary" if x["primary"] == layer["id"] else "related"}</small></a>'
                        for x in linked) or '<p class="muted">No dedicated lab indexed yet.</p>'
        cards.append(f'''<article class="layer" id="layer-{layer['id']}" data-search>
<div class="number">{i:02d}</div><div><h2>{esc(layer['name'])}</h2>
<p class="invariant">{esc(layer['invariant'])}</p>
<dl><dt>Watch mechanically</dt><dd>{esc(layer['observe'])}</dd>
<dt>Innovation space</dt><dd>{esc(layer['examples'])}</dd>
<dt>Potential gain</dt><dd>{esc(layer['benefit'])}</dd>
<dt>What it can cost</dt><dd>{esc(layer['cost'])}</dd>
<dt>What a tiny lab can tell us</dt><dd>{esc(layer['fit'])}</dd></dl>{links}</div></article>''')
    body = f'''<section class="hero"><p class="eyebrow">LAB CATALOG · ONE STACK, MANY EXPERIMENTS</p>
<h1>Where does the<br>innovation land?</h1>
<p class="lead">From a new attention rule to a new accelerator: locate the change,
watch the mechanism, and ask what the evidence actually supports.</p></section>
{warning()}<section class="orientation"><h2>Follow boundaries, not brands</h2>
<p>These are stable responsibilities, not a strict execution order or a company ranking.
An innovation has one primary home and may cross several layers. Training is provenance
for the model; quality, latency, throughput, memory, energy, and cost cut across the whole stack.</p>
<p><b>Request → tokens → prefill → sequence state → decode → output.</b>
Execution software, placement, and physical resources determine how that path runs.</p>
<p>“Model framework” can mean a model architecture, an execution framework, or a serving engine.
Classify the actual changed boundary, and link the others.</p></section>
<section class="featured"><span class="eyebrow">EXAMPLE MECHANICAL LAB</span>
<h2><a href="labs/kimi-delta-attention.html">Inside Kimi Delta Attention ↗</a></h2>
<p>Step through a tiny recurrent memory. Compare channel-wise, uniform, and no decay.
Inspect every read, correction, and state update. No trained-model or speed claims.</p></section>
<label class="search" for="search">Find a mechanism, layer, or innovation
<input id="search" type="search" placeholder="Try Kimi, prompt, framework, topology…"></label>
<p id="result-count" role="status"></p><div class="atlas"><nav aria-label="Stack layers">{nav}</nav>
<section aria-label="Inference stack">{''.join(cards)}<p id="no-results" hidden>No matching area. Try a broader term.</p></section></div>
<section class="orientation"><h2>Every lab has an evidence contract</h2>
<p><b>Locate</b> the changed boundary. <b>Show</b> actual inputs, state transitions, and outputs.
<b>Compare</b> a stated baseline under controlled conditions. <b>Separate</b> mathematical properties,
toy observations, simulated costs, and real measurements. <b>Declare</b> failure cases and what cannot transfer.</p>
<p>Catalog entries: {sum(e["status"] == "mechanical-demo" for e in data["innovations"])} mechanical demo(s) and {sum(e["status"] == "planned" for e in data["innovations"])} planned lab(s).
The landing page executes an inspectable untrained GPT; a separate lab models bounded request costs. No trained tiny GPT, real-system timing validation, framework benchmark, or hardware measurement exists yet.</p></section>'''
    (output / 'atlas.html').write_text(shell('Lab catalog', body))
    terms = ontology_terms()
    visual_source = (ROOT / 'web/inference.html').read_text()
    visual_terms = dict((term, entity) for entity, term in re.findall(r'data-entity="([^"]+)" data-term="([^"]+)"', visual_source))
    cost_source = (ROOT / 'web/journey.html').read_text()
    cost_terms = dict((term, entity) for entity, term in re.findall(r'data-entity="([^"]+)" data-term="([^"]+)"', cost_source))
    if not (set(visual_terms) | set(cost_terms)) <= terms.keys():
        raise ValueError('Visual references an unknown ontology term')
    ontology_body = '<h1>Visuals have meanings.</h1><p>Canonical definitions from docs/ontology/inference.md. '
    ontology_body += 'These define the model; they do not prove its real-world validity.</p>'
    for term, entry in terms.items():
        destination = 'index.html#inspect-' + visual_terms[term] if term in visual_terms else 'index.html'
        cost_link = f'<a href="request-cost.html#inspect-{cost_terms[term]}">Inspect in the separate cost simulation ↗</a>' if term in cost_terms else ''
        ontology_body += f'<section id="{entry["anchor"]}"><h2>{esc(term)}</h2><p>{esc(entry["meaning"])}</p><a href="{destination}">Inspect in the request scene ↗</a> {cost_link}</section>'
    (output / 'ontology.html').write_text(shell('Inference ontology', ontology_body))
    step_labs = {step: [dict(id=e['id'], name=e['name'], status=STATUS[e['status']])
                        for e in data['innovations'] if step in e['journey_steps']]
                 for step in ('prefill', 'decode')}
    landing = (ROOT / 'web/journey.html').read_text().replace(
        '__JOURNEY_DATA__', json.dumps(scenarios()).replace('<', '\\u003c')).replace(
        '__ONTOLOGY_DATA__', json.dumps(terms).replace('<', '\\u003c')).replace(
        '__STEP_LABS__', json.dumps(step_labs).replace('<', '\\u003c'))
    (output / 'request-cost.html').write_text(shell('Request cost simulation', landing))
    numerical = (ROOT / 'web/inference.html').read_text().replace(
        '__INFERENCE_DATA__', json.dumps(run_workload(), allow_nan=False).replace('<', '\\u003c')).replace(
        '__ONTOLOGY_DATA__', json.dumps(terms).replace('<', '\\u003c'))
    numerical = '<link rel="stylesheet" href="inference.css">' + numerical
    (output / 'index.html').write_text(shell('What happens if you change this?', numerical))
    declaration_ontology = read(ROOT / 'docs/ontology/declarations.json')
    declaration_schemas = read(ROOT / 'data-model/inference.schema.json')['$defs']
    declarations = '<h1>What governs this run?</h1><p>Meanings from the declaration ontology; fields from the executable contract. Generated views are not authorities.</p>'
    for name, term in declaration_ontology['terms'].items():
        declarations += f'<section id="{name}"><h2>{name}</h2><p>{esc(term["meaning"])}</p><p>{esc(term["lifetime"])}</p><p>Owns: {esc(", ".join(term["owns"]))}. Excludes: {esc(", ".join(term["excludes"]))}.</p>'
        for schema_name in term['schemas']:
            declarations += f'<h3>{schema_name}</h3><dl>'
            for field, definition in declaration_schemas[schema_name]['properties'].items():
                declarations += f'<dt>{esc(field)}</dt><dd>{esc(definition.get("description", definition.get("$ref")))}</dd>'
            declarations += '</dl>'
        declarations += '<a href="index.html">Inspect the bound run ↗</a></section>'
    (output / 'declarations.html').write_text(shell('Declaration ownership', declarations))
    contract_text = (ROOT / 'docs/labs/naive-gpt.md').read_text()
    (output / 'naive-gpt-contract.html').write_text(shell('Naïve GPT contract',
        '<h1>Naïve GPT evidence contract</h1><pre class="contract-text">' + esc(contract_text) + '</pre>'))
    contract = (ROOT / 'docs/labs/request-playground.md').read_text()
    (output / 'model-contract.html').write_text(shell('Request model contract',
        '<h1>Request playground</h1><p>Abstraction and evidence boundary</p><pre class="contract-text">'
        + esc(contract) + '</pre>'))
    for entry in data['innovations']:
        homes = ' · '.join(f'<a href="../atlas.html#layer-{identifier}">{esc(layers[identifier]["name"])}</a>'
                           for identifier in [entry['primary'], *entry['related']])
        sources = ''.join(f'<li><a href="{esc(s["url"])}">{esc(s["title"])}</a></li>' for s in entry['sources'])
        content = f'''<p class="eyebrow">{STATUS[entry['status']]}</p><h1>{esc(entry['name'])}</h1>
<p>{homes}</p><p class="lead">{esc(entry['summary'])}</p>{warning()}
<dl class="brief"><dt>Mechanism</dt><dd>{esc(entry['mechanism'])}</dd>
<dt>Potential benefit</dt><dd>{esc(entry['benefit'])}</dd><dt>Tradeoff</dt><dd>{esc(entry['cost'])}</dd>
<dt>Evidence boundary</dt><dd>{esc(entry['limit'])}</dd>
<dt>Question to investigate</dt><dd>{esc(entry['question'])}</dd></dl>'''
        if entry['id'] == 'kimi-delta-attention':
            traces = json.dumps(demo()).replace('<', '\\u003c')
            content += f'''<section class="experiment"><h2>Read → correct → write</h2>
<p>Here S has two key channels and two value channels. At each step:</p>
<pre>D = diag(alpha) S_previous
prediction = Dᵀ k
error = v − prediction
S = D + beta k errorᵀ
o = Sᵀ q</pre>
<p>This is an expanded evaluation of equation (1) in the paper. The demo starts at zero,
uses unit-length keys and beta = 0.75, and changes only the decay gates across scenarios.
These updates change sequence state, not trained model weights. Computation uses
Python floating-point arithmetic; cards round to five decimal places. Raw traces
below retain the serialized values. This is not the planned FP16 baseline.</p>
<label for="scenario">Decay policy</label> <select id="scenario">
{''.join(f'<option>{esc(label)}</option>' for label in demo())}</select>
<label class="step-label" for="step">Input step <output id="step-number">1</output> of 4</label>
<input id="step" type="range" min="0" max="3" value="0">
<p id="state-budget">Recurrent state: 4 scalars at every step. A stored history of these keys and values
would add 4 scalars per step. This is a storage illustration, not an equivalent-quality comparison.</p>
<div id="trace" aria-live="polite"></div>
<details><summary>Raw generated traces</summary><pre>{esc(json.dumps(demo(), indent=2))}</pre></details>
<noscript><p>The controls require JavaScript. All computed states are available in the raw traces above.</p></noscript>
<script id="trace-data" type="application/json">{traces}</script></section>
<section class="orientation"><h2>What this does and does not establish</h2>
<p>Fixed recurrent state makes forgetting and interference directly inspectable. Whether that is a good
tradeoff for a learned task is a separate experiment. An untrained substitution into a GPT is not a fair
quality comparison; a future lab needs matched training and controlled recall workloads.</p>
<p>KDA is a component. Kimi Linear combines KDA and MLA layers, with additional learned machinery
and optimized kernels. This four-step example is not the full architecture or a reproduction of its reported results.</p>
<p>Next lab work: controlled associative recall, a trained baseline, a hybrid comparison, and separate
kernel measurements at representative shapes. No universal winner follows from the current demo.</p></section>'''
        else:
            content += '<p class="warning"><b>Planned lab:</b> this is a specification only. No experiment or measured result is available.</p>'
        if sources:
            content += f'<h2>Primary sources</h2><ul>{sources}</ul>'
        (output / 'labs' / f"{entry['id']}.html").write_text(shell(entry['name'], content, '../'))
    return output / 'index.html'


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.check:
        load_catalog()
        print('Catalog identities, layer references, and evidence statuses checked.')
    else:
        print(build(ROOT / 'out/intro-page'))
