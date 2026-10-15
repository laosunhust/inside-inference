"""Unmasked greedy selection shared by model execution and preparation."""
import numpy as np


def select_greedy(logits, *, arrays=False):
    values = np.asarray(logits, dtype=np.float64)
    if values.ndim != 1 or not values.size or not np.isfinite(values).all():
        raise ValueError('Selection requires finite vocabulary logits')
    probabilities = np.exp(values - values.max())
    probabilities /= probabilities.sum()
    return {'rule': 'unmasked-greedy-v1', 'raw_logits': values if arrays else values.tolist(),
            'probabilities': probabilities if arrays else probabilities.tolist(),
            'selected_id': int(values.argmax()),
            'decoding': 'greedy; ties choose smallest ID', 'rng_state': None}
