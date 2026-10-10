"""Counterexamples for each mechanical governance claim."""
import copy
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch
import hashlib
import yaml
from scripts import ROOT
from scripts.build.structured import read_yaml
from scripts.build.generate_data_models import outputs, admit
from scripts.build.ontology import load_declarations
from scripts.build.contracts import load_schema
from scripts.check.governance.structure import audit_structure, load_limits
from scripts.check.governance.interfaces import audit_source
from scripts.check.governance.evaluation import audit_evaluation


class GovernanceTests(unittest.TestCase):
    def test_validated_conversion_checks_nested_data_and_detaches_it(self):
        from inside_inference.tokenizer import Tokenizer
        from inside_inference.declarations_generated import Encoding
        original=Tokenizer().encode('cat').to_dict()
        converted=Encoding.from_dict(original)
        self.assertEqual(converted.to_dict(),original)
        original['spans'][0]['ids'][0]=383
        self.assertNotEqual(converted.spans[0].ids[0],383)
        invalid=converted.to_dict();invalid['spans'][0]['token_start']='invalid'
        with self.assertRaises(ValueError):Encoding.from_dict(invalid)

    def test_yaml_rejects_duplicate_alias_nonfinite_and_nonstring_authorities(self):
        for source in ('a: 1\na: 2\n', 'a: &x [1]\nb: *x\n', 'a: .nan\n', '1: value\n'):
            with self.subTest(source=source), tempfile.TemporaryDirectory() as directory:
                path=Path(directory)/'bad.yaml';path.write_text(source)
                with self.assertRaises(ValueError): read_yaml(path)

    def test_handwritten_and_aliased_public_types_and_routes_fail(self):
        bad = [
            'from dataclasses import dataclass as d\n@d\nclass NewResponse:\n value: int\n',
            'import typing as t\nclass NewResponse(t.TypedDict):\n value: int\n',
            'from collections import namedtuple as nt\nReply=nt("Reply", "value")',
            'class Response:\n value: str\n',
            'self.send_json(200, {"value": 1})',
            'value={"error":"bad"}\nself.send_declaration(400,value)',
            'path="/api/new-response"',
            'self.send_response(200)',
            'self.wfile.write(b"{}");',
            'if self.path == "/" + "api/new": pass',
            'from inside_inference.declarations_generated import ApiError\nclass Other(ApiError): pass',
        ]
        for source in bad:
            with self.subTest(source=source):
                self.assertTrue(audit_source(Path('scripts/dev/example.py'),source,{'ApiError'}))
        self.assertFalse(audit_source(Path('scripts/dev/example.py'),
            'from inside_inference.declarations_generated import ApiError as Error\nself.send_declaration(400,Error(error="bad"))',{'ApiError'}))
        self.assertTrue(audit_source(Path('web/example.js'),'fetch("/api/handwritten")',set()))

    def test_file_and_folder_boundaries_and_forged_generated_names(self):
        policy=load_limits(ROOT)
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            exact=root/'exact.py';exact.write_bytes(b'x'*policy['authored_file_bytes'])
            self.assertFalse(audit_structure(root,policy,{}))
            exact.write_bytes(exact.read_bytes()+b'x')
            self.assertTrue(audit_structure(root,policy,{}))
            exact.unlink()
            generated=root/'fake.generated.py';content='x'*(policy['authored_file_bytes']+1)
            generated.write_text(content)
            self.assertTrue(audit_structure(root,policy,{}))
            self.assertFalse(audit_structure(root,policy,{generated.name:content}))
            generated.write_text(content+'x')
            self.assertTrue(audit_structure(root,policy,{generated.name:content}))
            generated.unlink()
            for i in range(policy['files_per_folder']): (root/f'{i}.py').write_text('')
            self.assertFalse(audit_structure(root,policy,{}))
            (root/'untracked.py').write_text('')
            self.assertTrue(audit_structure(root,policy,{}))

    def test_folder_warnings_precede_hard_failure(self):
        policy = load_limits(ROOT)
        self.assertEqual((policy['files_per_folder_warning'], policy['files_per_folder']), (12, 18))
        for count in (11, 12, 18, 19):
            with self.subTest(count=count), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                for i in range(count): (root/f'{i}.py').write_text('')
                warnings = []
                failures = audit_structure(root, policy, {}, warnings=warnings)
                self.assertEqual(bool(failures), count > 18)
                self.assertEqual(bool(warnings), 12 <= count <= 18)
        for warning in (18, 19, 0, True):
            with tempfile.TemporaryDirectory() as directory:
                root = Path(directory); (root/'governance').mkdir()
                bad = dict(policy, files_per_folder_warning=warning)
                (root/'governance/limits.yaml').write_text(yaml.safe_dump(bad))
                with self.assertRaises(ValueError): load_limits(root)

    def test_evaluation_history_references_and_result_binding(self):
        active=read_yaml(ROOT/'governance/evaluations.yaml')['active']
        original=read_yaml(ROOT/active)
        def write(root, name, value):
            path=root/name;path.parent.mkdir(parents=True,exist_ok=True)
            path.write_text(yaml.safe_dump(value))
        criteria='governance/evaluations/records/test/first.yaml'
        result='governance/evaluations/results/test/first.yaml'
        for violation in (None, 'deleted', 'rewritten', 'rehash', 'dangling', 'bad-result',
                          'missing-evidence', 'symlink', 'cycle', 'duplicate', 'missing-criteria', 'missing-reuse', 'missing-question', 'missing-baseline', 'missing-counterexamples'):
            with self.subTest(violation=violation), tempfile.TemporaryDirectory() as directory:
                root=Path(directory)
                write(root, criteria, original)
                preserved={criteria:(root/criteria).read_bytes()}
                write(root, 'governance/evaluations.yaml', {'version':2,'active':criteria})
                (root/'evidence.md').write_text('Measured result')
                record={'version':1,'evaluation':criteria,'evaluation_sha256':hashlib.sha256(preserved[criteria]).hexdigest(),
                        'outcome':'passed','summary':'Measured','evidence':['evidence.md']}
                write(root,result,record)
                if violation=='duplicate':
                    write(root,'governance/evaluations/records/test/duplicate.yaml',original)
                if violation=='deleted': (root/criteria).unlink()
                if violation in ('rewritten','rehash'):
                    changed=copy.deepcopy(original);changed['criteria']=['Weakened']
                    write(root,criteria,changed)
                    if violation=='rehash':
                        record['evaluation_sha256']=hashlib.sha256((root/criteria).read_bytes()).hexdigest()
                        write(root,result,record)
                if violation=='dangling':
                    write(root,'governance/evaluations.yaml',{'version':2,'active':'missing.yaml'})
                if violation=='bad-result':
                    record['evaluation_sha256']='0'*64;write(root,result,record)
                if violation=='missing-evidence': (root/'evidence.md').unlink()
                if violation=='symlink':
                    (root/criteria).unlink();(root/criteria).symlink_to(root/'evidence.md')
                if violation == 'cycle' or violation in ('missing-criteria','missing-reuse','missing-question','missing-baseline','missing-counterexamples'):
                    changed=copy.deepcopy(original)
                    if violation=='cycle': changed['supersedes']=criteria
                    else: changed[violation.removeprefix('missing-')]=[]
                    write(root,criteria,changed);preserved={}
                with patch('scripts.check.governance.evaluation.committed_evaluations',return_value=preserved):
                    if violation:
                        with self.assertRaises(ValueError): audit_evaluation(root)
                    else:
                        self.assertEqual(audit_evaluation(root),[])
                        amendment=copy.deepcopy(original);amendment['supersedes']=criteria
                        write(root,'governance/evaluations/records/test/second.yaml',amendment)
                        self.assertEqual(audit_evaluation(root),[])
                        # Completed results are commitments too, not just criteria.
                        preserved[result]=(root/result).read_bytes()
                        record['outcome']='failed';write(root,result,record)
                        with self.assertRaisesRegex(ValueError,'immutable'): audit_evaluation(root)

    def test_shallow_evaluation_history_cannot_reset_preservation(self):
        from scripts.check.governance.evaluation import committed_evaluations
        with patch('scripts.check.governance.evaluation.git',return_value=b'true\n'):
            with self.assertRaisesRegex(ValueError,'non-shallow'):
                committed_evaluations(ROOT)

    def test_ignored_source_and_nested_output_names_cannot_escape_limits(self):
        policy=load_limits(ROOT)
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            (root/'inside_inference/out').mkdir(parents=True)
            (root/'.gitignore').write_text('inside_inference/out/\n')
            (root/'inside_inference/out/hidden.py').write_bytes(b'x'*(policy['authored_file_bytes']+1))
            self.assertTrue(audit_structure(root,policy,{}))

    def test_anonymous_nested_record_cannot_bypass_ontology(self):
        spec=load_schema();spec['$defs']['InferenceRequest']['properties']['text']={
            'type':'object','properties':{'hidden':{'type':'string'}},'required':['hidden'],'additionalProperties':False}
        with self.assertRaisesRegex(ValueError,'nested records'):
            admit(load_declarations(),spec)

    def test_inline_public_schema_and_renamed_exports_are_blocked(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            shutil.copytree(ROOT/'docs/ontology',root/'docs/ontology')
            shutil.copytree(ROOT/'data-model',root/'data-model')
            path=root/'data-model/openapi.yaml';original=read_yaml(path)
            spec=copy.deepcopy(original)
            spec['paths']['/api/runs']['post']['responses']['200']['content']['application/json']['schema']={
                'type':'object','properties':{'new':{'type':'string'}}}
            path.write_text(yaml.safe_dump(spec))
            with self.assertRaisesRegex(ValueError,'Inline public schemas'):outputs(root)
            spec=copy.deepcopy(original)
            spec['components']={'schemas':{'Alias':{'$ref':'./inference.schema.json#/$defs/ApiError'}}}
            path.write_text(yaml.safe_dump(spec))
            with self.assertRaisesRegex(ValueError,'canonical declaration'):outputs(root)

    def test_ontology_binding_rejects_invented_duplicate_and_missing_subjects(self):
        from inside_inference.declarations_generated import OntologyBinding
        from scripts.build.contracts import lab_bindings
        import json
        ontology, schema = load_declarations(), load_schema()
        good = {'primary':'PositionEncoding', 'related':['Embedding','Attention']}
        OntologyBinding.from_dict(good)
        catalog = json.loads((ROOT/'catalog/stack.json').read_text())
        for bad in ({'primary':'PositionEncodng','related':[]},
                    {'primary':'PositionEncoding','related':['ImaginaryAttention']},
                    {'primary':'PositionEncoding','related':['Attention','Attention']},
                    {'primary':'PositionEncoding','related':['PositionEncoding']},
                    {'related':['Attention']}, {'primary':['Attention'],'related':[]}):
            with self.subTest(binding=bad):
                with self.assertRaises(ValueError): OntologyBinding.from_dict(bad)
                forged = copy.deepcopy(catalog); forged['innovations'][0]['ontology_binding'] = bad
                with self.assertRaisesRegex(ValueError, r'innovations\[naive-gpt\]\.ontology_binding'):
                    lab_bindings(ROOT, ontology, schema, catalog=forged)
        forged = copy.deepcopy(catalog)
        forged['innovations'][0]['ontology_binding'] = {'primary':'PositionEncodng','related':[]}
        with self.assertRaisesRegex(ValueError, "Suggestions:.*PositionEncoding"):
            lab_bindings(ROOT, ontology, schema, catalog=forged)
        missing = copy.deepcopy(ontology); del missing['terms']['PositionEncoding']
        with self.assertRaisesRegex(ValueError,'unknown ontology concept'):
            lab_bindings(ROOT, missing, schema, catalog=catalog)
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            for folder in ('docs/ontology','data-model','catalog'):
                shutil.copytree(ROOT/folder,root/folder)
            (root/'catalog/stack.json').write_text(json.dumps(forged))
            with self.assertRaisesRegex(ValueError, 'unknown ontology concept'):
                outputs(root)

    def test_operations_have_exactly_one_owner_and_no_unregistered_runtime_names(self):
        from inside_inference.declarations_generated import OPERATION_OWNERS, operation_for
        from inside_inference.model import Model, ModelArchitecture, initialize
        from inside_inference.tokenizer import Tokenizer
        from scripts.build.contracts import operation_owners
        ontology, schema = load_declarations(), load_schema()
        self.assertEqual(OPERATION_OWNERS, operation_owners(schema))
        self.assertEqual(OPERATION_OWNERS['position_embedding'], 'PositionEncoding')
        self.assertEqual(OPERATION_OWNERS['attention'], 'Attention')
        model=Model(initialize(ModelArchitecture(),Tokenizer().manifest_sha256))
        uncached=model.forward([0,3,42])['nodes']
        cached=model.forward_cached([0,3,42])['nodes']
        self.assertEqual({n['operation']['name'] for n in uncached+cached},set(OPERATION_OWNERS))
        for node in uncached+cached:
            self.assertIn(OPERATION_OWNERS[node['operation']['name']],ontology['terms'])
        with self.assertRaisesRegex(ValueError,'Unknown model operation'):
            operation_for('invented_attention')
        forged=copy.deepcopy(schema)
        forged['$defs']['EmbeddingOperation']['properties']['name']['enum'].append('attention')
        with self.assertRaisesRegex(ValueError,'already belongs'):
            admit(ontology,forged)
        forged=copy.deepcopy(schema)
        forged['$defs']['TensorObservation']['properties']['operation']['anyOf'].pop()
        with self.assertRaisesRegex(ValueError,'every admitted operation'):
            admit(ontology,forged)
        forged=copy.deepcopy(schema)
        forged['$defs']['OntologyBinding']['properties']['primary']['enum'].append('Imaginary')
        with self.assertRaisesRegex(ValueError,'ontology reference choices'):
            admit(ontology,forged)

        forged=copy.deepcopy(schema)
        forged['$defs']['OntologyBinding']['allOf']=[]
        with self.assertRaisesRegex(ValueError,'primary exclusion'):
            admit(ontology,forged)


class FrontendGovernanceTests(unittest.TestCase):
    def test_frontend_rejects_semantic_drift(self):
        from scripts.check.governance.frontend import audit_frontend_source, audit_frontend
        from scripts.build.contracts import lab_bindings
        ontology, spec = load_declarations(), load_schema()
        labs = lab_bindings(ROOT, ontology, spec)
        def check(source, suffix='.html'):
            return audit_frontend_source(Path('web/probe'+suffix), source, ontology, spec, labs)
        self.assertEqual(check('<button data-operation="attention" data-term="Attention"></button>'), [])
        self.assertEqual(check('const owner = Declarations.operationOwners[node.operation.name];', '.js'), [])
        cases = [
            ('<button data-term="InventedAttention"></button>', '.html', 'unknown ontology projection'),
            ('<button data-term="Embedding" data-operation="attention"></button>', '.html', 'does not belong'),
            ('<button data-term="Attention" data-operation="invented"></button>', '.html', 'does not belong'),
            ('<a href="ontology.html#Invented">x</a>', '.html', 'unknown ontology anchor'),
            ('const url="ontology.html#Invented";', '.js', 'unknown ontology anchor'),
            ('<a href="labs/invented.html">x</a>', '.html', 'unknown lab'),
            ('<section data-primary="Attention">x</section>', '.html', 'handwritten ownership'),
            ("const x={ontology_binding:{primary:'Attention',related:[]}};", '.js', 'handwritten ontology_binding'),
            ('const operationOwners={attention:"Embedding"};', '.js', 'handwritten semantic registry'),
            ('Declarations.labs=[];', '.js', 'cannot replace'),
            ('const field={minimum:1};', '.js', 'handwritten field limit'),
        ]
        for source, suffix, message in cases:
            with self.subTest(source=source):
                self.assertTrue(any(message in error for error in check(source, suffix)))
