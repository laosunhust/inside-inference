import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
import yaml

from inside_inference.workload import run_workload
from scripts.build.generate_data_models import ROOT, generate, outputs, read as read_json
from scripts.build.structured import read_yaml

def read(path):
    return read_yaml(path) if path.suffix == ".yaml" else read_json(path)


class GeneratedArtifactIntegrationTests(unittest.TestCase):
    def test_generation_detects_stale_consumers_without_repair(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            shutil.copytree(ROOT/'data-model', root/'data-model')
            shutil.copytree(ROOT/'docs/ontology', root/'docs/ontology')
            shutil.copytree(ROOT/'catalog', root/'catalog')
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

    def test_browser_state_contract_and_validator_parity(self):
        # Pure request transitions and generated-client admission; numerical parity is in Chromium.
        from scripts.build.model_assets.catalog import describe
        from scripts.build.intro_page import initial_generation
        import gzip
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'fixture.json'
            catalog=describe(read_yaml(ROOT/'data/models/models.yaml'),ROOT/'data/models/artifacts')
            model=next(m for m in catalog['models'] if m['inspection']=='tensors')
            checkpoint=json.loads(gzip.decompress((ROOT/'data/models/artifacts'/model['weights']['path']).read_bytes()))
            input=initial_generation();input['experiment']['model_id']=model['id']
            path.write_text(json.dumps({'input':input,'loaded':{'model':model,'load_ms':0,'token_pieces':['x']*384,'parameters':checkpoint['parameters']}}))
            subprocess.run(['node',str(ROOT/'tests/integration/inspection_session.mjs'),str(path)],check=True,capture_output=True,text=True)
