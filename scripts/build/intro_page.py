"""Build a portable offline laboratory from admitted contracts and recorded execution."""
from scripts.build.theme import check_theme
import argparse
import html
import json
from pathlib import Path
import re
import shutil

from inside_inference.labs.kda import demo
from scripts.build.generate_data_models import admit, generate, read
from scripts.build.ontology import load_declarations
from scripts.build.contracts import load_schema, lab_bindings

from scripts.build.presentation import entities, lab_index
from scripts import ROOT
CATALOG = ROOT / 'catalog/stack.json'
STATUS = {'mechanical-demo': 'Mechanical demo', 'planned': 'Lab planned'}


def load_catalog(path=CATALOG):
    data = json.loads(path.read_text())
    lab_bindings(ROOT, load_declarations(), load_schema(), catalog=data)
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
        if entry['status'] == 'mechanical-demo' and entry['id'] not in ('naive-gpt','kimi-delta-attention','prefix-cache'):
            raise ValueError('A mechanical demo requires a registered implementation')
        for source in entry['sources']:
            if not source['url'].startswith('https://') or not source['title']:
                raise ValueError('Sources require an HTTPS URL and title')
    return data


def esc(value):
    return html.escape(str(value), quote=True)


def shell(title, body, prefix='', *, landing=False):
    navigation = (f'<span class="landing-links"><a href="{prefix}labs-by-concept.html">Labs</a> · '
                  f'<a href="{prefix}ontology.html">Ontology</a></span>')
    footer = '' if landing else '<footer>Mechanism → evidence → limits. An open laboratory, always incomplete.</footer>'
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} · Inside Inference</title><link rel="stylesheet" href="{prefix}theme.css"><link rel="stylesheet" href="{prefix}style.css"></head>
<body><header><a href="{prefix}index.html">Inside Inference</a>{navigation}</header>
<main>{body}</main>{footer}
<script src="{prefix}app.js" defer></script></body></html>'''


def warning():
    return '''<aside class="warning"><strong>A microscope is not a production benchmark.</strong>
Tiny experiments can produce <b>false positives</b> (a toy win disappears at scale) and
<b>false negatives</b> (a useful production technique fails in the toy).
Mechanics may transfer; learned quality, speed, cost, and rankings often do not.
Evidence applies only to its stated model, workload, implementation, and hardware.</aside>'''


def ontology_terms():
    """Project admitted ontology fields; never scrape a prose glossary."""
    ontology = load_declarations()
    admit(ontology, read(ROOT / 'data-model/inference.schema.json'))
    terms = {}
    for owner, entry in ontology['terms'].items():
        for label, projection in entry['projections'].items():
            terms[label] = dict(meaning=projection['meaning'], anchor=label.lower().replace(' ', '-'),
                                owner=owner, fields=projection['fields'])
    return terms


def initial_generation():
    from inside_inference.declarations_generated import GenerationDefaults, GenerationInput
    from scripts.build.structured import read_yaml
    defaults=read_yaml(ROOT/'data/models/initial.yaml')
    GenerationDefaults.validate_shape(defaults)
    result=defaults
    GenerationInput.validate_shape(result)
    return result


def build(output, *, checkpoint=None, model_storage=None):
    check_theme(ROOT)
    generate(check=True)
    from scripts.build.browser_runtime import package
    package(output,checkpoint,model_storage=model_storage)
    data = load_catalog()
    output.mkdir(parents=True, exist_ok=True)
    (output / 'labs').mkdir(exist_ok=True)
    for name in ('app.js', 'contract-runtime.js', 'contract-validators.generated.js', 'declarations.generated.js', 'execution/client.generated.js', 'execution/worker.generated.js', 'inspection/configuration.js', 'inspection/details.js', 'inspection/page.css', 'inspection/page.js', 'inspection/path.js', 'inspection/principles.js', 'inspection/resources.js', 'inspection/session.js', 'inspection/system-map.js', 'style.css', 'theme.css'):
        (output / name).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / 'web' / name, output / name)
    # Executed code spans come from the same sources packaged in engine.zip.
    from scripts.build.contracts import principle_spans
    (output/'principles-code.js').write_text('globalThis.PrincipleCode=Object.freeze('+json.dumps(principle_spans(ROOT),sort_keys=True)+');\n')
    katex = ROOT/'node_modules/katex'
    shutil.rmtree(output/'vendor/katex', ignore_errors=True)
    (output/'vendor/katex/fonts').mkdir(parents=True)
    for name in ('katex.min.js', 'katex.min.css'):
        shutil.copyfile(katex/'dist'/name, output/'vendor/katex'/name)
    for font in (katex/'dist/fonts').glob('*.woff2'):
        shutil.copyfile(font, output/'vendor/katex/fonts'/font.name)
    shutil.copyfile(katex/'LICENSE', output/'vendor/katex/LICENSE')
    # Retired generated pages must not survive an incremental build.
    shutil.rmtree(output/'execution/llama', ignore_errors=True)
    for retired in ('inspection/page.html','kv-cache.html','cache.js','cache.css','atlas.html','request-cost.html','journey.js','model-contract.html','model-size.html','models/page.js','models/layout.css','labs/model-size-quality.html','execution/evidence-client.js','configuration-preview.js','inference.js','inspection-session.js','execution-path.js','inference.css','execution/component-engine.js','execution/controls.js','execution/decoder.js','execution/model-service.js','execution/model-storage.js','execution/observations.js','execution/llama/llama.mjs','execution/llama/llama.wasm','execution/llama/LICENSE.txt'):
        (output/retired).unlink(missing_ok=True)
    terms = ontology_terms()
    visual_source = (ROOT / 'web/inspection/page.html').read_text()
    visual_terms = entities(visual_source, anchors=True)
    if not set(visual_terms) <= terms.keys():
        raise ValueError('Visual references an unknown ontology term')
    ontology_body = '<h1>Visuals have meanings.</h1><p>Every visual concept maps to fields admitted by the machine-readable ontology. '
    ontology_body += 'These define the model; they do not prove its real-world validity.</p>'
    for term, entry in terms.items():
        scene_link = f'<a href="index.html#{visual_terms[term]}">Inspect in the request scene ↗</a>' if term in visual_terms else ''
        bindings = ', '.join(f'{schema}.{field}' for schema, fields in entry['fields'].items() for field in fields)
        ontology_body += f'<section id="{entry["anchor"]}"><h2>{esc(term)}</h2><p>{esc(entry["meaning"])}</p><p><a href="declarations.html#{entry["owner"]}">{esc(entry["owner"])}</a>: {esc(bindings)}</p>{scene_link}</section>'
    labs_body = lab_index(load_declarations(), data, STATUS)
    subjects = {e['ontology_binding']['primary'] for e in data['innovations'] if e['status'] == 'mechanical-demo'}
    for owner, definition in load_declarations()['terms'].items():
        lab_link = f' · <a href="labs-by-concept.html#{owner}">Labs ↗</a>' if owner in subjects else ''
        ontology_body += f'<section id="{owner}"><h2>{esc(owner)}</h2><p>{esc(definition["meaning"])}</p><p>{esc(definition["lifetime"])}</p><p>Owns: {esc("; ".join(definition["owns"]))}</p><p>Excludes: {esc("; ".join(definition["excludes"]))}</p><a href="declarations.html#{owner}">Owned declarations ↗</a>{lab_link}</section>'
    (output / 'labs-by-concept.html').write_text(shell('Explore inference concepts', '<div class="reference-index">' + labs_body + '</div>'))
    (output / 'ontology.html').write_text(shell('Inference ontology', '<div class="reference-index">' + ontology_body + '</div>'))
    numerical = (ROOT / 'web/inspection/page.html').read_text().replace(
        '__INFERENCE_DATA__', json.dumps(initial_generation(), allow_nan=False).replace('<', '\\u003c'))
    numerical = '<link rel="stylesheet" href="vendor/katex/katex.min.css"><link rel="stylesheet" href="inspection/page.css">' + numerical
    (output / 'index.html').write_text(shell('What happens if you change this?', numerical, landing=True))
    contract = (ROOT / 'docs/labs/kv-residency.md').read_text()
    (output / 'kv-contract.html').write_text(shell('KV residency experiment contract',
        '<h1>KV residency evidence contract</h1><pre class="contract-text">' + esc(contract) + '</pre>'))
    declaration_ontology = load_declarations()
    declaration_schemas = read(ROOT / 'data-model/inference.schema.json')['$defs']
    declarations = '<h1>What governs this run?</h1><p>Meanings from the declaration ontology; fields from the executable contract. Generated views are not authorities.</p>'
    for name, term in declaration_ontology['terms'].items():
        declarations += f'<section id="{name}"><h2>{name}</h2><p>{esc(term["meaning"])}</p><p>{esc(term["lifetime"])}</p><p>Owns: {esc(", ".join(term["owns"]))}. Excludes: {esc(", ".join(term["excludes"]))}.</p>'
        for schema_name in term['schemas']:
            declarations += f'<h3>{schema_name}</h3><dl>'
            for field, definition in declaration_schemas[schema_name]['properties'].items():
                reference = definition.get('$ref')
                if reference:
                    target = reference.split('/')[-1]
                    target_owner = declaration_schemas[target]['x-owner']
                    description = f'<a href="#{target_owner}">{esc(target)}</a> · owned by {esc(target_owner)}'
                else:
                    description = esc(definition.get('description', definition.get('type', 'Declared alternatives')))
                declarations += f'<dt>{esc(field)}</dt><dd>{description}</dd>'
            declarations += '</dl>'
        declarations += '<a href="index.html">Inspect the bound run ↗</a></section>'
    (output / 'declarations.html').write_text(shell('Declaration ownership', declarations))
    contract_text = (ROOT / 'docs/labs/naive-gpt.md').read_text()
    (output / 'naive-gpt-contract.html').write_text(shell('Naïve GPT contract',
        '<h1>Naïve GPT evidence contract</h1><pre class="contract-text">' + esc(contract_text) + '</pre>'))
    for entry in data['innovations']:
        sources = ''.join(f'<li><a href="{esc(s["url"])}">{esc(s["title"])}</a></li>' for s in entry['sources'])
        content = f'''<p class="eyebrow">{STATUS[entry['status']]}</p><h1>{esc(entry['name'])}</h1>
<p class="lead">{esc(entry['summary'])}</p>{warning()}
<dl class="brief"><dt>Mechanism</dt><dd>{esc(entry['mechanism'])}</dd>
<dt>Potential benefit</dt><dd>{esc(entry['benefit'])}</dd><dt>Tradeoff</dt><dd>{esc(entry['cost'])}</dd>
<dt>Evidence boundary</dt><dd>{esc(entry['limit'])}</dd>
<dt>Question to investigate</dt><dd>{esc(entry['question'])}</dd></dl>'''
        if entry['id'] == 'kimi-delta-attention':
            trace = demo()
            traces = json.dumps(trace).replace('<', '\\u003c')
            first = next(iter(trace.values()))
            event = first[0]
            content += f'''<section class="experiment"><h2>Read → correct → write</h2>
<p>Here S has {len(event['key'])} key channels and {len(event['value'])} value channels. At each step:</p>
<pre>D = diag(alpha) S_previous
prediction = Dᵀ k
error = v − prediction
S = D + beta k errorᵀ
o = Sᵀ q</pre>
<p>This is an expanded evaluation of equation (1) in the paper. The demo starts at zero,
uses unit-length keys and beta = {event['beta']}, and changes only the decay gates across scenarios.
These updates change sequence state, not trained model weights. Computation uses
Python floating-point arithmetic; cards round to five decimal places. Raw traces
below retain the serialized values.</p>
<label for="scenario">Decay policy</label> <select id="scenario">
{''.join(f'<option>{esc(label)}</option>' for label in trace)}</select>
<label class="step-label" for="step">Input step <output id="step-number">1</output> of <span id="step-count">{len(first)}</span></label>
<input id="step" type="range" min="0" max="{len(first)-1}" value="0">
<p id="state-budget">Recurrent state: {len(event['key'])*len(event['value'])} scalars at every step. A stored history of these keys and values
would add {len(event['key'])+len(event['value'])} scalars per step. This is a storage illustration, not an equivalent-quality comparison.</p>
<div id="trace" aria-live="polite"></div>
<details><summary>Raw generated traces</summary><pre>{esc(json.dumps(trace, indent=2))}</pre></details>
<noscript><p>The controls require JavaScript. All computed states are available in the raw traces above.</p></noscript>
<script id="trace-data" type="application/json">{traces}</script></section>
<section class="orientation"><h2>What this does and does not establish</h2>
<p>Fixed recurrent state makes forgetting and interference directly inspectable. Whether that is a good
tradeoff for a learned task is a separate experiment. An untrained substitution into a GPT is not a fair
quality comparison; a future lab needs matched training and controlled recall workloads.</p>
<p>KDA is a component. Kimi Linear combines KDA and MLA layers, with additional learned machinery
and optimized kernels. This recurrence example is not the full architecture or a reproduction of its reported results.</p>
<p>Next lab work: controlled associative recall, a trained baseline, a hybrid comparison, and separate
kernel measurements at representative shapes. No universal winner follows from the current demo.</p></section>'''
        elif entry['id'] == 'naive-gpt':
            content += '<p><a href="../index.html">Inspect the actual naïve GPT execution ↗</a></p>'
        elif entry['id'] == 'prefix-cache':
            content += '<p><a href="../index.html#system-dialog">Run the KV residency experiment: cold, warm, remote hit, and eviction ↗</a></p><p><a href="../kv-contract.html">Read its abstraction and evidence contract ↗</a></p>'
        else:
            content += '<p class="warning"><b>Planned lab:</b> this is a specification only. No experiment or measured result is available.</p>'
        binding = entry['ontology_binding']
        content += '<p>Ontology subjects: ' + ' · '.join(f'<a href="../ontology.html#{owner}">{esc(owner)}</a>' for owner in [binding['primary'], *binding['related']]) + ' (primary first).</p>'
        if sources:
            content += f'<h2>Primary sources</h2><ul>{sources}</ul>'
        (output / 'labs' / f"{entry['id']}.html").write_text(shell(entry['name'], content, '../'))
    return output / 'index.html'


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--checkpoint', type=Path)
    parser.add_argument('--model-asset-base', help='Relative or HTTPS model asset URL prefix')
    args = parser.parse_args()
    if args.check:
        check_theme(ROOT)
        load_catalog()
        print('Catalog identities, layer references, and evidence statuses checked.')
    else:
        checkpoint = json.loads(args.checkpoint.read_text()) if args.checkpoint else None
        print(build(ROOT / 'out/intro-page', checkpoint=checkpoint, model_storage={'base_url':args.model_asset_base} if args.model_asset_base else None))
