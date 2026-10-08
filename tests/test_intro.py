import copy
from html.parser import HTMLParser
import json
from pathlib import Path
import tempfile
import unittest
from urllib.parse import unquote, urlsplit

from scripts.intro_page import build, load_catalog
from scripts.kda import demo, step


class RecurrenceTests(unittest.TestCase):
    def test_matches_direct_transition_matrix(self):
        # Independent evaluation: (I - beta k k^T) diag(alpha) S + beta k v^T.
        state = [[0.25, -0.5], [0.75, 1.25]]
        key, value, query, alpha, beta = [0.6, 0.8], [-0.4, 0.7], [0.8, -0.6], [0.3, 0.9], 0.65
        transition = [[((1 if i == j else 0) - beta * key[i] * key[j]) * alpha[j]
                       for j in range(2)] for i in range(2)]
        expected = [[sum(transition[i][r] * state[r][j] for r in range(2))
                     + beta * key[i] * value[j] for j in range(2)] for i in range(2)]
        actual = step(state, key, value, query, alpha, beta)
        for i in range(2):
            for j in range(2):
                self.assertAlmostEqual(actual['after'][i][j], expected[i][j])
        for j in range(2):
            self.assertAlmostEqual(actual['output'][j], sum(expected[i][j] * query[i] for i in range(2)))
        self.assertEqual(state, [[0.25, -0.5], [0.75, 1.25]])

    def test_no_write_only_decays(self):
        result = step([[2., 4.], [6., 8.]], [1., 0.], [99., 99.], [0., 1.], [0.5, 1.], 0.)
        self.assertEqual(result['after'], [[1., 2.], [6., 8.]])
        self.assertEqual(result['output'], [6., 8.])

    def test_full_write_corrects_unit_key(self):
        result = step([[2., 4.], [6., 8.]], [1., 0.], [3., 5.], [1., 0.], [1., 1.], 1.)
        self.assertEqual(result['output'], [3., 5.])
        self.assertEqual(result['after'][1], [6., 8.])

    def test_shapes_fail_explicitly(self):
        with self.assertRaises(ValueError):
            step([[0.]], [1., 0.], [1.], [1., 0.], [1., 1.], 1.)

    def test_demo_is_deterministic_and_continuous(self):
        self.assertEqual(demo(), demo())
        for trace in demo().values():
            for prev, current in zip(trace, trace[1:]):
                self.assertEqual(prev['after'], current['before'])


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

    def test_portable_links_and_lab_statuses(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            build(root)
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
            before = {p.relative_to(root): p.read_bytes() for p in root.rglob('*') if p.is_file()}
            build(root)
            self.assertEqual(before, {p.relative_to(root): p.read_bytes() for p in root.rglob('*') if p.is_file()})


if __name__ == '__main__':
    unittest.main()
