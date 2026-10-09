"""Block normal workflows on missing four-pillar governance."""
from scripts import ROOT
from scripts.build.generate_data_models import outputs
from scripts.check.governance.structure import load_limits, inventory, audit_structure
from scripts.check.governance.interfaces import audit_interfaces
from scripts.check.governance.evaluation import audit_evaluation


def audit(root=ROOT):
    failures = []
    try:
        generated = outputs(root)
    except (ValueError,FileNotFoundError) as exc:
        failures.append(str(exc)); generated = {}
    policy = load_limits(root)
    failures.extend(audit_structure(root, policy, generated))
    paths = inventory(root, policy)
    try: failures.extend(audit_interfaces(root, paths, generated))
    except (ValueError,FileNotFoundError) as exc: failures.append(str(exc))
    try: failures.extend(audit_evaluation(root))
    except (ValueError,FileNotFoundError) as exc: failures.append(str(exc))
    return failures


def main():
    failures = audit()
    if failures: raise SystemExit('Governance blocked:\n'+'\n'.join('- '+f for f in failures))
    print('Ontology, generated interfaces, repository limits, and evaluation admission checked.')


if __name__ == '__main__': main()
