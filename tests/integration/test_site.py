import hashlib
from html.parser import HTMLParser
import json
import re
from pathlib import Path
import tempfile
import unittest
from urllib.parse import unquote, urlsplit

from scripts.build.intro_page import build
from scripts.build.hosting.layout import asset_root


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

    def test_portable_links_and_no_standalone_labs(self):
        root = self.site
        self.assertEqual([p.relative_to(root).as_posix() for p in root.rglob('*.html')], ['index.html'])
        pages = {p.resolve(): PageParser(p.read_text()) for p in root.rglob('*.html')}
        for path, page in pages.items():
            for link in page.links:
                parts = urlsplit(link)
                if parts.scheme or parts.netloc:
                    continue
                target = ((root / unquote(parts.path).lstrip('/')) if parts.path.startswith('/') else (path.parent / unquote(parts.path))).resolve() if parts.path else path
                if target.is_dir(): target = target/'index.html'
                self.assertTrue(target.is_relative_to(root), link)
                self.assertTrue(target.is_file(), link)
                if parts.fragment:
                    self.assertIn(parts.fragment, pages[target].ids)
        # Experiments are configured on the main page; no standalone lab pages are built.
        self.assertFalse((root / 'labs').exists())
        for retired in ('labs-by-concept.html', 'kv-contract.html', 'naive-gpt-contract.html'):
            self.assertFalse((root / retired).exists(), retired)
        def snapshot():
            return {p.relative_to(root): hashlib.sha256(p.read_bytes()).hexdigest()
                    for p in root.rglob('*') if p.is_file()}
        before = snapshot()
        build(root, checkpoint=self.shared_checkpoint)
        self.assertEqual(before, snapshot())

    def test_release_packages_one_python_engine(self):
        import zipfile
        with zipfile.ZipFile(asset_root(self.site)/'execution/engine.zip') as package:
            names = set(package.namelist())
        self.assertTrue({'inside_inference/runtimes/engine.py', 'inside_inference/runtimes/bpe.py',
                         'inside_inference/delivery/models.py'} <= names)
        for retired in ('inside_inference/runtimes/reference.py', 'inside_inference/runtimes/engine.c',
                        'execution/llama/llama.wasm', 'web/execution/decoder.js'):
            self.assertNotIn(retired, names)
        self.assertFalse((asset_root(self.site)/'execution/llama').exists())
        self.assertTrue(any(p.name.startswith('numpy-2.0.2') for p in (asset_root(self.site)/'execution/runtime').iterdir()))

    def test_published_code_spans_equal_packaged_engine_sources(self):
        import hashlib
        import zipfile
        text = (asset_root(self.site)/'principles-code.js').read_text()
        spans = json.loads(text[text.index('(') + 1:text.rindex(')')])
        with zipfile.ZipFile(asset_root(self.site)/'execution/engine.zip') as package:
            for identifier, span in spans.items():
                raw = package.read(span['path'])
                self.assertEqual(hashlib.sha256(raw).hexdigest(), span['sha256'], identifier)
                lines = raw.decode().splitlines()
                self.assertEqual(lines[span['start'] - 2].strip(), '# principle ' + identifier)
                self.assertEqual(lines[span['end']].strip(), '# end principle ' + identifier)
                self.assertEqual('\n'.join(lines[span['start'] - 1:span['end']]), span['code'], identifier)
        for name in ('katex.min.js', 'katex.min.css', 'LICENSE'):
            self.assertTrue((asset_root(self.site)/'vendor/katex'/name).is_file())
        css = (asset_root(self.site)/'vendor/katex/katex.min.css').read_text()
        for font in set(re.findall(r'url\((fonts/[^)]+\.woff2)\)', css)):
            self.assertTrue((asset_root(self.site)/'vendor/katex'/font).is_file(), font)

if __name__ == '__main__':
    unittest.main()
