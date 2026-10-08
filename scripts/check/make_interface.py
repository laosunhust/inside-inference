"""Render and enforce the root Makefile's public interface (stdlib only)."""
import argparse
from pathlib import Path
import re

from scripts import ROOT


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
            if line and not line[0].isspace() and not line.startswith(('#','.')) and ':' in line and '=' not in line:
                raise ValueError(f'line {number}: declare one literal workflow per rule')
            continue
        name, tail = match.groups()
        if name in rules:
            raise ValueError(f'{name}: duplicate workflow definition')
        rules[name] = number
        description = tail.partition('##')[2].strip()
        if name.startswith('_'):
            if description:
                raise ValueError(f'{name}: internal workflows cannot have public help')
        elif not description:
            raise ValueError(f'{name}: public workflows need ## help; prefix uncommon ones with _')
        else:
            public[name] = description
    if set(rules) != phony:
        raise ValueError(f'Workflow/.PHONY mismatch: {sorted(set(rules) ^ phony)}')
    return public


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
        print('Makefile visibility checked.')


if __name__ == '__main__':
    main()
