import copy
from dataclasses import FrozenInstanceError
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

from inside_inference.declarations_generated import InferenceRequest, GenerationPolicy
from inside_inference.declarations import validate_result
from inside_inference.contract_runtime import decode_json
from inside_inference.generation import run_request
from inside_inference.workload import run_workload
from scripts.build.generate_data_models import ROOT, admit, generate, outputs, read


class DeclarationTests(unittest.TestCase):
    def test_admission_rejects_competing_unowned_and_cross_boundary_schemas(self):
        ontology = read(ROOT / 'docs/ontology/declarations.json')
        schema = read(ROOT / 'data-model/inference.schema.json')
        admit(ontology, schema)
        bad = copy.deepcopy(ontology)
        bad['terms']['InferenceRequest']['schemas'].append('ModelArchitecture')
        with self.assertRaisesRegex(ValueError, 'competing'): admit(bad, schema)
        bad = copy.deepcopy(schema)
        bad['$defs']['JunkDrawer'] = copy.deepcopy(bad['$defs']['InferenceRequest'])
        with self.assertRaisesRegex(ValueError, 'Unowned'): admit(ontology, bad)
        bad = copy.deepcopy(schema)
        bad['$defs']['ModelArtifact']['properties']['architecture'] = {'$ref':'#/$defs/InferenceRequest'}
        with self.assertRaisesRegex(ValueError, 'cannot depend'): admit(ontology, bad)
        bad = copy.deepcopy(schema)
        bad['$defs']['GenerationPolicy']['properties']['max_new_tokens']['x-maximum-from'] = 'system.missing'
        with self.assertRaisesRegex(ValueError, 'capability'): admit(ontology, bad)
        bad = copy.deepcopy(schema)
        bad['$defs']['InferenceRequest']['properties']['text']['unknownKeyword'] = 1
        with self.assertRaisesRegex(ValueError, 'unsupported'): admit(ontology, bad)

    def test_generation_detects_stale_consumers_without_repair(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in ['docs/ontology/declarations.json','data-model/inference.schema.json','data-model/openapi.json']:
                (root/name).parent.mkdir(parents=True,exist_ok=True)
                shutil.copyfile(ROOT/name,root/name)
            generate(root)
            generate(root,check=True)
            target = root/'inside_inference/declarations_generated.py'
            target.write_text(target.read_text()+'# drift\n')
            with self.assertRaisesRegex(ValueError,'stale'): generate(root,check=True)
            self.assertTrue(target.read_text().endswith('# drift\n'))
            schema = read(root/'data-model/inference.schema.json')
            schema['$defs']['GenerationPolicy']['properties']['max_new_tokens']['default']=2
            (root/'data-model/inference.schema.json').write_text(json.dumps(schema))
            changed = outputs(root)
            self.assertIn('max_new_tokens: int = 2',changed['inside_inference/declarations_generated.py'])
            self.assertIn('"default": 2',changed['web/declarations.generated.js'])

    def test_ambiguous_json_is_rejected_before_validation(self):
        for raw in ('{"text":"cat","text":"dog"}', '{"value":NaN}', '{"value":Infinity}', '{"value":1e999}'):
            with self.assertRaises(ValueError): decode_json(raw)

    def test_generated_models_are_strict_and_immutable(self):
        self.assertIs(type(GenerationPolicy(max_new_tokens=1.0).max_new_tokens),int)
        request = InferenceRequest()
        with self.assertRaises(FrozenInstanceError): request.text='changed'
        with self.assertRaises(ValueError): InferenceRequest.from_dict({'text':'cat','seed':7})
        with self.assertRaises(ValueError): InferenceRequest(generation={})
        with self.assertRaises(ValueError): GenerationPolicy(max_new_tokens=True)
        with self.assertRaises(ValueError): GenerationPolicy(max_new_tokens=0)
        with self.assertRaises(ValueError): run_request(InferenceRequest(generation=GenerationPolicy(max_new_tokens=9)).to_dict())

    def test_budget_is_ceiling_and_outcome_is_observed(self):
        results=[]
        for budget in (1,2,3,8):
            request=InferenceRequest(text='the ball is in',generation=GenerationPolicy(max_new_tokens=budget))
            run=run_request(request.to_dict()); results.append(run)
            self.assertEqual(run['declaration']['request'],request.to_dict())
            validate_result(run)
        self.assertEqual([len(r['passes']) for r in results],[1,2,3,8])
        self.assertEqual([r['outcome']['unused_budget'] for r in results],[0,0,0,0])
        self.assertEqual([r['outcome']['stop_reason'] for r in results],['output_budget']*4)
        self.assertEqual(results[2]['output_ids'],results[3]['output_ids'][:3])
        for key,value in [('unused_budget',1),('selected_tokens',3),('complete',True)]:
            bad=copy.deepcopy(results[3]);bad['outcome'][key]=value
            with self.assertRaises(ValueError): validate_result(bad)

    def test_browser_state_contract_and_validator_parity(self):
        # Node runs the same generated consumers and pure transitions as the page.
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'run.json';path.write_text(json.dumps(run_workload()))
            subprocess.run(['node',str(ROOT/'tests/unit/inspection_session.mjs'),str(path)],check=True,capture_output=True,text=True)


if __name__=='__main__': unittest.main()
