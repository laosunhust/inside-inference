"""Exact evidence comparison inside a single runtime, not cross-runtime tolerance."""
from inside_inference.model import canonical


def assert_same(expected, actual, label):
    if canonical(expected) != canonical(actual):
        raise AssertionError(f'{label}: complete run differs from headless execution')
