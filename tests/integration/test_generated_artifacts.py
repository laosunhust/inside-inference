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
        # Node runs the same generated consumers and pure transitions as the page.
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'run.json';path.write_text(json.dumps(run_workload()))
            subprocess.run(['node',str(ROOT/'tests/integration/inspection_session.mjs'),str(path)],check=True,capture_output=True,text=True)
