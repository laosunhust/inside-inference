"""Freeze unused semantic scenarios without redistributing existing corpus splits."""
from collections import defaultdict
from pathlib import Path
import json
from inside_inference.corpus import (load_recipe, build_cases, scenarios, digest,
    answer_from_events, render, acceptable_answers)

PROBES = [
    ('ann has the cup. ben has the book. who has the book?', 'ben'),
    ('ann has the cup. ben has the book. who has the cup?', 'ann'),
    ('ben has the book. ann has the cup. who has the book?', 'ben'),
    ('ann has the book. ben has the cup. who has the book?', 'ann'),
    ('ben has the book. who has the book?', 'ben'),
]


def freeze():
    recipe = load_recipe()
    existing = build_cases(recipe)
    excluded_groups = {c['group_id'] for c in existing}
    excluded_prompts = {' '.join(t['text'] for t in c['turns'] if t['role']=='user') for c in existing}
    excluded_prompts.update(p for p, _ in PROBES)
    # Exclude the complete semantic group if either rendering is a known probe.
    groups = defaultdict(list)
    for scenario in scenarios(recipe):
        group = digest(scenario)
        texts = [' '.join(t.text for t in render(scenario, v, recipe) if t.role=='user') for v in (0,1)]
        if group in excluded_groups or any(t in excluded_prompts for t in texts):
            continue
        label = answer_from_events(scenario['events'], scenario['query'])
        groups[scenario['family'], label].append(scenario)
    result=[]
    for index, ((family, label), candidates) in enumerate(sorted(groups.items())):
        count=2 if family=='negation' else 5
        candidates.sort(key=lambda s:digest({'seed':'capacity-spike-v1','scenario':s}))
        if len(candidates)<count: raise ValueError(f'Insufficient fresh {family}/{label} scenarios')
        for i, s in enumerate(candidates[:count]):
            variant=(index+i)%2; group=digest(s)
            result.append(dict(id=f'{family}-{group[:16]}-v{variant}', group_id=group,
                family=family, split='spike', variant=variant, scenario=s, answer=label,
                turns=[dict(role=t.role,text=t.text) for t in render(s,variant,recipe)],
                acceptable_answers=acceptable_answers(s,recipe),provenance='deterministic-template-v1'))
    assert len(result)==85 and len({c['group_id'] for c in result})==85
    return result


if __name__=='__main__':
    path=Path('data/preparation/model-family/cases.json')
    if path.exists(): raise SystemExit('Frozen cases already exist; do not overwrite')
    path.write_text(json.dumps(freeze(),indent=2)+'\n')
    print(f'Frozen 85 cases in {path}')
