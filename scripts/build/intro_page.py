"""Build a portable offline laboratory from admitted contracts and recorded execution."""
from scripts.build.theme import check_theme
import argparse
import html
import json
from pathlib import Path
import shutil

from scripts.build.generate_data_models import admit, generate, read
from scripts.build.ontology import load_declarations
from scripts.build.contracts import load_schema, experiment_catalog

from scripts.build.presentation import entities
from scripts import ROOT
from scripts.build.hosting.layout import seal_assets


def esc(value):
    return html.escape(str(value), quote=True)


def shell(title, body, prefix='', *, landing=False):
    footer = '' if landing else '<footer>Mechanism → evidence → limits. An open laboratory, always incomplete.</footer>'
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} · Inside Inference</title><link rel="stylesheet" href="{prefix}theme.css"><link rel="stylesheet" href="{prefix}style.css"></head>
<body><header><a href="/">Inside Inference</a></header>
<main>{body}</main>{footer}</body></html>'''


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
    # Rebuild the payload; stale content-addressed directories never enter its identity.
    for folder in ('assets', 'ontology', 'declarations'):
        shutil.rmtree(output/folder, ignore_errors=True)
    generate(check=True)
    from scripts.build.browser_runtime import package
    package(output,checkpoint,model_storage=model_storage)
    output.mkdir(parents=True, exist_ok=True)
    for name in ('contract-runtime.js', 'contract-validators.generated.js', 'declarations.generated.js', 'execution/client.generated.js', 'execution/worker.generated.js', 'inspection/configuration.js', 'inspection/details.js', 'inspection/experiments.js', 'inspection/page.css', 'inspection/page.js', 'inspection/path.js', 'inspection/principles.js', 'inspection/resources.js', 'inspection/session.js', 'inspection/system-map.js', 'style.css', 'theme.css'):
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
    for directory in ('execution/llama', 'labs'):
        shutil.rmtree(output/directory, ignore_errors=True)
    for retired in ('ontology.html','declarations.html','inspection/page.html','kv-cache.html','cache.js','cache.css','atlas.html','request-cost.html','journey.js','model-contract.html','model-size.html','models/page.js','models/layout.css','labs/model-size-quality.html','execution/evidence-client.js','configuration-preview.js','inference.js','inspection-session.js','execution-path.js','inference.css','execution/component-engine.js','execution/controls.js','execution/decoder.js','execution/model-service.js','execution/model-storage.js','execution/observations.js','labs-by-concept.html','kv-contract.html','naive-gpt-contract.html','app.js'):
        (output/retired).unlink(missing_ok=True)
    terms = ontology_terms()
    visual_source = (ROOT / 'web/inspection/page.html').read_text()
    visual_terms = entities(visual_source, anchors=True)
    if not set(visual_terms) <= terms.keys():
        raise ValueError('Visual references an unknown ontology term')
    numerical = (ROOT / 'web/inspection/page.html').read_text().replace(
        '__INFERENCE_DATA__', json.dumps(initial_generation(), allow_nan=False).replace('<', '\\u003c'))
    numerical = '<link rel="stylesheet" href="vendor/katex/katex.min.css"><link rel="stylesheet" href="inspection/page.css">' + numerical
    (output / 'index.html').write_text(shell('What happens if you change this?', numerical, landing=True))
    seal_assets(output)
    return output / 'index.html'


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--checkpoint', type=Path)
    parser.add_argument('--model-asset-base', help='Relative or HTTPS model asset URL prefix')
    args = parser.parse_args()
    if args.check:
        check_theme(ROOT)
        experiment_catalog(ROOT, load_declarations(), load_schema())
        print('Experiment declarations checked.')
    else:
        checkpoint = json.loads(args.checkpoint.read_text()) if args.checkpoint else None
        print(build(ROOT / 'out/intro-page', checkpoint=checkpoint, model_storage={'base_url':args.model_asset_base} if args.model_asset_base else None))
