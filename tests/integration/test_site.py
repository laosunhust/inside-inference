import copy
import hashlib
from html.parser import HTMLParser
import json
import re
from pathlib import Path
import tempfile
import unittest
from urllib.parse import unquote, urlsplit

from scripts.build.intro_page import build, load_catalog, ontology_terms
from inside_inference.labs.kda import demo, step


class PageParser(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids = set()
        self.links = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            if attrs['id'] in self.ids:
                raise ValueError('Duplicate HTML anchor')
            self.ids.add(attrs['id'])
        for attr in ('href', 'src'):
            if attr in attrs:
                self.links.append(attrs[attr])


class AtlasTests(unittest.TestCase):
    shared_site = None
    shared_checkpoint = None

    @classmethod
    def setUpClass(cls):
        if cls.shared_site is not None:
            cls.site = cls.shared_site
            return
        cls.directory = tempfile.TemporaryDirectory()
        cls.addClassCleanup(cls.directory.cleanup)
        cls.site = Path(cls.directory.name)
        build(cls.site, checkpoint=cls.shared_checkpoint)

    def test_rejects_invalid_catalog(self):
        original = load_catalog()
        for mutate in (lambda d: d['innovations'][0].update(primary='missing'),
                       lambda d: d['innovations'][0].update(status='proven'),
                       lambda d: d['innovations'][0].update(journey_steps=['unknown']),
                       lambda d: d['innovations'][0].update(journey_steps=['decode', 'decode']),
                       lambda d: d['innovations'][0].update(id='../escape'),
                       lambda d: d['layers'][1].update(id=d['layers'][0]['id'])):
            data = copy.deepcopy(original)
            mutate(data)
            with tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / 'catalog.json'
                path.write_text(json.dumps(data))
                with self.assertRaises(ValueError):
                    load_catalog(path)

    def test_landing_embeds_preparation_and_canonical_definitions(self):
        root = self.site
        page = (root / 'index.html').read_text()
        def embedded(identifier):
            return json.loads(re.search(r'<script id="' + identifier + r'" type="application/json">(.*?)</script>', page, re.S).group(1))
        from scripts.build.intro_page import initial_generation
        snapshot=embedded('inference-data')
        self.assertEqual(snapshot, json.loads(json.dumps(initial_generation())))
        self.assertNotIn('receipt',snapshot)
        self.assertNotIn('output_ids',snapshot)
        self.assertNotIn('passes',snapshot)
        self.assertNotIn('id="ontology-data"',page)
        self.assertIn('declarations.generated.js',page)
        self.assertNotIn('journey-data', page)
        self.assertFalse((root / 'request-cost.html').exists())

    def test_primary_listing_and_related_references_share_catalog(self):
        from scripts.build.presentation import lab_index, Elements
        from scripts.build.ontology import load_declarations
        from scripts.build.intro_page import STATUS
        catalog = load_catalog()
        entries={e['id']:e for e in catalog['innovations']}
        expected={'naive-gpt':'ModelExecution','kimi-delta-attention':'Attention',
                  'prefix-cache':'KVCache','prefill-decode':'StateTransfer',
                  'speculative-decoding':'Decoding','positional-encoding':'PositionEncoding'}
        for lab,owner in expected.items():
            binding=entries[lab]['ontology_binding']
            self.assertEqual(binding['primary'],owner)
            self.assertNotIn('InferenceSystem',[binding['primary'],*binding['related']])
            self.assertNotIn('InferenceResponse',[binding['primary'],*binding['related']])
        self.assertEqual(entries['speculative-decoding']['status'],'planned')
        self.assertEqual(entries['prefill-decode']['status'],'planned')

        kda = next(e for e in catalog['innovations'] if e['id'] == 'kimi-delta-attention')
        self.assertEqual(kda['ontology_binding']['related'], [])
        speculative = next(e for e in catalog['innovations'] if e['id'] == 'speculative-decoding')
        self.assertNotIn('GenerationPolicy', speculative['ontology_binding']['related'])
        body = lab_index(load_declarations(), catalog, STATUS)
        elements = Elements(body).elements
        subjects = {owner for e in catalog['innovations']
                    for owner in [e['ontology_binding']['primary'], *e['ontology_binding']['related']]}
        self.assertEqual({a['id'] for tag,a in elements if tag == 'section'}, subjects)
        for internal in ('ExperimentSpec','ExperimentExecution','ExperimentObservation','InspectionState','ApiError'):
            self.assertNotIn(f'id="{internal}"', body)
        listings = [a for _, a in elements if 'data-lab' in a]
        self.assertEqual(len(listings), len(catalog['innovations']))
        for entry in catalog['innovations']:
            self.assertEqual([a['data-primary'] for a in listings if a['data-lab'] == entry['id']],
                             [entry['ontology_binding']['primary']])
            references = [a for _, a in elements if a.get('href') == '#lab-' + entry['id']]
            self.assertEqual(len(references), len(entry['ontology_binding']['related']))
        # Mutate the source, not a second expected registry: the generated view follows it.
        kda['ontology_binding']['related'] = ['Workload']
        kda['name'] = 'Changed source label'
        changed = lab_index(load_declarations(), catalog, STATUS)
        self.assertIn('Changed source label', changed)
        self.assertNotIn('id="Workload"', body)
        self.assertIn('id="Workload"', changed)
        self.assertEqual(changed.count('href="#lab-kimi-delta-attention"'), 1)

    def test_kda_setup_follows_executed_trace(self):
        from unittest.mock import patch
        traces = {label: events[:2] for label, events in demo().items()}
        # This mutation tests KDA rendering. Reuse already-verified unrelated
        # numerical artifacts instead of recomputing GPT and KV experiments.
        def embedded(page, identifier):
            source=(self.site/page).read_text()
            return json.loads(re.search(r'<script id="'+identifier+r'" type="application/json">(.*?)</script>',source,re.S).group(1))
        snapshot=embedded('index.html','inference-data')
        with tempfile.TemporaryDirectory() as directory, \
             patch('scripts.build.intro_page.demo', return_value=traces), \
             patch('scripts.build.intro_page.initial_generation', return_value=snapshot):
            root = Path(directory)
            build(root, checkpoint=self.shared_checkpoint)
            page = (root/'labs/kimi-delta-attention.html').read_text()
            self.assertIn('id="step-count">2</span>', page)
            self.assertIn('max="1" value="0"', page)
            raw = re.search(r'<script id="trace-data" type="application/json">(.*?)</script>', page, re.S).group(1)
            self.assertEqual(json.loads(raw), traces)

    def test_portable_links_and_lab_statuses(self):
        root = self.site
        pages = {p.resolve(): PageParser(p.read_text()) for p in root.rglob('*.html')}
        for path, page in pages.items():
            for link in page.links:
                parts = urlsplit(link)
                if parts.scheme or parts.netloc:
                    continue
                target = (path.parent / unquote(parts.path)).resolve() if parts.path else path
                self.assertTrue(target.is_relative_to(root), link)
                self.assertTrue(target.is_file(), link)
                if parts.fragment:
                    self.assertIn(parts.fragment, pages[target].ids)
        for entry in load_catalog()['innovations']:
            page = (root / 'labs' / f"{entry['id']}.html").read_text()
            self.assertIn('false positives', page)
            self.assertIn('false negatives', page)
            if entry['status'] == 'planned':
                self.assertIn('No experiment or measured result', page)
        def snapshot():
            return {p.relative_to(root): hashlib.sha256(p.read_bytes()).hexdigest()
                    for p in root.rglob('*') if p.is_file()}
        before = snapshot()
        build(root, checkpoint=self.shared_checkpoint)
        self.assertEqual(before, snapshot())

    def test_release_decoder_against_independent_scalar_reference(self):
        import subprocess
        import zipfile
        from inside_inference.model import Model, ModelArchitecture, initialize
        from inside_inference.tokenizer import Tokenizer
        from scripts import ROOT
        cases=[]
        for layers in (1,2):
            checkpoint=initialize(ModelArchitecture(width=4,ffn=8,layers=layers,context=8),Tokenizer().manifest_sha256,seed=19)
            ids=[0,3,42,6]
            reference=Model(checkpoint).forward(ids)
            cases.append(dict(checkpoint=checkpoint,ids=ids,logits=reference['logits'],nodes=reference['nodes']))
        with tempfile.TemporaryDirectory(dir=ROOT/'out') as directory:
            fixture=Path(directory)/'reference.json';fixture.write_text(json.dumps(cases))
            result=subprocess.run(['node',str(ROOT/'tests/integration/decoder_reference.mjs'),str(self.site),str(fixture)],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        with zipfile.ZipFile(self.site/'execution/engine.zip') as package:
            self.assertNotIn('inside_inference/runtimes/reference.py',package.namelist())
            self.assertNotIn('inside_inference/runtimes/inspectable.py',package.namelist())


if __name__ == '__main__':
    unittest.main()
