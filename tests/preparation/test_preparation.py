"""Independent numerical and persistence checks for optional checkpoint preparation."""
from copy import deepcopy
import math
from pathlib import Path
import random
import tempfile
import unittest

import torch

from inside_inference.model import Model, ModelArchitecture, initialize, softmax, identity
from inside_inference.preparation import (PreparationModel, batch_tensors, evaluate, generate,
    load_state, make_optimizer, prepare_examples, response_loss, save_state, train_step)
from inside_inference.tokenizer import Tokenizer

CONFIG = {'learning_rate': 0.003, 'betas': [0.9, 0.999], 'epsilon': 1e-8, 'weight_decay': 0.01}


class PreparationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        torch.set_num_threads(1)
        torch.use_deterministic_algorithms(True)
        cls.tokenizer = Tokenizer()
        cls.checkpoint = initialize(ModelArchitecture(), cls.tokenizer.manifest_sha256)
        cls.pad = cls.tokenizer.token_id('control', 'PAD')
        cls.examples = prepare_examples()

    def test_full_logits_match_reference_and_future_tokens_do_not_change_prefix(self):
        model = PreparationModel(self.checkpoint)
        for ids in ([0, 3, 52, 5, 4], [0, 8, 12, 5, 4, 24, 5]):
            reference = torch.tensor(Model(self.checkpoint).forward(ids, capture=False)['logits'], dtype=torch.float64)
            actual = model(torch.tensor([ids]))[0]
            torch.testing.assert_close(actual, reference, atol=1e-10, rtol=1e-9)
            extended = model(torch.tensor([list(ids) + [44, 66]]))[0, :len(ids)]
            torch.testing.assert_close(actual, extended, atol=1e-12, rtol=1e-12)

    def test_loss_targets_padding_and_independent_reference_loss(self):
        short = {'prompt_ids': [0, 3, 52, 5, 4], 'response_ids': [54, 24, 5]}
        long = {'prompt_ids': [0, 3, 52, 6, 54, 5, 4], 'response_ids': [65, 24, 5]}
        examples = [short, long]
        inputs, labels = batch_tensors(examples, self.pad)
        self.assertEqual(labels[0].tolist(), [-100]*4 + [54, 24, 5] + [-100]*2)
        self.assertEqual(inputs[0, -2:].tolist(), [self.pad]*2)
        model = PreparationModel(self.checkpoint)
        expected = []
        for example in examples:
            prefix = example['prompt_ids'][:]
            for target in example['response_ids']:
                logits = Model(self.checkpoint).forward(prefix, capture=False)['logits'][-1]
                expected.append(-math.log(softmax(logits)[target]))
                prefix.append(target)
        self.assertAlmostEqual(float(response_loss(model, examples, self.pad).detach()), sum(expected)/len(expected), places=11)
        changed = inputs.clone()
        changed[0, -2:] = 77
        torch.testing.assert_close(model(inputs)[0, :7], model(changed)[0, :7], atol=1e-12, rtol=1e-12)

    def test_gradients_against_finite_difference_of_independent_engine(self):
        example = {'prompt_ids': [0, 3, 52, 5, 4], 'response_ids': [54, 24, 5]}
        model = PreparationModel(self.checkpoint)
        response_loss(model, [example], self.pad).backward()
        def loss(checkpoint):
            sequence = example['prompt_ids'] + example['response_ids']
            logits = Model(checkpoint).forward(sequence[:-1], capture=False)['logits']
            start = len(example['prompt_ids'])-1
            return sum(-math.log(softmax(logits[start+i])[target])
                       for i, target in enumerate(example['response_ids']))/len(example['response_ids'])
        for name, parameter in model.weights.items():
            # Largest derivative avoids accepting only structurally zero coordinates.
            flat_index = int(parameter.grad.abs().reshape(-1).argmax())
            indices = [flat_index] if parameter.ndim == 1 else [flat_index//parameter.shape[1], flat_index%parameter.shape[1]]
            values = []
            for delta in (-1e-5, 1e-5):
                checkpoint = deepcopy(self.checkpoint)
                target = checkpoint['parameters'][name]
                for index in indices[:-1]: target = target[index]
                target[indices[-1]] += delta
                values.append(loss(checkpoint))
            numerical = (values[1]-values[0])/2e-5
            actual = float(parameter.grad.reshape(-1)[flat_index])
            self.assertTrue(math.isclose(actual, numerical, rel_tol=2e-4, abs_tol=2e-6), (name, actual, numerical))

    def test_adamw_two_updates_match_scalar_equations(self):
        p = torch.nn.Parameter(torch.tensor([0.25], dtype=torch.float64))
        optimizer = torch.optim.AdamW([p], lr=0.003, betas=(0.9,0.999), eps=1e-8, weight_decay=0.01, foreach=False)
        value, mean, square = 0.25, 0.0, 0.0
        for step, gradient in enumerate((0.4, -0.2), 1):
            p.grad = torch.tensor([gradient], dtype=torch.float64)
            optimizer.step()
            mean = .9*mean + .1*gradient
            square = .999*square + .001*gradient**2
            value = value*(1-.003*.01) - .003*(mean/(1-.9**step))/(math.sqrt(square/(1-.999**step))+1e-8)
            self.assertAlmostEqual(float(p.detach()), value, places=14)

    def test_resume_reproduces_next_update_and_sampler_exactly(self):
        model = PreparationModel(self.checkpoint)
        optimizer, sampler = make_optimizer(model, CONFIG), random.Random(7)
        examples = self.examples['train'][:12]
        def update(m, o, r):
            batch = [examples[r.randrange(len(examples))] for _ in range(3)]
            return train_step(m, o, batch, self.pad)
        update(model, optimizer, sampler)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'state.pt'
            save_state(path, model, optimizer, sampler, 1, 'test')
            uninterrupted = update(model, optimizer, sampler)
            restored = PreparationModel(self.checkpoint)
            restored_optimizer, restored_sampler = make_optimizer(restored, CONFIG), random.Random(99)
            self.assertEqual(load_state(path, restored, restored_optimizer, restored_sampler, 'test'), 1)
            self.assertEqual(uninterrupted, update(restored, restored_optimizer, restored_sampler))
            for name in model.weights:
                torch.testing.assert_close(model.weights[name], restored.weights[name], atol=0, rtol=0)
            self.assertEqual(sampler.getstate(), restored_sampler.getstate())
            with self.assertRaisesRegex(ValueError, 'identity'):
                load_state(path, restored, restored_optimizer, restored_sampler, 'changed')

    def test_invalid_ids_and_provenance_are_rejected(self):
        model = PreparationModel(self.checkpoint)
        for ids in ([[0,-1]], [[384]], [[]]):
            with self.assertRaises(ValueError): model(torch.tensor(ids,dtype=torch.long))
        with self.assertRaises(ValueError): model.export({'kind':'trained'})

    def test_export_detaches_and_preserves_parameters(self):
        model = PreparationModel(self.checkpoint)
        original = deepcopy(self.checkpoint)
        exported = model.export({'kind':'trained','seed':7,'preparation_run_sha256':'0'*64,
            'step':1,'selection':'minimum-development-response-loss','development_loss':1.0,
            'data_sha256':'0'*64,'source_sha256':{'test':'0'*64}})
        Model(exported)
        exported['parameters']['token_embedding'][0][0] = 999
        self.assertEqual(self.checkpoint, original)
        self.assertNotEqual(float(model.weights['token_embedding'][0,0].detach()), 999)

    def test_projection_split_and_generation_are_unmasked(self):
        self.assertEqual({k:len(v) for k,v in self.examples.items()}, {'train':400,'development':60})
        train_groups = {e['group_id'] for e in self.examples['train']}
        self.assertTrue(train_groups.isdisjoint(e['group_id'] for e in self.examples['development']))
        for rows in self.examples.values():
            for e in rows:
                self.assertEqual(e['text'], e['context']+' '+e['question'])
                self.assertEqual(len(e['response_ids']), 3)
        model = PreparationModel(self.checkpoint)
        with torch.no_grad():
            model.weights['lm_head'].zero_()
            model.weights['lm_bias'].zero_()
            model.weights['lm_bias'][self.pad] = 1
        result = generate(model, ['the ball'], self.tokenizer, budget=4)[0]
        self.assertEqual(result['ids'], [self.pad]*4)
        self.assertFalse(result['stopped'])
        end = self.tokenizer.token_id('control','TURN_END')
        with torch.no_grad(): model.weights['lm_bias'][end] = 2
        self.assertEqual(generate(model, ['the ball'], self.tokenizer)[0]['ids'], [end])


if __name__ == '__main__': unittest.main()
