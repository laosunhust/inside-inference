"""Compose the shared HTTP application with Lambda and object storage."""
import os
from functools import lru_cache
from inside_inference.delivery.store import S3Store
from scripts.dev.http_runtimes_generated import lambda_response


@lru_cache(maxsize=1)
def remote_store():
    import boto3
    return S3Store(boto3.client('s3'), os.environ['EVIDENCE_BUCKET'])


def handler(event, context):
    return lambda_response(event, remote_store(), public_origin=os.environ['PUBLIC_ORIGIN'])
