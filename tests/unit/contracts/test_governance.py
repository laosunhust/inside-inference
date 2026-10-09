"""Counterexamples for each mechanical governance claim."""
import copy
from pathlib import Path
import shutil
import tempfile
import unittest
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

    def test_evaluation_without_criteria_or_reuse_is_blocked(self):
        original=read_yaml(ROOT/'governance/evaluations.yaml')
        for key in ('question','baseline','criteria','counterexamples','reuse'):
            with self.subTest(key=key), tempfile.TemporaryDirectory() as directory:
                root=Path(directory);(root/'governance').mkdir()
                changed=copy.deepcopy(original);changed[key]=[] if isinstance(changed[key],list) else ''
                (root/'governance/evaluations.yaml').write_text(yaml.safe_dump(changed))
                with self.assertRaises(ValueError):audit_evaluation(root)

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
