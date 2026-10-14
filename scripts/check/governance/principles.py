"""Bind each ontology principle to exactly one marked span of packaged engine code.

Markers are ``# principle <id>`` and ``# end principle <id>`` on their own lines in
inside_inference sources. scripts/build/contracts.py parses them and the build
publishes the spans; this check admits their structure and coverage. Whether the
code computes the equation needs review and recomputation evidence.
"""
from scripts.build.contracts import scan_principle_spans


def audit_principle_spans(root, terms):
    spans, failures = scan_principle_spans(root)
    declared = {p['id'] for term in terms.values() for p in term.get('principles', [])}
    for identifier in sorted(set(spans) - declared):
        failures.append(f"{spans[identifier]['path']}:{spans[identifier]['start'] - 1}: unknown principle {identifier!r}; declare it in docs/ontology first")
    for identifier in sorted(declared - set(spans)):
        failures.append(f'principle {identifier!r} has no code span; mark its executed code with "# principle {identifier}"')
    return failures
