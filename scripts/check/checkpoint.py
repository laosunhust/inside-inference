"""Verify exported preparation weights against actual reference inference."""
import argparse
import json
from pathlib import Path
import math
import torch

from scripts import ROOT
from inside_inference.contract_runtime import decode_json
from inside_inference.corpus import build_cases, load_recipe, position_guess
from inside_inference.generation import select_greedy
from inside_inference.model import Model, canonical, identity
from inside_inference.preparation import PreparationModel, prepare_examples, evaluate, generate, readability_report
from inside_inference.tokenizer import Tokenizer


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--checkpoint', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--config', type=Path, help='Preparation config for target selection and generation allowance')
    parser.add_argument('--baseline-checkpoint', type=Path, help='Retained checkpoint to score under the same evaluation protocol')
    args = parser.parse_args()
    config = json.loads(args.config.read_text()) if args.config else {}
    budget = config.get('evaluation_budget', 8)
    output = args.output.resolve()
    if not output.is_relative_to((ROOT/'out/experiments').resolve()):
        parser.error('Verification evidence must stay under out/experiments')
    output.mkdir(parents=True,exist_ok=True)
    (output/'result.json').write_bytes(canonical({'passed':False,'status':'running'}))
    checkpoint = decode_json(args.checkpoint.read_text())
    reference, prepared, codec = Model(checkpoint), PreparationModel(checkpoint), Tokenizer()
    torch.set_num_threads(1)
    torch.use_deterministic_algorithms(True)
    examples = prepare_examples(config.get('target_policy', 'original'), budget)
    development = evaluate(prepared,examples['development'],codec,budget)
    # Diagnostic only: no training decisions or new acceptance criteria follow.
    training = evaluate(prepared,examples['train'],codec,budget)
    # The fixed provisional gate is defined only for the 60-case development set.
    training.pop('provisional_pass')
    if 'readability_criteria' in config:
        development = readability_report(development,examples['development'],codec,config['readability_criteria'])
    if args.baseline_checkpoint:
        baseline_checkpoint = decode_json(args.baseline_checkpoint.read_text())
        baseline = evaluate(PreparationModel(baseline_checkpoint), examples['development'], codec, budget)
        if 'readability_criteria' in config:
            baseline = readability_report(baseline,examples['development'],codec,config['readability_criteria'])
        baseline['checkpoint_sha256'] = identity(baseline_checkpoint)
        baseline['comparison'] = 'Same current targets/budget; do not compare loss to historical pilot loss.'
        (output/'baseline-development.json').write_bytes(canonical(baseline))
    (output/'development.json').write_bytes(canonical(development))
    (output/'training-diagnostic.json').write_bytes(canonical(training))
    largest_error, checked_values = 0.0, 0
    for example, observation in zip(examples['development'],development['records']):
        prefix = example['prompt_ids'][:]
        for selected in observation['full']['ids']:
            expected = reference.forward(prefix,capture=False)['logits']
            with torch.no_grad(): actual = prepared(torch.tensor([prefix]))[0].tolist()
            for e_row,a_row in zip(expected,actual):
                for e,a in zip(e_row,a_row):
                    error = abs(e-a)
                    largest_error = max(largest_error,error)
                    checked_values += 1
                    if not math.isclose(e,a,rel_tol=1e-9,abs_tol=1e-10):
                        raise AssertionError(f'Forward divergence: {example["id"]}: {e}, {a}')
            if select_greedy(expected[-1])['selected_id'] != selected:
                ordered=sorted(expected[-1],reverse=True)
                margin=ordered[0]-ordered[1]
                tolerance=1e-10+1e-9*max(abs(v) for v in expected[-1])
                disagreement=dict(case_id=example['id'],prefix_ids=prefix,prepared_selected=selected,
                    reference_selected=select_greedy(expected[-1])['selected_id'],logit_margin=margin,
                    near_tie=margin<=2*tolerance,numerical_tolerance=tolerance)
                (output/'selection-disagreement.json').write_bytes(canonical(disagreement))
                raise AssertionError('Prepared selection differs; near_tie='+str(disagreement['near_tie']))
            prefix.append(selected)
    contrast = json.loads((ROOT/'data/corpus/contrast-pairs.json').read_text())
    contrast_results = []
    for pair in contrast:
        results = generate(prepared,[c['context']+' '+c['question'] for c in pair['cases']],codec,budget)
        contrast_results.append({'id':pair['id'],'status':'post-pilot diagnostic; bare-answer match only, not multi-word correctness; no tuning',
            'cases':[dict(case,generated=result,bare_answer_match=result['text'] in (case['answer'],case['answer']+'.'))
                     for case,result in zip(pair['cases'],results)]})
    (output/'contrast-diagnostic.json').write_bytes(canonical(contrast_results))
    recipe=load_recipe()
    cases=[c for c in build_cases(recipe) if c['split']=='development']
    shortcuts={family:{policy:sum(position_guess(c,recipe,policy)==c['answer'] for c in cases if c['family']==family)
                       for policy in ('first','last')}
               for family in sorted({c['family'] for c in cases})}
    (output/'result.json').write_bytes(canonical({'passed':True,
        'checkpoint_sha256':identity(checkpoint),'development_cases':len(examples['development']),
        'compared_logit_values':checked_values,'max_absolute_logit_error':largest_error,
        'development_shortcut_diagnostic':shortcuts,'test_split_evaluated':False,
        'learned_behavior_passed':development.get('provisional_pass', development.get('readability_pass',False) and development.get('task_pass',False)),
        'scope':'numerical export, raw argmax, all development continuations'}))
    print((output/'result.json').read_text())


if __name__ == '__main__': main()
