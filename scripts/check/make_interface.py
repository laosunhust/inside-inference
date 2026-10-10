"""Render and enforce the root Makefile's public interface (stdlib only)."""
import argparse
from pathlib import Path
import re

from scripts import ROOT

# Approval-locked public surface. Makefile owns recipes and help descriptions.
PUBLIC_TARGETS = frozenset({'setup', 'serve-intro', 'test', 'test-integration'})


def inventory(text):
    """Public command = named phony rule with help; internal command = _ prefix."""
    rules, phony, public = {}, set(), {}
    for number, line in enumerate(text.splitlines(), 1):
        if line.startswith('.PHONY:'):
            names = line.split(':', 1)[1].split('#', 1)[0].split()
            if any(not re.fullmatch(r'_?[a-z][a-z0-9-]*', name) for name in names):
                raise ValueError(f'line {number}: use literal workflow names in .PHONY')
            phony.update(names)
            continue
        match = re.match(r'^(_?[a-z][a-z0-9-]*):(.*)$', line)
        if not match:
            if line and not line[0].isspace() and not line.startswith('#') and ':' in line and '=' not in line:
                raise ValueError(f'line {number}: declare one literal workflow per rule')
            continue
        name, tail = match.groups()
        if name in rules:
            raise ValueError(f'{name}: duplicate workflow definition')
        rules[name] = number
        description = tail.partition('##')[2].strip()
        if name == 'help':
            if description:
                raise ValueError('help: discovery command must not list itself')
        elif name.startswith('_'):
            if description:
                raise ValueError(f'{name}: internal workflows cannot have public help')
        elif not description:
            raise ValueError(f'{name}: public workflows need ## help; prefix uncommon ones with _')
        else:
            public[name] = description
    if set(rules) != phony:
        raise ValueError(f'Workflow/.PHONY mismatch: {sorted(set(rules) ^ phony)}')
    if set(public) != PUBLIC_TARGETS or 'help' not in rules:
        raise ValueError(f'Public workflows are approval-locked: expected {sorted(PUBLIC_TARGETS)} plus unlisted help; use _ for internal targets')
    return public


def check_governance_workflows(text):
    """Require literal workflow paths to governance, without locking the Makefile."""
    inventory(text)
    rules, recipes, active = {}, {}, None
    for line in text.splitlines():
        match = re.match(r'^(_?[a-z][a-z0-9-]*):(.*)$', line)
        if match:
            active, tail = match.groups()
            rules[active] = tail.split('#', 1)[0].split()
            recipes[active] = []
        elif line.startswith('\t') and active:
            recipes[active].append(line.strip())
        elif line.strip() and not line.startswith('#'):
            active = None
    if recipes.get('_governance-check') != ['@$(PYTHON) -m scripts.check.governance']:
        raise ValueError('Governance workflow must invoke the canonical checker')
    for public in ('test', 'test-integration'):
        if rules.get(public) != [] or recipes.get(public) != [f'@$(PYTHON) -m scripts.check.governance.budget {public}']:
            raise ValueError(f'{public}: retain the complete workflow wall-time gate')
    if recipes.get('_test') != ['@$(PYTHON) -m scripts.check.governance.harness']:
        raise ValueError('test: invoke the scoped unit harness')
    if not any('scripts.check.browser_check --integration-tests' in recipe
               for recipe in recipes.get('_test-integration', [])):
        raise ValueError('test-integration: retain integrated build, transport and browser coverage')
    if rules.get('_test-integration') != ['_check', '_test']:
        raise ValueError('test-integration: retain checks and the unit harness exactly once')
    def reaches_gate(name, seen):
        if name == '_governance-check': return True
        if name in seen: return False
        return any(reaches_gate(dep, seen | {name}) for dep in rules.get(name, []))
    for name in ('_check', '_test', '_test-integration', '_intro-page', 'serve-intro'):
        if not reaches_gate(name, set()):
            raise ValueError(f'{name}: workflow must depend on _governance-check')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--help-targets', action='store_true')
    mode.add_argument('--check', action='store_true')
    args = parser.parse_args()
    public = inventory((ROOT / 'Makefile').read_text())
    if args.help_targets:
        width = max(map(len, public))
        for name, description in public.items():
            print(f'  {name:<{width}}  {description}')
    else:
        check_governance_workflows((ROOT / 'Makefile').read_text())
        print('Makefile visibility and governance dependencies checked.')


if __name__ == '__main__':
    main()
