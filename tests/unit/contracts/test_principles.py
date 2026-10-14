"""Counterexamples for ontology-owned first principles."""
import copy
import unittest
from scripts.build.ontology import load_declarations
from scripts.build.contracts import load_schema, admit_principles


def principle(terms, owner, identifier):
    return next(p for p in terms[owner]['principles'] if p['id'] == identifier)


class FirstPrinciplesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ontology, cls.spec = load_declarations(), load_schema()

    def failures(self, mutation):
        terms = copy.deepcopy(self.ontology['terms'])
        mutation(terms)
        return admit_principles(terms, self.spec['$defs'])

    def test_admitted_principles_cover_every_operation_and_architecture(self):
        self.assertEqual(admit_principles(self.ontology['terms'], self.spec['$defs']), [])

    def test_rejects_malformed_and_unbound_principles(self):
        def keys(t): principle(t, 'Attention', 'causal-attention')['note'] = 'extra'
        def duplicate(t): t['Attention']['principles'].append(copy.deepcopy(t['Attention']['principles'][0]))
        def field(t): principle(t, 'Normalization', 'layer-normalization')['when'] = {'precision': 'binary64'}
        def value(t): principle(t, 'Normalization', 'layer-normalization')['when'] = {'normalization': 'batchnorm'}
        def dead(t): principle(t, 'Normalization', 'layer-normalization')['when'] = {'normalization': 'pre-layernorm', 'position': 'rope'}
        def absent(t): principle(t, 'Attention', 'causal-attention')['symbols'][0]['symbol'] = r'\Omega'
        def operation(t): principle(t, 'Attention', 'causal-attention')['symbols'][0]['binds'] = ['operation:invented']
        def parameter(t): principle(t, 'Attention', 'causal-attention')['symbols'][0]['binds'] = ['parameter:invented']
        def architecture(t): principle(t, 'Attention', 'causal-attention')['symbols'][0]['binds'] = ['architecture:invented']
        def kind(t): principle(t, 'Attention', 'causal-attention')['symbols'][0]['binds'] = ['tensor:query']
        def meaning(t): principle(t, 'Attention', 'causal-attention')['symbols'][0]['meaning'] = ' '
        def equation(t): principle(t, 'Attention', 'causal-attention')['equation'] = ''
        def unbound(t):
            for p in t['FeedForward']['principles']:
                for s in p['symbols']: s['binds'] = [b for b in s['binds'] if b != 'operation:gelu']
        def borrowed(t):
            # A binding in another owner's principle does not give an operation its home.
            for p in t['FeedForward']['principles']:
                for s in p['symbols']: s['binds'] = [b for b in s['binds'] if b != 'operation:gelu']
            principle(t, 'ResidualAddition', 'residual-addition')['symbols'][0]['binds'].append('operation:gelu')
        cases = [(keys, 'exactly id, when, equation and symbols'), (duplicate, 'duplicate principle id'),
                 (field, 'not an architecture variant field'), (value, 'not declared by any architecture'),
                 (dead, 'matches no declared architecture'), (absent, 'does not appear in its equation'),
                 (operation, 'unknown operation'), (parameter, 'unknown parameter'),
                 (architecture, 'unknown architecture field'), (kind, 'binding kind'),
                 (meaning, 'symbol needs'), (equation, 'needs a LaTeX equation'),
                 (unbound, "operation 'gelu' has no first-principles binding"),
                 (borrowed, "operation 'gelu' has no first-principles binding")]
        for mutation, message in cases:
            with self.subTest(mutation=mutation.__name__):
                failures = self.failures(mutation)
                self.assertTrue(any(message in f for f in failures), failures)

    def test_each_architecture_selects_exactly_its_own_equations(self):
        def missing(t): t['Normalization']['principles'] = [p for p in t['Normalization']['principles'] if p['id'] != 'rms-normalization']
        def overlap(t): principle(t, 'Normalization', 'rms-normalization')['when'] = {}
        def unconditional(t): t['FeedForward']['principles'][0]['when'] = {}
        for mutation, message in [(missing, "LlamaArchitecture: no applicable Normalization principle"),
                                  (overlap, 'bound by several applicable Normalization principles'),
                                  (unconditional, 'bound by several applicable FeedForward principles')]:
            with self.subTest(mutation=mutation.__name__):
                failures = self.failures(mutation)
                self.assertTrue(any(message in f for f in failures), failures)

    def test_admission_blocks_generation(self):
        from scripts.build.generate_data_models import admit
        changed = copy.deepcopy(self.ontology)
        principle(changed['terms'], 'Attention', 'causal-attention')['equation'] = ''
        with self.assertRaisesRegex(ValueError, 'needs a LaTeX equation'):
            admit(changed, copy.deepcopy(self.spec))


if __name__ == '__main__':
    unittest.main()
