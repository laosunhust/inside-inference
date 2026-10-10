import unittest
from inside_inference.labs.kda import demo, step


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
