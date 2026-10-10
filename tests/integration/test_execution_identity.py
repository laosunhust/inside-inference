"""Resolved specifications and provenance must describe the actual computation."""
import copy
import unittest
from inside_inference.cache_lab import default_experiment, run_cache_experiment, replay_cache
from inside_inference.generation import run_request, replay
from inside_inference.workload import run_workload, replay_workload, default_workload
from inside_inference.model import initialize, ModelArchitecture, identity
from inside_inference.tokenizer import Tokenizer
from tests.fixtures.execution import small_checkpoint
from inside_inference.provenance import source_inventory


class ExecutionIdentityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.checkpoint = small_checkpoint(seed=11)
        cls.request = {'text':'the ball is in', 'generation':{
            'max_new_tokens':2, 'selection':'greedy-lowest-id-tie', 'stopping':'turn-end-or-budget'}}
        cls.trace = run_request(cls.request, checkpoint=cls.checkpoint)
        cls.workload = default_workload(cls.request).to_dict()
        cls.input = default_experiment()
        cls.input['workload'] = cls.workload
        cls.cache = run_cache_experiment(cls.input, checkpoint=cls.checkpoint)

    def test_both_paths_resolve_the_selected_model_and_keep_submission_separate(self):
        reference = run_workload(self.workload, checkpoint=self.checkpoint)
        for run in (reference, self.cache):
            self.assertEqual(set(run['declaration']), {'model','system','workload','ontology_binding'})
            self.assertEqual(run['declaration']['model']['checkpoint_sha256'], identity(self.checkpoint))
            self.assertEqual(run['declaration']['workload'], self.workload)
        self.assertEqual(reference['declaration']['model'], self.cache['declaration']['model'])
        self.assertEqual(set(self.input), {'system','workload','ontology_binding'})
        with self.assertRaises(ValueError):
            run_cache_experiment(dict(self.input, model=self.cache['declaration']['model']))
        changed = run_cache_experiment(self.input)
        self.assertNotEqual(changed['declaration']['model'], self.cache['declaration']['model'])
        self.assertNotEqual(changed['id'], self.cache['id'])
        self.assertEqual(replay_workload(reference), reference)

    def test_shared_provenance_preserves_details_and_backend_differences(self):
        reference, cached = self.trace['provenance'], self.cache['provenance']
        self.assertEqual(set(reference), set(cached))
        self.assertEqual(reference['sources'], source_inventory())
        self.assertEqual(reference['sources'], cached['sources'])
        self.assertEqual(reference['source_sha256'], identity(reference['sources']))
        self.assertNotEqual(reference['backend']['device_state_storage'], cached['backend']['device_state_storage'])
        self.assertNotIn('backend', self.cache)
        self.assertNotIn('source_sha256', self.cache)
        self.assertNotIn('code', self.trace)

    def test_replay_rejects_tampered_models_sources_and_runtime(self):
        for original, execute in ((self.trace, replay), (self.cache, replay_cache)):
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
        for original, execute in ((self.trace, replay), (self.cache, replay_cache)):
            changed = copy.deepcopy(original)
            changed['provenance']['revision'] = 'a-different-commit-with-the-same-source-bytes'
            result = execute(changed)
            self.assertEqual(result['provenance'], changed['provenance'])
