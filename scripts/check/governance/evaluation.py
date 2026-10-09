"""Admission for declared work evaluations; content presence is not scientific validity."""
from scripts.build.structured import read_yaml


def audit_evaluation(root):
    record = read_yaml(root/'governance/evaluations.yaml')
    fields = {'version','work_item','question','necessity','baseline','reuse','criteria','counterexamples','checks'}
    if not isinstance(record,dict) or set(record) != fields or record['version'] != 1:
        raise ValueError('Evaluation requires question, necessity, baseline, reuse, criteria, counterexamples, and checks')
    for name in ('work_item','question','necessity','baseline'):
        if not isinstance(record[name],str) or not record[name].strip(): raise ValueError(f'Evaluation missing {name}')
    for name in ('criteria','counterexamples','checks'):
        if not isinstance(record[name],list) or not record[name] or not all(isinstance(v,str) and v.strip() for v in record[name]):
            raise ValueError(f'Evaluation missing {name}')
    if not isinstance(record['reuse'],list) or not record['reuse']:
        raise ValueError('Evaluation requires a reuse assessment')
    for item in record['reuse']:
        if not isinstance(item,dict) or set(item) != {'source','decision'} or not all(isinstance(v,str) and v.strip() for v in item.values()):
            raise ValueError('Reuse assessment needs source and decision')
    return []
