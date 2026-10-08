"""One-request teaching model; see docs/labs/request-playground.md."""
from itertools import product

INPUT = 8
PREFIX = 6
OUTPUT = 4
CAPACITY = 16
INGRESS = 0.5
SETUP = 0.5
MEMORY_STEP = 1


def simulate(reuse=False, compute=2, bandwidth=3):
    if compute <= 0 or bandwidth <= 0:
        raise ValueError('Rates must be positive')
    required = INPUT + OUTPUT
    if required > CAPACITY:
        raise ValueError('Request exceeds worker capacity')
    events = []
    cursor = 0.
    state = dict(ready=0, reserved=0, emitted=0)

    def event(kind, duration, rule, explanation, **changes):
        nonlocal cursor, state
        before = state.copy()
        state = {**state, **changes}
        end = cursor + duration
        events.append(dict(id=f'e{len(events)+1}', kind=kind, start=cursor, end=end,
                           duration=duration, rule=rule, explanation=explanation,
                           before=before, after=state.copy(),
                           depends_on=events[-1]['id'] if events else None))
        cursor = end

    event('ingress', INGRESS, f'fixed delivery delay = {INGRESS} ticks',
          'The pre-tokenized request arrives. Reserve enough active state for this bounded run.', reserved=required)
    if reuse:
        event('transfer', SETUP + PREFIX / bandwidth,
              f'{SETUP} setup + {PREFIX} state units / {bandwidth} units per tick',
              'Copy an assumed-compatible, already-warm prefix. The worker cannot use it until the copy completes.', ready=PREFIX)
    uncached = INPUT - (PREFIX if reuse else 0)
    event('prefill', uncached / compute, f'{uncached} input work units / {compute} work units per tick',
          'Process the uncached input. This aggregate phase makes its state ready at completion, not gradually.', ready=INPUT)
    for token in range(1, OUTPUT+1):
        event('decode', max(1 / compute, MEMORY_STEP),
              f'max(1 work unit / {compute} work units per tick, {MEMORY_STEP} memory-service tick)',
              f'Complete output step {token}. One abstract state unit becomes ready and one output marker is delivered. This is not a computed language token.',
              ready=INPUT+token, emitted=token)
    event('release', 0, 'immediate release after final output',
          'Free the request’s worker reservation and active state; retain delivered output and any remote prefix.', ready=0, reserved=0)
    tokens = [e['end'] for e in events if e['kind']=='decode']
    return dict(model='single-request-v2', reuse=reuse, compute=compute, bandwidth=bandwidth,
                events=events, end=cursor, first_token=tokens[0],
                input_tokens=INPUT, prefix_tokens=PREFIX, output_tokens=OUTPUT,
                worker_capacity=CAPACITY, remote_state=PREFIX if reuse else 0,
                assumptions=dict(ingress=INGRESS, transfer_setup=SETUP, memory_step=MEMORY_STEP,
                                 initial_prefix='warm and compatible by assumption',
                                 state_units='one abstract unit per input/output step',
                                 delivery='output delivery is immediate; return network not modeled'))


def scenarios():
    return {f'{int(reuse)}-{compute}-{bandwidth}': simulate(reuse, compute, bandwidth)
            for reuse, compute, bandwidth in product((False, True), (1, 2, 4), (0.5, 3, 12))}
