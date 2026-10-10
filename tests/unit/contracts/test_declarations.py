import copy
from dataclasses import FrozenInstanceError
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
import yaml

from inside_inference.declarations_generated import InferenceRequest, GenerationPolicy
from inside_inference.declarations import validate_result
from inside_inference.contract_runtime import decode_json
from inside_inference.generation import run_request
from inside_inference.workload import run_workload
from scripts.build.generate_data_models import ROOT, admit, generate, outputs, read as read_json
from scripts.build.ontology import load_declarations
from scripts.build.structured import read_yaml

def read(path):
    return read_yaml(path) if path.suffix == ".yaml" else read_json(path)


class DeclarationTests(unittest.TestCase):
    def test_ontology_directory_bans_prose_and_json_disguised_as_ontology(self):
        for relative in ('notes.md', 'notes.txt', 'notes.rst', 'notes.html', 'nested/README.md'):
            with self.subTest(relative=relative), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                shutil.copytree(ROOT/'docs/ontology', root/'docs/ontology')
                extra = root/'docs/ontology'/relative
                extra.parent.mkdir(parents=True, exist_ok=True)
                extra.write_text('A prose-only authority')
                # The same generator used by make check must reject it before generation.
                with self.assertRaisesRegex(ValueError, 'prose-only documents are forbidden'):
                    generate(root, check=True)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            shutil.copytree(ROOT/'docs/ontology', root/'docs/ontology')
            manifest_path = root/'docs/ontology/declarations.yaml'
            manifest = read(manifest_path)
            manifest['modules'].append('notes.yaml')
            manifest_path.write_text(json.dumps(manifest))
            (root/'docs/ontology/notes.yaml').write_text('{"text":"A disguised prose document"}')
            with self.assertRaisesRegex(ValueError, 'malformed ontology module'):
                generate(root, check=True)

    def test_every_owner_and_visual_projection_must_bind_existing_declarations(self):
        ontology = load_declarations()
        schema = read(ROOT/'data-model/inference.schema.json')
        empty = copy.deepcopy(ontology)
        empty['terms']['Worker'] = copy.deepcopy(empty['terms']['InferenceSystem'])
        empty['terms']['Worker']['schemas'] = []
        with self.assertRaisesRegex(ValueError, 'nonempty unique'):
            admit(empty, schema)
        for fields in ({}, {'InferenceRequest':['nonexistent']}, {'KVResidencySystemConfig':['backend']}):
            with self.subTest(fields=fields):
                bad = copy.deepcopy(ontology)
                bad['terms']['InferenceRequest']['projections']['Request']['fields'] = fields
                with self.assertRaisesRegex(ValueError, 'projection'):
                    admit(bad, schema)
        bad = copy.deepcopy(ontology)
        bad['terms']['InferenceSystem']['projections']['Request'] = copy.deepcopy(
            bad['terms']['InferenceRequest']['projections']['Request'])
        with self.assertRaisesRegex(ValueError, 'projection'):
            admit(bad, schema)

    def test_domain_modules_reject_duplicates_omissions_and_forbidden_dependencies(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            shutil.copytree(ROOT/'docs/ontology', root/'docs/ontology')
            manifest_path = root/'docs/ontology/declarations.yaml'
            manifest = read(manifest_path)
            module_path = root/'docs/ontology/interface.yaml'
            module = read(module_path)
            module['terms']['ModelArtifact'] = load_declarations()['terms']['ModelArtifact']
            module_path.write_text(json.dumps(module))
            with self.assertRaisesRegex(ValueError, 'competing'): load_declarations(root)
            shutil.copyfile(ROOT/'docs/ontology/interface.yaml', module_path)
            manifest_path.write_text(json.dumps(dict(manifest, modules=manifest['modules'][:-1])))
            with self.assertRaisesRegex(ValueError, 'Missing or unlisted'): load_declarations(root)
            manifest_path.write_text(json.dumps(manifest))
            module_path.unlink()
            with self.assertRaisesRegex(ValueError, 'Missing or unlisted'): load_declarations(root)
            shutil.copyfile(ROOT/'docs/ontology/interface.yaml', module_path)
            system_path = root/'docs/ontology/inference-system.yaml'
            system = read(system_path)
            system['terms']['InferenceSystem']['depends_on'] = ['MissingOwner']
            system_path.write_text(json.dumps(system))
            with self.assertRaisesRegex(ValueError, 'unknown dependency'):
                admit(load_declarations(root), read(ROOT/'data-model/inference.schema.json'))

    def test_admission_rejects_competing_unowned_and_cross_boundary_schemas(self):
        ontology = load_declarations()
        schema = read(ROOT / 'data-model/inference.schema.json')
        admit(ontology, schema)
        bad = copy.deepcopy(ontology)
        bad['terms']['InferenceRequest']['schemas'] = ['ModelArchitecture']
        with self.assertRaisesRegex(ValueError, 'competing'): admit(bad, schema)
        bad = copy.deepcopy(schema)
        bad['$defs']['JunkDrawer'] = copy.deepcopy(bad['$defs']['InferenceRequest'])
        with self.assertRaisesRegex(ValueError, 'Unowned'): admit(ontology, bad)
        bad = copy.deepcopy(schema)
        bad['$defs']['ModelArtifactReference']['properties']['architecture'] = {'$ref':'#/$defs/InferenceRequest'}
        with self.assertRaisesRegex(ValueError, 'cannot depend'): admit(ontology, bad)
        bad = copy.deepcopy(schema)
        bad['$defs']['GenerationPolicy']['properties']['max_new_tokens']['x-maximum-from'] = 'system.missing'
        with self.assertRaisesRegex(ValueError, 'capability'): admit(ontology, bad)
        bad = copy.deepcopy(schema)
        bad['$defs']['InferenceRequest']['properties']['text']['unknownKeyword'] = 1
        with self.assertRaisesRegex(ValueError, 'unsupported'): admit(ontology, bad)

    def test_multiple_declarations_share_one_owner_without_losing_boundaries(self):
        ontology = load_declarations()
        spec = read(ROOT/'data-model/inference.schema.json')
        artifact = ontology['terms']['ModelArtifact']
        self.assertEqual(set(artifact['schemas']), {
            'ModelArtifact', 'ModelArtifactReference', 'InitializationProvenance', 'TrainingProvenance'})
        self.assertNotIn('TrainingProvenance', ontology['terms'])
        artifact['projections']['Artifact'] = {'meaning':'Full payload and its reference',
            'fields':{'ModelArtifact':['parameters'], 'ModelArtifactReference':['checkpoint_sha256']}}
        admit(ontology, spec)
        for names, error in [([], 'nonempty unique'), (['ModelArtifact']*2, 'nonempty unique'),
                             (artifact['schemas']+['MissingRecord'], 'stale')]:
            bad = copy.deepcopy(ontology)
            bad['terms']['ModelArtifact']['schemas'] = names
            with self.assertRaisesRegex(ValueError, error): admit(bad, spec)
        bad = copy.deepcopy(spec)
        bad['$defs']['TrainingProvenance']['x-owner'] = 'ModelWeights'
        with self.assertRaisesRegex(ValueError, 'owner'): admit(ontology, bad)
        bad = copy.deepcopy(ontology)
        bad['terms']['ModelArtifact']['depends_on'].remove('ModelWeights')
        with self.assertRaisesRegex(ValueError, 'cannot depend'): admit(bad, spec)

    def test_request_arrivals_and_system_variants_have_shared_owners(self):
        from inside_inference.declarations_generated import RequestArrival, Workload
        ontology = load_declarations()
        owners = ontology['terms']
        self.assertEqual(owners['InferenceRequest']['schemas'], ['InferenceRequest', 'RequestArrival'])
        self.assertEqual(owners['InferenceSystem']['schemas'], ['InferenceSystem', 'KVResidencySystemConfig'])
        self.assertNotIn('ScheduledRequest', owners)
        self.assertNotIn('CacheSystem', owners)
        self.assertEqual(owners['Workload']['depends_on'], ['InferenceRequest'])
        system_fields = owners['InferenceSystem']['projections']['Inference system']['fields']
        self.assertEqual(set(system_fields), {'InferenceSystem', 'KVResidencySystemConfig'})
        requests = tuple(RequestArrival(request_id=f'r{budget}', arrival_us=0,
            request=InferenceRequest(generation=GenerationPolicy(max_new_tokens=budget)))
            for budget in (1, 3))
        workload = Workload.from_dict(Workload(requests=requests).to_dict())
        self.assertEqual([r.request.generation.max_new_tokens for r in workload.requests], [1, 3])
        spec = read(ROOT/'data-model/inference.schema.json')
        for name, wrong_owner in [('RequestArrival', 'Workload'),
                                  ('KVResidencySystemConfig', 'GenerationPolicy')]:
            bad = copy.deepcopy(spec)
            bad['$defs'][name]['x-owner'] = wrong_owner
            with self.assertRaisesRegex(ValueError, 'owner'): admit(ontology, bad)

    def test_response_owns_publication_completion_and_outcome(self):
        ontology = load_declarations()
        owners = ontology['terms']
        response = owners['InferenceResponse']
        names = {'TokenDelivered', 'RequestFinished', 'RunOutcome'}
        self.assertEqual(set(response['schemas']), names)
        self.assertTrue(names.isdisjoint(owners))
        spec = read(ROOT/'data-model/inference.schema.json')
        for name in names:
            self.assertEqual(spec['$defs'][name]['x-owner'], 'InferenceResponse')
        self.assertIn('InferenceResponse', owners['ExperimentEvent']['depends_on'])
        self.assertIn('InferenceResponse', owners['ExperimentExecution']['depends_on'])
        admit(ontology, spec)
        bad = copy.deepcopy(ontology)
        bad['terms']['ExperimentEvent']['depends_on'].remove('InferenceResponse')
        with self.assertRaisesRegex(ValueError, 'cannot depend'): admit(bad, spec)
        bad = copy.deepcopy(ontology)
        bad['terms']['InferenceResponse']['projections']['Response']['fields']['TokenSelected'] = ['token_id']
        with self.assertRaisesRegex(ValueError, 'projection'): admit(bad, spec)

    def test_experiment_concepts_separate_specs_events_and_observations(self):
        module = read(ROOT/'docs/ontology/experiment.yaml')
        self.assertEqual(set(module['terms']), {'ExperimentSpec', 'ExperimentExecution',
            'ExperimentEvent', 'ExperimentObservation'})
        ontology = load_declarations()
        spec = read(ROOT/'data-model/inference.schema.json')
        self.assertEqual(spec['$defs']['DecodingContract']['x-owner'], 'GenerationPolicy')
        self.assertNotIn('DecodingContract', ontology['terms'])
        for name, owner in [('RunBinding','ExperimentSpec'), ('CacheRun','ExperimentExecution'),
                            ('RunEvent','ExperimentEvent'), ('CacheMeasurement','ExperimentObservation')]:
            self.assertEqual(spec['$defs'][name]['x-owner'], owner)
        self.assertEqual(spec['$defs']['EventClock']['properties']['kind']['const'], 'execution-order')
        self.assertIn('time_us', spec['$defs']['CacheEvent']['properties'])
        self.assertIn('elapsed_us', spec['$defs']['CacheMeasurement']['properties'])
        bad = copy.deepcopy(spec)
        bad['$defs']['RequestBinding']['properties']['request'] = {'$ref':'#/$defs/CacheMeasurement'}
        with self.assertRaisesRegex(ValueError, 'cannot depend'): admit(ontology, bad)
        bad = copy.deepcopy(ontology)
        bad['terms']['ExperimentEvent']['projections']['Event']['fields']['TensorObservation'] = ['values']
        with self.assertRaisesRegex(ValueError, 'projection'): admit(bad, spec)

    def test_execution_capabilities_own_both_service_payloads(self):
        ontology = load_declarations()
        terms = ontology['terms']
        names = {'Capabilities', 'CacheCapabilities'}
        self.assertEqual(set(terms['ExecutionCapabilities']['schemas']), names)
        self.assertTrue(names.isdisjoint(terms))
        spec = read(ROOT/'data-model/inference.schema.json')
        for name in names:
            self.assertEqual(spec['$defs'][name]['x-owner'], 'ExecutionCapabilities')
            bad = copy.deepcopy(spec)
            bad['$defs'][name]['x-owner'] = 'InferenceSystem'
            with self.assertRaisesRegex(ValueError, 'owner'): admit(ontology, bad)
        bad = copy.deepcopy(ontology)
        bad['terms']['InferenceSystem']['schemas'].append('CacheCapabilities')
        with self.assertRaisesRegex(ValueError, 'competing'): admit(bad, spec)

    def test_generation_detects_stale_consumers_without_repair(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            shutil.copytree(ROOT/'data-model', root/'data-model')
            shutil.copytree(ROOT/'docs/ontology', root/'docs/ontology')
            generate(root)
            generate(root,check=True)
            target = root/'inside_inference/declarations_generated.py'
            target.write_text(target.read_text()+'# drift\n')
            with self.assertRaisesRegex(ValueError,'stale'): generate(root,check=True)
            self.assertTrue(target.read_text().endswith('# drift\n'))
            schema = read(root/'data-model/domains/inference-system.yaml')
            schema['$defs']['GenerationPolicy']['properties']['max_new_tokens']['default']=2
            (root/'data-model/domains/inference-system.yaml').write_text(yaml.safe_dump(schema,sort_keys=False))
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

    def test_preparation_provenance_is_artifact_owned_and_strict(self):
        from inside_inference.declarations_generated import TrainingProvenance, InitializationProvenance
        from inside_inference.model import Model, initialize, ModelArchitecture
        from inside_inference.tokenizer import Tokenizer
        initial = initialize(ModelArchitecture(), Tokenizer().manifest_sha256)
        InitializationProvenance.from_dict(initial['provenance'])
        trained = {'kind':'trained','seed':7,'step':1,'preparation_run_sha256':'0'*64,
                   'selection':'minimum-development-response-loss','development_loss':1.0,
                   'data_sha256':'1'*64,'source_sha256':{'source':'2'*64}}
        TrainingProvenance.from_dict(trained)
        initial['provenance'] = trained
        Model(initial)
        for bad in (dict(trained,step=0), dict(trained,kind='untrained'), dict(trained,unknown=1)):
            initial['provenance'] = bad
            with self.assertRaises(ValueError): Model(initial)

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
