"""Small recurrence demonstrator; not a Kimi model or performance implementation."""


def step(state, key, value, query, alpha, beta):
    """Equation (1), S shaped [key channel, value channel], expanded for tracing."""
    rows, cols = len(key), len(value)
    if (not rows or not cols or len(state) != rows
            or any(len(row) != cols for row in state)
            or len(query) != rows or len(alpha) != rows):
        raise ValueError("Incompatible recurrence dimensions")
    decayed = [[alpha[i] * state[i][j] for j in range(cols)] for i in range(rows)]
    prediction = [sum(key[i] * decayed[i][j] for i in range(rows)) for j in range(cols)]
    error = [value[j] - prediction[j] for j in range(cols)]
    delta = [[beta * key[i] * error[j] for j in range(cols)] for i in range(rows)]
    after = [[decayed[i][j] + delta[i][j] for j in range(cols)] for i in range(rows)]
    output = [sum(query[i] * after[i][j] for i in range(rows)) for j in range(cols)]
    return dict(before=state, key=key, value=value, query=query, alpha=alpha,
                beta=beta, decayed=decayed, prediction=prediction,
                error=error, delta=delta, after=after, output=output)


def demo():
    """Controlled gate ablation; identical hand-selected inputs, no training."""
    scenarios = {}
    for label, gate in (("Channel-wise decay", [0.5, 1.0]),
                        ("Uniform decay", [0.5, 0.5]), ("No decay", [1.0, 1.0])):
        state = [[0.0, 0.0], [0.0, 0.0]]
        trace = []
        for key, value, query in [([1., 0.], [1., 0.], [1., 0.]),
                                  ([0., 1.], [0., 1.], [1., 0.]),
                                  ([0.6, 0.8], [1., 1.], [0., 1.]),
                                  ([1., 0.], [0., 1.], [1., 0.])]:
            event = step(state, key, value, query, gate, 0.75)
            trace.append(event)
            state = event['after']
        scenarios[label] = trace
    return scenarios
