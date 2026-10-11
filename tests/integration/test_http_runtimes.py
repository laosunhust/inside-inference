"""One HTTP corpus through actual sockets and Lambda runtime envelopes."""
import base64
import json
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError

from inside_inference.declarations_generated import API_PATHS, LAB_BINDINGS
from inside_inference.delivery.store import FileStore
from inside_inference.model import canonical, identity
from inside_inference.workload import default_workload
from scripts.dev.http_runtimes_generated import socket_server, lambda_response
from tests.fixtures.execution import small_checkpoint


class HttpRuntimeTests(unittest.TestCase):
    def test_same_http_corpus_and_private_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory); site=root/'site';site.mkdir()
            (site/'index.html').write_text('website')
            store=FileStore(root/'evidence');checkpoint=small_checkpoint()
            server=socket_server(('127.0.0.1',0),directory=site,store=store,checkpoint=checkpoint)
            thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
            origin=f'http://127.0.0.1:{server.server_port}'
            def compare(method,path,body=None,headers=None,encoded=False):
                headers=headers or {}
                try: reply=urlopen(Request(origin+path,data=body,headers=headers,method=method))
                except HTTPError as error: reply=error
                with reply:
                    status=reply.status;raw=reply.read()
                    response_headers={k.lower():v for k,v in reply.headers.items()}
                target=urlsplit(path)
                event={'requestContext':{'http':{'method':method}},'rawPath':target.path,'rawQueryString':target.query,
                       'headers':headers,'body':base64.b64encode(body or b'').decode() if encoded else (body or b'').decode(),
                       'isBase64Encoded':encoded}
                result=lambda_response(event,FileStore(root/'evidence'),checkpoint=checkpoint,public_origin=origin)
                self.assertEqual(status,result['statusCode'])
                self.assertEqual(raw,result['body'].encode())
                for key,value in result['headers'].items(): self.assertEqual(response_headers[key.lower()],value)
                return status,json.loads(raw)
            try:
                self.assertEqual(compare('GET',API_PATHS['capabilities'])[0],200)
                self.assertEqual(compare('GET',API_PATHS['capabilities'].replace('capabilities','%63apabilities')+'?unused=1')[0],200)
                self.assertEqual(compare('GET',API_PATHS['cacheCapabilities'])[0],200)
                self.assertEqual(compare('GET','/api/missing')[0],404)
                self.assertEqual(compare('PUT',API_PATHS['run'])[0],404)
                bad_origin={'Origin':'https://other.example','Content-Type':'application/json'}
                self.assertEqual(compare('POST',API_PATHS['run'],b'{}',bad_origin)[0],403)
                self.assertEqual(compare('GET',API_PATHS['capabilities'],headers=bad_origin)[0],403)
                for body,headers in ((b'{}',{'Content-Type':'text/plain'}),(b'{',{'Content-Type':'application/json'}),(b'',{'Content-Type':'application/json'})):
                    self.assertEqual(compare('POST',API_PATHS['run'],body,headers)[0],400)
                workload=default_workload({'text':'cat','generation':{'max_new_tokens':1,
                    'selection':'greedy-lowest-id-tie','stopping':'turn-end-or-budget'}}).to_dict()
                headers={'Content-Type':'application/json; charset=utf-8','Origin':origin}
                status,receipt=compare('POST',API_PATHS['run'],canonical(workload),headers,encoded=True)
                self.assertEqual(status,200)
                step={'checkpoint_sha256':identity(checkpoint),'prefix_ids':[0,3], 'output_ids':[],
                      'generation':workload['requests'][0]['request']['generation'],
                      'ontology_binding':LAB_BINDINGS['naive-gpt']}
                self.assertEqual(compare('POST',API_PATHS['tokenStep'],canonical(step),headers)[0],200)
                with patch.object(FileStore,'write',side_effect=OSError('unavailable')), self.assertLogs('inside_inference.delivery.application'):
                    self.assertEqual(compare('POST',API_PATHS['run'],canonical(workload),headers)[0],500)
                self.assertEqual(compare('POST',API_PATHS['artifact'],canonical(receipt['archive']),headers)[0],200)
                missing={'schema':'TensorTable','sha256':'0'*64}
                self.assertEqual(compare('POST',API_PATHS['artifact'],canonical(missing),headers)[0],404)
                with urlopen(origin+'/index.html') as page:self.assertEqual(page.read(),b'website')
                (site/'leak').symlink_to(root/'evidence',target_is_directory=True)
                (site/'nested').mkdir()
                (site/'nested/index.html').symlink_to(root/'evidence'/(receipt['archive']['sha256']+'.json'))
                for path in ('/nested/', '/evidence/','/../evidence/'+receipt['archive']['sha256']+'.json','/leak/'+receipt['archive']['sha256']+'.json'):
                    with self.assertRaises(HTTPError) as caught:urlopen(origin+path)
                    self.assertEqual(caught.exception.code,404)
            finally:
                server.shutdown();server.server_close();thread.join()
