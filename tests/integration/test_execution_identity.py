"""Resolved specifications and provenance must describe the actual computation."""
import copy
import unittest
from inside_inference.cache_lab import default_experiment, run_cache_experiment, replay_cache
from inside_inference.model import initialize, ModelArchitecture, identity
from inside_inference.tokenizer import Tokenizer
from tests.fixtures.execution import small_checkpoint
from inside_inference.provenance import source_inventory


class ExecutionIdentityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.checkpoint = small_checkpoint(seed=11)
        cls.request = {'text':'the ball is in', 'generation':{
            'max_new_tokens':2, 'selection':'greedy-lowest-id-tie', 'stopping':'model-end-or-budget'}}
        cls.workload = {'kind':'fixed-arrivals','requests':[{'request_id':'r1','arrival_us':0,'request':cls.request}]}
        cls.input = default_experiment()
        cls.input['workload'] = cls.workload
        cls.cache = run_cache_experiment(cls.input, checkpoint=cls.checkpoint)

    def test_binding_keeps_submission_separate_and_records_actual_provenance(self):
        run = self.cache
        self.assertEqual(set(run['declaration']), {'model','system','workload','ontology_binding'})
        self.assertEqual(run['declaration']['model']['checkpoint_sha256'], identity(self.checkpoint))
        self.assertEqual(run['declaration']['workload'], self.workload)
        self.assertEqual(set(self.input), {'system','workload','ontology_binding'})
        with self.assertRaises(ValueError):
            run_cache_experiment(dict(self.input, model=run['declaration']['model']))
        changed = run_cache_experiment(self.input)
        self.assertNotEqual(changed['declaration']['model'], run['declaration']['model'])
        self.assertNotEqual(changed['id'], run['id'])
        self.assertEqual(run['provenance']['sources'], source_inventory())
        self.assertEqual(run['provenance']['source_sha256'], identity(source_inventory()))

    def test_replay_rejects_tampered_models_sources_and_runtime(self):
        for original, execute in ((self.cache, replay_cache),):
            def source_and_hash(r):
                r['provenance']['sources']['inside_inference/model.py'] = '0'*64
                r['provenance']['source_sha256'] = identity(r['provenance']['sources'])
            mutations = [
                lambda r:r['declaration']['model'].update(checkpoint_sha256='0'*64),
                lambda r:r['provenance']['sources'].update({'inside_inference/model.py':'0'*64}),
                source_and_hash,
                lambda r:r['provenance'].update(python='different-runtime'),
                lambda r:r['provenance']['backend'].update(compute_device='fabricated-device'),
            ]
            if execute is replay_cache:
                mutations.append(lambda r:r['checkpoint']['parameters']['lm_bias'].__setitem__(0, 123.0))
            for mutate in mutations:
                with self.subTest(path=execute.__name__, mutation=mutate):
                    bad = copy.deepcopy(original); mutate(bad)
                    with self.assertRaises(ValueError): execute(bad)

    def test_revision_label_alone_does_not_prevent_replay(self):
        for original, execute in ((self.cache, replay_cache),):
            changed = copy.deepcopy(original)
            changed['provenance']['revision'] = 'a-different-commit-with-the-same-source-bytes'
            result = execute(changed)
            self.assertEqual(result['provenance'], changed['provenance'])

    def test_replay_compares_numeric_values_not_json_number_spelling(self):
        def browser_numbers(value):
            if isinstance(value,float) and value.is_integer(): return int(value)
            if isinstance(value,list): return [browser_numbers(v) for v in value]
            if isinstance(value,dict): return {k:browser_numbers(v) for k,v in value.items()}
            return value
        # Keep the identified checkpoint intact; the execution envelope crosses JSON.
        changed = browser_numbers(self.cache)
        changed['checkpoint'] = self.cache['checkpoint']
        self.assertEqual(replay_cache(changed)['events'], self.cache['events'])
