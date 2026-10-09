"""Deterministic, grouped task corpus. These are bounded synthetic tasks, not chat data."""

from collections import Counter, defaultdict
import hashlib
from itertools import permutations
import json
from pathlib import Path
import re

from inside_inference.tokenizer import Tokenizer, Turn


RECIPE = Path(__file__).resolve().parents[1] / 'data/corpus/recipe.json'
DIALOGUES = RECIPE.with_name('dialogues.json')
FAMILIES = ('location', 'ownership', 'negation', 'correction')


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def digest(value):
    return hashlib.sha256(canonical(value).encode('utf-8')).hexdigest()


def load_recipe(path=RECIPE):
    recipe = json.loads(Path(path).read_text(encoding='utf-8'))
    expected = {'version', 'seed', 'objects', 'people', 'locations', 'groups_per_label',
                'surface_policy', 'context_budget_for_audit'}
    if (not isinstance(recipe, dict) or set(recipe) != expected
            or type(recipe['version']) is not int or recipe['version'] != 1):
        raise ValueError('Unsupported corpus recipe')
    if not isinstance(recipe['seed'], str) or not recipe['seed']:
        raise ValueError('Recipe seed must be nonempty text')
    for name in ('objects', 'people'):
        values = recipe[name]
        if (not isinstance(values, list) or len(values) < 2
                or any(not isinstance(v, str) or not v for v in values)
                or len(values) != len(set(values))):
            raise ValueError(f'Invalid {name} inventory')
    if (not isinstance(recipe['locations'], dict) or len(recipe['locations']) < 3
            or any(not isinstance(k, str) or not k or v not in ('in', 'on')
                   for k, v in recipe['locations'].items())):
        raise ValueError('Invalid locations/prepositions')
    splits = {'train', 'development', 'test'}
    if (set(recipe['groups_per_label']) != splits or set(recipe['surface_policy']) != splits):
        raise ValueError('Expected train/development/test split configuration')
    for split in splits:
        count, policy = recipe['groups_per_label'][split], recipe['surface_policy'][split]
        if type(count) is not int or count <= 0:
            raise ValueError('Group counts must be positive integers')
        if policy not in ('both', 'alternate'):
            raise ValueError('Unsupported surface policy')
    if type(recipe['context_budget_for_audit']) is not int or recipe['context_budget_for_audit'] <= 0:
        raise ValueError('Context audit budget must be a positive integer')
    return recipe


def _event(kind, subject, value, **extra):
    return dict(kind=kind, subject=subject, value=value, **extra)


def answer_from_events(events, query):
    """Last explicit assignment for the queried relation; no physical containment inference."""
    state = {}
    for event in events:
        kind = event['kind']
        if kind not in ('location', 'owner', 'preference'):
            raise ValueError(f'Unknown relation: {kind}')
        expected = {'kind', 'subject', 'value'} | ({'rejected'} if kind == 'preference' else set())
        if set(event) != expected or any(not isinstance(v, str) or not v for v in event.values()):
            raise ValueError('Malformed assignment event')
        if kind == 'preference' and event['value'] == event['rejected']:
            raise ValueError('Preference cannot choose and reject the same object')
        state[kind, event['subject']] = event['value']
    if set(query) != {'kind', 'subject'}:
        raise ValueError('Malformed query')
    try:
        return state[query['kind'], query['subject']]
    except KeyError as exc:
        raise ValueError('Query has no stated answer') from exc


def _scenario(family, events, subject):
    kind = {'location': 'location', 'ownership': 'owner',
            'negation': 'preference', 'correction': 'location'}[family]
    # Events retain order because later corrections are meaningful.
    return {'family': family, 'events': events, 'query': {'kind': kind, 'subject': subject}}


def scenarios(recipe):
    objects, people = recipe['objects'], recipe['people']
    locations = tuple(recipe['locations'])
    for subject, other in permutations(objects, 2):
        for answer, alternate in permutations(locations, 2):
            yield _scenario('location', [_event('location', subject, answer),
                                         _event('location', other, alternate)], subject)
            for distractor in locations:
                if distractor in (answer, alternate):
                    continue
                yield _scenario('correction', [_event('location', subject, alternate),
                                               _event('location', other, distractor),
                                               _event('location', subject, answer)], subject)
        for answer, alternate in permutations(people, 2):
            yield _scenario('ownership', [_event('owner', subject, answer),
                                          _event('owner', other, alternate)], subject)
    for person in people:
        for chosen, rejected in permutations(objects, 2):
            yield _scenario('negation', [_event('preference', person, chosen, rejected=rejected)], person)


def _statement(event, locations):
    kind, subject, value = event['kind'], event['subject'], event['value']
    if kind == 'location':
        return f'the {subject} is {locations[value]} the {value}.'
    if kind == 'owner':
        return f'{value} has the {subject}.'
    raise ValueError('No generic statement for this relation')


def render(scenario, variant, recipe):
    if type(variant) is not int or variant not in (0, 1):
        raise ValueError('Unsupported surface variant')
    family, events = scenario['family'], scenario['events']
    subject = scenario['query']['subject']
    answer = answer_from_events(events, scenario['query'])
    if family in ('location', 'ownership'):
        ordered = events if variant == 0 else list(reversed(events))
        facts = ' '.join(_statement(e, recipe['locations']) for e in ordered)
        question = f'where is the {subject}?' if family == 'location' else f'who has the {subject}?'
        turns = [Turn(role='user', text=facts), Turn(role='assistant', text='okay.'), Turn(role='user', text=question)]
    elif family == 'negation':
        event = events[0]
        chosen, rejected = event['value'], event['rejected']
        if variant == 0:
            facts = f'{subject} would like the {chosen}, not the {rejected}.'
        else:
            facts = f'{subject} does not want the {rejected}. {subject} would like the {chosen}.'
        turns = [Turn(role='user', text=facts), Turn(role='assistant', text='okay.'),
                 Turn(role='user', text=f'what does {subject} want?')]
    elif family == 'correction':
        original, distractor, correction = events
        if variant == 0:
            first = ' '.join(_statement(e, recipe['locations']) for e in (original, distractor))
            last = 'now ' + _statement(correction, recipe['locations'])
        else:
            first = _statement(original, recipe['locations'])
            last = 'now ' + _statement(correction, recipe['locations']) + ' ' + _statement(distractor, recipe['locations'])
        turns = [Turn(role='user', text=first), Turn(role='assistant', text='okay.'),
                 Turn(role='user', text=last + f' where is the {subject} now?')]
    else:
        raise ValueError(f'Unknown task family: {family}')
    turns.append(Turn(role='assistant', text=answer + '.'))
    return turns


def acceptable_answers(scenario, recipe):
    answer = answer_from_events(scenario['events'], scenario['query'])
    subject, family = scenario['query']['subject'], scenario['family']
    forms = [answer, answer + '.']
    if family in ('location', 'correction'):
        phrase = f"{recipe['locations'][answer]} the {answer}."
        forms.extend([phrase, 'it is ' + phrase, f'the {subject} is ' + phrase])
    elif family == 'ownership':
        forms.extend([f'{answer} has the {subject}.', f'the {subject} belongs to {answer}.'])
    else:
        forms.extend([f'the {answer}.', f'{subject} would like the {answer}.'])
    return forms


def score_response(case, response):
    """Exact predeclared forms, allowing outer ASCII whitespace only; no substring scoring."""
    if not isinstance(response, str):
        raise TypeError('Response must be text')
    return response.strip(' \t\r\n') in case['acceptable_answers']


def position_guess(case, recipe, policy):
    """Deliberately ignores relationships and negation; diagnostic, not a learned model."""
    if policy not in ('first', 'last'):
        raise ValueError('Expected first or last mention policy')
    family = case['family']
    labels = (recipe['people'] if family == 'ownership' else recipe['objects']
              if family == 'negation' else list(recipe['locations']))
    words = re.findall('[a-z]+', ' '.join(t['text'] for t in case['turns'] if t['role'] == 'user'))
    mentioned = [word for word in words if word in labels]
    if not mentioned:
        raise ValueError('No candidate answer mentioned in prompt')
    return mentioned[0 if policy == 'first' else -1]


def shortcut_baselines(cases, recipe):
    """Choose first/last policies using development only, then report test results."""
    result = {}
    for family in FAMILIES:
        development = [c for c in cases if c['family'] == family and c['split'] == 'development']
        tests = [c for c in cases if c['family'] == family and c['split'] == 'test']
        development_scores = {policy: sum(position_guess(c, recipe, policy) == c['answer']
                                          for c in development) for policy in ('first', 'last')}
        selected = min(development_scores, key=lambda policy: (-development_scores[policy], policy))
        result[family] = {
            'development_scores': development_scores, 'selected_on_development': selected,
            'test_correct': sum(position_guess(c, recipe, selected) == c['answer'] for c in tests),
            'test_total': len(tests),
        }
    return result


def build_cases(recipe):
    by_label = defaultdict(list)
    for scenario in scenarios(recipe):
        answer = answer_from_events(scenario['events'], scenario['query'])
        by_label[scenario['family'], answer].append(scenario)
    cases = []
    needed = sum(recipe['groups_per_label'].values())
    label_indices = {key: index for index, key in enumerate(sorted(by_label))}
    for (family, answer), candidates in sorted(by_label.items()):
        ranked = sorted(candidates, key=lambda s: digest({'seed': recipe['seed'], 'scenario': s}))
        if len(ranked) < needed:
            raise ValueError(f'Not enough distinct scenarios for {family}/{answer}')
        cursor = 0
        for split in ('train', 'development', 'test'):
            count = recipe['groups_per_label'][split]
            selected = ranked[cursor:cursor + count]
            cursor += count
            for index, scenario in enumerate(selected):
                group = digest(scenario)
                variants = (0, 1) if recipe['surface_policy'][split] == 'both' else (
                    (index + label_indices[family, answer]) % 2,)
                for variant in variants:
                    turns = render(scenario, variant, recipe)
                    cases.append({
                        'id': f'{family}-{group[:16]}-v{variant}', 'group_id': group,
                        'split': split, 'family': family, 'variant': variant,
                        'scenario': scenario, 'answer': answer,
                        'turns': [dict(role=t.role, text=t.text) for t in turns],
                        'acceptable_answers': acceptable_answers(scenario, recipe),
                        'provenance': 'deterministic-template-v1',
                    })
    return cases


def audit_cases(cases, codec, recipe):
    ids, groups, prompts = set(), {}, {}
    splits = defaultdict(lambda: {'cases': 0, 'families': Counter(), 'answers': defaultdict(Counter),
                                  'complete_tokens': [], 'prompt_tokens': [], 'fallback_spans': 0,
                                  'over_context_budget': [], 'word_occurrences': Counter()})
    for case in cases:
        required = {'id', 'group_id', 'split', 'family', 'variant', 'scenario', 'answer',
                    'turns', 'acceptable_answers', 'provenance'}
        if not isinstance(case, dict) or set(case) != required:
            raise ValueError('Invalid case fields')
        scenario = case['scenario']
        if (not isinstance(scenario, dict) or set(scenario) != {'family', 'events', 'query'}
                or case['family'] not in FAMILIES or scenario['family'] != case['family']
                or case['group_id'] != digest(scenario)
                or case['id'] != f"{case['family']}-{case['group_id'][:16]}-v{case['variant']}"):
            raise ValueError('Case identity does not match its scenario')
        if case['split'] not in recipe['groups_per_label']:
            raise ValueError('Unknown split')
        reference_turns = [dict(role=t.role, text=t.text)
                           for t in render(scenario, case['variant'], recipe)]
        if (case['answer'] != answer_from_events(scenario['events'], scenario['query'])
                or case['acceptable_answers'] != acceptable_answers(scenario, recipe)
                or case['turns'] != reference_turns):
            raise ValueError('Case content or answer does not match the declared scenario')
        if case['id'] in ids:
            raise ValueError('Duplicate case ID')
        ids.add(case['id'])
        split = case['split']
        prior = groups.setdefault(case['group_id'], split)
        if prior != split:
            raise ValueError('Semantic scenario crosses splits')
        turns = tuple(Turn(**turn) for turn in case['turns'])
        prompt_key = canonical(case['turns'][:-1])
        if prompt_key in prompts:
            raise ValueError('Duplicate prompt, including within split')
        prompts[prompt_key] = split
        if not score_response(case, turns[-1].text):
            raise ValueError('Rendered answer is not accepted by declared scorer')
        full, prompt = codec.encode_dialogue(turns), codec.encode_prompt(turns[:-1])
        if codec.decode_dialogue(full.ids) != turns:
            raise ValueError('Framed corpus round trip failed')
        stats = splits[split]
        stats['cases'] += 1
        stats['families'][case['family']] += 1
        stats['answers'][case['family']][case['answer']] += 1
        stats['complete_tokens'].append(len(full.ids))
        stats['prompt_tokens'].append(len(prompt.ids))
        stats['fallback_spans'] += sum(s.kind == 'fallback' for s in full.spans)
        for i in full.ids:
            token = codec.tokens[i]
            if token.kind == 'word':
                stats['word_occurrences'][token.piece] += 1
        if len(full.ids) > recipe['context_budget_for_audit']:
            stats['over_context_budget'].append(case['id'])
    return json.loads(canonical(dict(splits)))


def audit_dialogues(codec, path=DIALOGUES):
    """Coverage probes authored after manifest selection; never silently added to training."""
    records = json.loads(Path(path).read_text(encoding='utf-8'))
    report = []
    seen = set()
    for row in records:
        if set(row) != {'id', 'turns'} or row['id'] in seen:
            raise ValueError('Invalid or duplicate dialogue probe')
        seen.add(row['id'])
        turns = tuple(Turn(role='user' if i % 2 == 0 else 'assistant', text=text)
                      for i, text in enumerate(row['turns']))
        encoded = codec.encode_dialogue(turns)
        fallback = [dict(turn=s.turn, text=bytes(s.raw_bytes).decode('utf-8'), reason=s.reason,
                         token_count=s.token_end - s.token_start)
                    for s in encoded.spans if s.kind == 'fallback']
        report.append({'id': row['id'], 'tokens': len(encoded.ids), 'fallback': fallback,
                       'utterances': len(turns),
                       'direct_utterances': len(turns) - len({f['turn'] for f in fallback})})
    return report
