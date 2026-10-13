"""Unmasked greedy selection shared by model execution and preparation."""
import math
from inside_inference.model import softmax


def select_greedy(logits):
    if not logits or any(not math.isfinite(x) for x in logits):
        raise ValueError('Selection requires finite vocabulary logits')
    return {'rule': 'unmasked-greedy-v1', 'raw_logits':list(logits),
            'probabilities':softmax(logits),
            'selected_id':max(range(len(logits)), key=lambda i:(logits[i],-i)),
            'decoding':'greedy; ties choose smallest ID', 'rng_state':None}
