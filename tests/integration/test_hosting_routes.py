"""Execute the deployed edge function source, including a release transition."""
import json
import subprocess
import unittest
from scripts import ROOT
from scripts.build.structured import read_yaml


class HostingRoutes(unittest.TestCase):
    def test_clean_documents_and_pinned_assets(self):
        template = read_yaml(ROOT/'infrastructure/aws/site.yaml')
        source = template['Resources']['ReleasePointer']['Properties']['FunctionCode']['Fn::Sub']
        subprocess.run(['node', '--input-type=module', '-e', '''
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=JSON.parse(process.argv[1]);
function handler(release,enabled){
  const context=vm.createContext({});
  vm.runInContext(source.replaceAll('${Release}',release).replaceAll('${Enabled}',enabled),context);
  return uri=>context.handler({request:{uri,querystring:{q:{value:'kept'}}}});
}
const first=handler('a'.repeat(64),'true'),second=handler('b'.repeat(64),'true');
for(const [path,file] of [['/','index.html']]){
  const result=first(path);assert.equal(result.uri,'/releases/'+'a'.repeat(64)+'/'+file);
  assert.equal(result.statusCode,undefined);assert.equal(result.querystring.q.value,'kept');
}
const asset='/assets/'+'c'.repeat(64)+'/execution/worker.generated.js';
assert.equal(first(asset).uri,second(asset).uri);
for(const path of ['/ontology/','/declarations/','/index.html','/unknown','/missing.js','/releases/'+'a'.repeat(64)+'/index.html'])assert.equal(first(path).statusCode,404);
for(const path of ['/',asset,'/releases/'+'a'.repeat(64)+'/execution/worker.generated.js'])assert.equal(handler('a'.repeat(64),'false')(path).statusCode,403);
assert.equal(handler('unpublished','true')('/').statusCode,503);
''', json.dumps(source)], check=True, cwd=ROOT, timeout=10)
