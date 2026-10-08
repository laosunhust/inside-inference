"""Independent integration oracle: raw logits, full vocabulary, and two stop conditions."""
import math
from inside_inference.model import Model


def assert_unrestricted_generation(record):
    for trace in record['traces']:
        model=Model(trace['checkpoint'])
        budget=trace['declaration']['request']['generation']['max_new_tokens']
        terminal=next(t['id'] for t in trace['vocabulary'] if t['kind']=='control' and t['piece']=='TURN_END')
        prefix=list(trace['tokenizer']['ids'])
        selected=[]
        for step in trace['passes']:
            if len(selected)>=budget or terminal in selected:
                raise AssertionError('Computation continued after the declared stop condition')
            assert step['input_ids']==prefix, 'Continuation changed the selected token sequence'
            # Recompute directly from the exported weights and actual prefix, bypassing
            # the generation loop, its selector, and its selection trace.
            logits=model.forward(prefix,capture=False)['logits'][-1]
            assert len(logits)==384
            observed=next(n['values'][-1] for n in step['nodes'] if n['name']=='logits')
            assert observed==logits, 'Recorded model logits differ from checkpoint computation'
            assert step['selection']['raw_logits']==logits, 'Selection modified the model logits'
            expected=sorted(range(384),key=lambda i:(-logits[i],i))[0]
            assert step['selection']['selected_id']==expected, 'Selection applied an uninvited rule'
            scores=[math.exp(x-max(logits)) for x in logits]
            probabilities=step['selection']['probabilities']
            assert len(probabilities)==384
            assert all(math.isclose(p,s/sum(scores),rel_tol=1e-12,abs_tol=1e-15)
                       for p,s in zip(probabilities,scores)), 'Probabilities were masked or transformed'
            selected.append(expected);prefix.append(expected)
        assert selected==trace['output_ids']
        assert selected, 'An admitted run must execute a prediction'
        if selected[-1]==terminal:
            assert trace['outcome']['stop_reason']=='turn_end'
        else:
            assert len(selected)==budget, 'Generation stopped without TURN_END or exhausting the budget'
            assert trace['outcome']['stop_reason']=='output_budget'
        assert trace['outcome']['unused_budget']==budget-len(selected)
