"""Explicit hardware checks; absent CUDA is a failure in this optional harness."""
import unittest
import math
import torch

from inside_inference.cache_lab import run_cache_experiment,replay_cache
from inside_inference.cuda_runtime import CudaRuntime
from inside_inference.model import ModelArchitecture,initialize,identity
from inside_inference.tokenizer import Tokenizer
from tests.fixtures.execution import cache_scenario as scenario


class CudaCacheTests(unittest.TestCase):
    def test_pinned_offload_and_restore_preserve_actual_payload(self):
        runtime=CudaRuntime(initialize(ModelArchitecture(),Tokenizer().manifest_sha256))
        try:
            result,_=runtime.compute([0,3,42],runtime.empty(),capture=True,request_id='r',run_id='test',step=0)
            state=result['state'];key=identity(state.to_dict())
            reference={n['operation']['name']:n['values'] for n in runtime.model.forward([0,3,42])['nodes']}
            for matrix,name in ((state.keys,'key'),(state.values,'value')):
                for actual,expected in zip(matrix,reference[name]):
                    for x,y in zip(actual,expected):self.assertTrue(math.isclose(x,y,abs_tol=1e-10,rel_tol=1e-9))
            original=tuple(x.clone() for x in runtime.gpu[key])
            runtime.transfer(key,True)
            self.assertNotIn(key,runtime.gpu)
            self.assertTrue(all(x.is_pinned() for x in runtime.pinned_host[key]))
            with self.assertRaisesRegex(ValueError,'VRAM-resident'):
                runtime.compute([52],state,capture=True,request_id='r',run_id='test',step=1)
            runtime.transfer(key,False)
            self.assertNotIn(key,runtime.pinned_host)
            for x,y in zip(original,runtime.gpu[key]):self.assertTrue(torch.equal(x,y))
            retained,elapsed=runtime.retain(state,2)
            for expected,actual in zip(original,runtime.gpu[identity(retained.to_dict())]):
                self.assertTrue(torch.equal(expected[:,:2],actual))
            self.assertGreaterEqual(elapsed,0)
        finally:runtime.close()

    def test_real_cuda_miss_retrieval_and_replay(self):
        spec=scenario(('the ball','the cup','the ball'),device=1024,active=1)
        spec['system']['model_execution']['backend']='cuda'
        run=run_cache_experiment(spec)
        self.assertIn('remote-hit',[e['kind'] for e in run['events']])
        self.assertTrue(all(c['reference_max_abs_error']<1e-10 for c in run['computations']))
        self.assertTrue(any(m['kind']=='host-to-device' and m['bytes']>0 for m in run['measurements']))
        self.assertEqual(torch.cuda.get_device_name(),run['provenance']['backend']['compute_device'])
        replay_cache(run)
