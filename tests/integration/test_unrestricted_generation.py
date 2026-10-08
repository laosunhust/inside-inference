"""Adversarial real checkpoints expose filtering, forced stops, and output repair."""
import copy
import unittest
from unittest.mock import patch

from inside_inference.model import Model, ModelArchitecture, initialize
from inside_inference.tokenizer import Tokenizer, Turn, ContextOverflow
from inside_inference.workload import default_workload, run_workload
from scripts.check.selection_contract import assert_unrestricted_generation


class UnrestrictedGenerationTests(unittest.TestCase):
    def setUp(self):
        self.tokenizer=Tokenizer()
        self.checkpoint=initialize(ModelArchitecture(),self.tokenizer.manifest_sha256)
        self.workload=default_workload().to_dict()
        self.workload['requests'][0]['request']['generation']['max_new_tokens']=4

    def constant_winner(self,token):
        checkpoint=copy.deepcopy(self.checkpoint)
        checkpoint['parameters']['lm_head']=[[0.]*384 for _ in range(8)]
        checkpoint['parameters']['lm_bias']=[-100.]*384
        checkpoint['parameters']['lm_bias'][token]=100.
        return checkpoint

    def test_words_punctuation_spaces_other_controls_and_byte_ids_never_force_stop(self):
        tokens=self.tokenizer
        winners=[tokens.words['cat'],tokens.token_id('punctuation','!'),tokens.token_id('space',' '),
                 tokens.token_id('control','EOS'),tokens.token_id('control','BOS'),
                 next(t.id for t in tokens.tokens if t.kind=='byte'),
                 next(t.id for t in tokens.tokens if t.kind=='hex')]
        for winner in winners:
            with self.subTest(token=winner):
                run=run_workload(self.workload,checkpoint=self.constant_winner(winner))
                assert_unrestricted_generation(run)
                self.assertEqual(run['traces'][0]['output_ids'],[winner]*4)
                delivered=[i for e in run['events'] if e['payload']['kind']=='token-delivered' for i in e['payload']['token_ids']]
                self.assertEqual(delivered,[winner]*4)

    def test_turn_end_stops_immediately_even_at_budget_boundary(self):
        end=self.tokenizer.token_id('control','TURN_END')
        for budget in (1,4):
            self.workload['requests'][0]['request']['generation']['max_new_tokens']=budget
            run=run_workload(self.workload,checkpoint=self.constant_winner(end))
            assert_unrestricted_generation(run)
            self.assertEqual(run['traces'][0]['output_ids'],[end])
            self.assertFalse(any(e['payload']['kind']=='token-delivered' for e in run['events']))

    def test_real_weights_select_word_then_end_and_leave_allowance_unused(self):
        # A linear separator over two actual hidden states makes the target win at
        # the second position. No mocked forward function or scripted token stream.
        word=self.tokenizer.words['cat'];end=self.tokenizer.token_id('control','TURN_END')
        prompt=self.workload['requests'][0]['request']['text']
        prefix=list(self.tokenizer.encode_prompt([Turn('user',prompt)]).ids)
        model=Model(self.checkpoint)
        def hidden(ids):
            return next(n['values'][-1] for n in model.forward(ids)['nodes'] if n['name']=='ln_final')
        a,b=hidden(prefix),hidden(prefix+[word]);direction=[y-x for x,y in zip(a,b)]
        checkpoint=self.constant_winner(word)
        checkpoint['parameters']['lm_bias'][word]=0.
        checkpoint['parameters']['lm_bias'][end]=-sum(d*(x+y)/2 for d,x,y in zip(direction,a,b))
        for row,d in zip(checkpoint['parameters']['lm_head'],direction): row[end]=d
        run=run_workload(self.workload,checkpoint=checkpoint)
        assert_unrestricted_generation(run)
        self.assertEqual(run['traces'][0]['output_ids'],[word,end])
        self.assertEqual(run['traces'][0]['outcome']['unused_budget'],2)

    def test_context_capacity_is_admission_error_not_silent_early_stop(self):
        self.workload['requests'][0]['request']['text']='cat '*62
        with patch.object(Model,'forward') as forward:
            with self.assertRaisesRegex(ValueError,'token budget'):run_workload(self.workload)
            forward.assert_not_called()

    def test_oracle_rejects_a_fabricated_early_stop_or_a_filtered_winner(self):
        run=run_workload(self.workload)
        early=copy.deepcopy(run);early['traces'][0]['passes'].pop();early['traces'][0]['output_ids'].pop()
        with self.assertRaises(AssertionError):assert_unrestricted_generation(early)
        filtered=copy.deepcopy(run);filtered['traces'][0]['passes'][0]['selection']['selected_id']=5
        with self.assertRaises(AssertionError):assert_unrestricted_generation(filtered)
