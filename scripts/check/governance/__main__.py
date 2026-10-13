"""Block normal workflows on governance drift."""
from scripts import ROOT
from scripts.check.make_interface import check_governance_workflows
from scripts.check.governance.locks import audit_locks
from scripts.build.generate_data_models import outputs
from scripts.check.governance.structure import load_limits, inventory, audit_structure
from scripts.check.governance.interfaces import audit_interfaces
from scripts.check.governance.evaluation import audit_evaluation
from scripts.check.governance.frontend import audit_frontend
from scripts.check.governance.harness import audit_scope
from scripts.check.governance.http import audit_http


def audit(root=ROOT, *, warnings=None):
    failures = audit_locks(root)
    if failures:
        return failures
    try:
        check_governance_workflows((root/'Makefile').read_text())
    except (ValueError, FileNotFoundError) as exc:
        failures.append(str(exc))
    try:
        generated = outputs(root)
    except (ValueError,FileNotFoundError) as exc:
        failures.append(str(exc)); generated = {}
    failures.extend(audit_scope(root))
    policy = load_limits(root)
    failures.extend(audit_structure(root, policy, generated, warnings=warnings))
    paths = inventory(root, policy)
    failures.extend(audit_http(root, paths, generated))
    try: failures.extend(audit_interfaces(root, paths, generated))
    except (ValueError,FileNotFoundError) as exc: failures.append(str(exc))
    try: failures.extend(audit_frontend(root, generated))
    except (ValueError,FileNotFoundError) as exc: failures.append(str(exc))
    try: failures.extend(audit_evaluation(root))
    except (ValueError,FileNotFoundError) as exc: failures.append(str(exc))
    return failures


def main():
    warnings = []
    failures = audit(warnings=warnings)
    for warning in warnings:
        print("[inside-inference:governance] warning: " + warning)
    if failures: raise SystemExit('Governance blocked:\n'+'\n'.join('- '+f for f in failures))
    print('Ontology, generated interfaces, repository limits, approval locks, and evaluation admission checked.')


if __name__ == '__main__': main()
