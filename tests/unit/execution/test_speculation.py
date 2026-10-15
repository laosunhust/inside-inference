"""Greedy verification decisions and cache rollback counterexamples."""
import unittest
from types import SimpleNamespace
from inside_inference.runtimes.speculation import verify_greedy, trim


class SpeculationTests(unittest.TestCase):
    def test_first_later_and_no_rejection(self):
        self.assertEqual(verify_greedy([2,3], [7,8,9], [0], 8), ([7],0))
        self.assertEqual(verify_greedy([2,3], [2,8,9], [0], 8), ([2,8],1))
        self.assertEqual(verify_greedy([2,3], [2,3,9], [0], 8), ([2,3,9],2))

    def test_end_tokens_and_budget(self):
        self.assertEqual(verify_greedy([0], [7,8], [0], 8), ([7],0))
        self.assertEqual(verify_greedy([2,0], [2,0,9], [0], 8), ([2,0],2))
        self.assertEqual(verify_greedy([2], [0,9], [0], 8), ([0],0))
        self.assertEqual(verify_greedy([2,3], [2,3,9], [0], 1), ([2],1))
        self.assertEqual(verify_greedy([], [9], [0], 1), ([9],0))

    def test_rollback_and_changed_prefix(self):
        decoder=SimpleNamespace(prefix=[1,2,3,4])
        trim(decoder,[1,2,8]);self.assertEqual(decoder.prefix,[1,2])
        trim(decoder,[1]);self.assertEqual(decoder.prefix,[1])
        trim(decoder,[9]);self.assertEqual(decoder.prefix,[])

    def test_invalid_verification(self):
        with self.assertRaises(ValueError):verify_greedy([2],[2],[],8)
        with self.assertRaises(ValueError):verify_greedy([],[2],[],0)

class RoundTests(unittest.TestCase):
    def service(self, choose):
        import numpy as np
        class Decoder:
            def __init__(self): self.prefix=[];self.calls=0
            def run(self, ids, reuse):
                self.calls+=1
                start=len(self.prefix) if reuse and ids[:len(self.prefix)]==self.prefix and len(self.prefix)<len(ids) else 0
                rows=np.zeros((len(ids)-start,10))
                for row,i in enumerate(range(start,len(ids))):rows[row,choose(ids[:i+1])]=1
                self.prefix=list(ids)
                return {'logits':rows[-1],'logits_rows':rows,'work':{'processed_positions':len(ids)-start,'reused_positions':start,'matmul_flops':float(len(rows)*20)}}
        return SimpleNamespace(decoder=Decoder(),model={'id':'fixture','weights':{'sha256':'a'*64},'architecture':{'context':8},'stop_ids':[0]})

    def request(self, outputs=None):
        return {'prefix_ids':[1],'output_ids':outputs or [],'generation':{'max_new_tokens':8},'execution':{'experiments':[]}}

    def test_one_target_call_verifies_a_block_and_buffer_is_not_recomputed(self):
        from inside_inference.runtimes.speculation import Speculator
        choose=lambda ids:len(ids)+1 if len(ids)<5 else 0
        target,draft=self.service(choose),self.service(choose)
        runner=Speculator(target,draft,3);output=[];rounds=[]
        for _ in range(4):
            run,duration,delivery=runner.next(self.request(output));output.append(int(run['logits'].argmax()))
            if delivery['round']:rounds.append(delivery['round'])
            else:self.assertEqual((run['work']['processed_positions'],duration),(0,0))
        self.assertEqual(output,[2,3,4,5]);self.assertEqual(target.decoder.calls,1)
        self.assertEqual(rounds[0]['accepted_count'],3);self.assertEqual(rounds[0]['draft_calls'],3)
        self.assertEqual(target.decoder.prefix,[1,2,3,4])
        run,_,delivery=runner.next(self.request(output));self.assertEqual(int(run['logits'].argmax()),0)

    def test_no_draft_work_when_budget_or_context_has_no_room(self):
        from inside_inference.runtimes.speculation import Speculator
        for step in [{**self.request(),'generation':{'max_new_tokens':1}}, {**self.request(),'prefix_ids':[1]*8}]:
            target,draft=self.service(lambda ids:2),self.service(lambda ids:2)
            runner=Speculator(target,draft,3)
            _,_,delivery=runner.next(step)
            self.assertEqual(delivery['round']['proposed_ids'],[])
            self.assertEqual(delivery['round']['committed_ids'],[2])
            self.assertEqual(draft.decoder.calls,0)
            self.assertEqual(target.decoder.calls,1)

    def test_rejection_rolls_back_and_changed_request_discards_buffer(self):
        from inside_inference.runtimes.speculation import Speculator
        target,draft=self.service(lambda ids:2),self.service(lambda ids:8)
        runner=Speculator(target,draft,3)
        _,_,delivery=runner.next(self.request());self.assertEqual(delivery['round']['accepted_count'],0)
        self.assertEqual(target.decoder.prefix,[1]);self.assertEqual(draft.decoder.prefix,[1])
        target,draft=self.service(lambda ids:2),self.service(lambda ids:2)
        runner=Speculator(target,draft,3);runner.next(self.request())
        self.assertTrue(runner.pending)
        changed={**self.request(),'prefix_ids':[9]}
        _,_,delivery=runner.next(changed)
        self.assertFalse(delivery['buffered']);self.assertEqual(target.decoder.calls,2)
        self.assertEqual(delivery['round']['target_work']['reused_positions'],0)

class AdmissionTests(unittest.TestCase):
    def test_incompatible_execution_and_draft_configs_fail(self):
        from copy import deepcopy
        from inside_inference.declarations_generated import EXPERIMENTS, ExecutionSpec
        valid=EXPERIMENTS['speculative-decoding']['variants'][1]['input']['execution']
        mutations=[('kv_reuse',False),('model','tinyllm-8k'),('speculation',{'draft_model':'tinyllm-8k','proposal_tokens':4}),('speculation',{'draft_model':'tinyllm-500k','proposal_tokens':0})]
        for control,value in mutations:
            changed=deepcopy(valid);next(c for c in changed['experiments'] if c['control']==control)['value']=value
            with self.subTest(control=control,value=value),self.assertRaises(ValueError):ExecutionSpec.validate_shape(changed)
        changed=deepcopy(valid);changed['experiments'].append(deepcopy(changed['experiments'][-1]))
        with self.assertRaises(ValueError):ExecutionSpec.validate_shape(changed)
        changed=deepcopy(EXPERIMENTS['kv-residency']['variants'][0]['input']['execution'])
        changed['experiments'].append(deepcopy(valid['experiments'][-1]))
        with self.assertRaises(ValueError):ExecutionSpec.validate_shape(changed)

    def test_residency_requires_compatible_model_and_reuse_in_the_schema(self):
        from copy import deepcopy
        from inside_inference.declarations_generated import EXPERIMENTS, ExecutionSpec
        valid=EXPERIMENTS['kv-residency']['variants'][0]['input']['execution']
        for name,value in [('model','tinyllm-4m'),('kv_reuse',False)]:
            changed=deepcopy(valid);next(c for c in changed['experiments'] if c['control']==name)['value']=value
            with self.subTest(control=name),self.assertRaises(ValueError):ExecutionSpec.validate_shape(changed)
