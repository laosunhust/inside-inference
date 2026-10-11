import base64
import io
import json
from pathlib import Path
import tempfile
import unittest

from inside_inference.delivery.codec import publish, restore
from inside_inference.delivery.service import dispatch
from inside_inference.delivery.store import FileStore, MemoryStore, S3Store
from inside_inference.declarations_generated import API_PATHS
from inside_inference.model import canonical
from inside_inference.workload import default_workload, run_workload
from functools import partial
from scripts.dev.http_runtimes_generated import lambda_response
handle = partial(lambda_response, public_origin="https://insideinference.dev")
from tests.fixtures.execution import small_checkpoint


class ObjectClient:
    class exceptions:
        class NoSuchKey(Exception): pass
    def __init__(self): self.objects = {}
    def put_object(self, *, Bucket, Key, Body, ContentType): self.objects[(Bucket,Key)] = Body
    def get_object(self, *, Bucket, Key):
        try: return {'Body':io.BytesIO(self.objects[(Bucket,Key)])}
        except KeyError: raise self.exceptions.NoSuchKey from None


class ArtifactAdapterTests(unittest.TestCase):
    def test_lambda_envelopes_and_persistent_stores_share_execution(self):
        checkpoint = small_checkpoint()
        workload = default_workload({'text':'cat','generation':{'max_new_tokens':1,
            'selection':'greedy-lowest-id-tie','stopping':'turn-end-or-budget'}}).to_dict()
        expected = run_workload(workload, checkpoint=checkpoint)
        event = {'requestContext':{'http':{'method':'POST'}},'rawPath':API_PATHS['run'],
                 'headers':{'content-type':'application/json'},'body':canonical(workload).decode()}
        client = ObjectClient()
        with tempfile.TemporaryDirectory() as directory:
            stores = [MemoryStore(), FileStore(directory), S3Store(client,'evidence-test')]
            receipts=[]
            for store in stores:
                reply = handle(event,store,checkpoint=checkpoint)
                self.assertEqual(reply['statusCode'],200)
                receipt = json.loads(reply['body']); receipts.append(receipt)
                self.assertEqual(canonical(restore(receipt,store)),canonical(expected))
            self.assertTrue(all(r==receipts[0] for r in receipts))
            # A new file-store instance must recover data without process memory.
            self.assertEqual(canonical(restore(receipts[1],FileStore(directory))),canonical(expected))
            raw = canonical(workload)
            encoded = dict(event,body=base64.b64encode(raw).decode(),isBase64Encoded=True)
            self.assertEqual(handle(encoded,stores[0],checkpoint=checkpoint),handle(event,stores[0],checkpoint=checkpoint))
            artifact_event=dict(event,rawPath=API_PATHS['artifact'],body=canonical(receipts[0]['archive']).decode())
            reply=handle(artifact_event,stores[0]); self.assertEqual(reply['statusCode'],200)
            status, value=dispatch('POST',API_PATHS['artifact'],receipts[0]['archive'],stores[0])
            self.assertEqual(reply['body'],canonical(value).decode())
            self.assertEqual(status,200)
            missing={'schema':'TensorTable','sha256':'0'*64}
            self.assertEqual(handle(dict(artifact_event,body=canonical(missing).decode()),stores[0])['statusCode'],404)
            for body in ('{','{}'):
                self.assertEqual(handle(dict(event,body=body),stores[0],checkpoint=checkpoint)['statusCode'],400)
            with self.assertRaises(ValueError): stores[1].read('../escape')
            (Path(directory)/('0'*64+'.json')).symlink_to(Path(directory)/'elsewhere')
            with self.assertRaises(ValueError): stores[1].read('0'*64)
