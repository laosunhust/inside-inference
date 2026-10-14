"""Release admission rejects untested, mutated and unsafe static artifacts."""
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from scripts.build.hosting.release import checksums, digest, entries, package, verify
from scripts.build.hosting.aws import configuration, stack, deploy


class ReleaseTests(unittest.TestCase):
    def test_qualification_and_tampering(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            site = root/'site'; site.mkdir()
            (site/'index.html').write_text('tested entry')
            qualification = root/'result.json'
            qualification.write_text(json.dumps({'passed':False, 'site_sha256':digest(checksums(site))}))
            with self.assertRaisesRegex(ValueError, 'qualification'): package(site, qualification, root/'releases')
            qualification.write_text(json.dumps({'passed':True, 'site_sha256':digest(checksums(site))}))
            release = package(site, qualification, root/'releases')
            sealed = root/'releases'/release/'site'
            verify(sealed, release)
            self.assertEqual(package(site, qualification, root/'releases'), release)
            (site/'index.html').write_text('changed after tests')
            with self.assertRaisesRegex(ValueError, 'qualification'): package(site, qualification, root/'releases')
            (sealed/'index.html').write_text('changed after packaging')
            with self.assertRaisesRegex(ValueError, 'sealed identity'): verify(sealed, release)

    def test_manifest_rejects_unsafe_and_duplicate_paths(self):
        checksum = 'a'*64
        for name in ('../escape', '/absolute', 'a/../escape', 'a//b', './index.html'):
            with self.assertRaises(ValueError): entries((checksum+'  '+name+'\n').encode())
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            entries(((checksum+'  index.html\n')*2).encode())

    def test_wrong_account_and_unowned_stack_are_rejected(self):
        module = 'scripts.build.hosting.aws'
        config = {'account':'expected', 'region':'us-east-1', 'environments':{'dev':{'stack':'example'}}}
        with patch(module+'.read_yaml', return_value=config), patch(module+'.aws', return_value={'Account':'other'}):
            with self.assertRaisesRegex(ValueError, 'account differs'): configuration()
        with patch(module+'.aws', return_value={'Stacks':[{'Tags':[{'Key':'Project','Value':'Unrelated'}]}]}):
            with self.assertRaisesRegex(ValueError, 'ownership tags'): stack(config, 'dev')

    def test_payload_identity_is_independent_of_document_changes(self):
        from scripts.build.hosting.layout import seal_assets
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            def build(name, document, payload):
                site = root/name; site.mkdir()
                (site/'index.html').write_text(document+'<script src="app.js"></script>')
                (site/'app.js').write_text(payload)
                assets = seal_assets(site)
                self.assertIn('/assets/'+assets.name+'/app.js', (site/'index.html').read_text())
                return assets
            first = build('first', 'first page', 'first code')
            second = build('second', 'second page', 'first code')
            third = build('third', 'third page', 'changed code')
            self.assertEqual(first.name, second.name)
            self.assertNotEqual(first.name, third.name)
            self.assertEqual((first/'app.js').read_text(), 'first code')

    def test_disabled_environment_rejects_deploy_before_any_aws_call(self):
        with patch('scripts.build.hosting.aws.aws') as api:
            with self.assertRaisesRegex(ValueError, 'disabled'):
                deploy({'environments':{'prod':{'enabled':False}}}, 'prod', 'a'*64)
            api.assert_not_called()

    def test_stack_update_preserves_ownership_tags(self):
        # AWS CLI deploy clears tags when omitted, even on an existing stack.
        module = 'scripts.build.hosting.aws'
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); site = root/'site'; site.mkdir()
            (site/'index.html').write_text('qualified')
            (site/'app.js').write_text('qualified code')
            from scripts.build.hosting.layout import seal_assets
            seal_assets(site)
            proof = root/'qualification.json'
            proof.write_text(json.dumps({'passed':True, 'site_sha256':digest(checksums(site))}))
            release = package(site, proof, root/'out/releases')
            current = {'StackStatus':'CREATE_COMPLETE', 'Outputs':[
                {'OutputKey':key, 'OutputValue':value} for key,value in
                {'Bucket':'test-bucket','Release':'unpublished','Hostname':'dev.example.test'}.items()]}
            config = {'domain':'example.test', 'environments':{'dev':{'stack':'test-stack','subdomain':'dev','enabled':True}}}
            with patch(module+'.ROOT', root), patch(module+'.stack', return_value=current), \
                    patch(module+'.zone', return_value='test-zone'), patch(module+'.aws', return_value={}) as api, \
                    patch('builtins.print'):
                deploy(config, 'dev', release)
            updates = [call.args for call in api.call_args_list if call.args[1:3] == ('cloudformation', 'deploy')]
            self.assertEqual(len(updates), 1)
            self.assertIn('--tags', updates[0])
            self.assertIn('Project=InsideInference', updates[0])
            self.assertIn('Environment=dev', updates[0])


if __name__ == '__main__': unittest.main()
