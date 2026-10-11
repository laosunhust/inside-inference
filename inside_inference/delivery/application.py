"""One WSGI HTTP application; runtimes only adapt transport envelopes."""
import logging
from http import HTTPStatus
from urllib.parse import urlsplit

from inside_inference.contract_runtime import decode_json
from inside_inference.declarations_generated import MODELS
from inside_inference.model import canonical
from inside_inference.delivery.http_generated import REQUESTS, RESPONSES, POLICY, UNKNOWN_RESPONSE
from inside_inference.delivery.service import dispatch


def application(store, *, public_origin, checkpoint=None):
    origin = urlsplit(public_origin)
    if (origin.scheme not in ('http', 'https') or not origin.netloc or origin.path
            or origin.query or origin.fragment or origin.username or origin.password):
        raise ValueError('An explicit public origin without path or credentials is required')

    def respond(environ, start_response):
        path, method = environ['PATH_INFO'], environ['REQUEST_METHOD']
        key = (path, method)
        if key not in REQUESTS:
            status, value = UNKNOWN_RESPONSE[0], {'error':'Unknown endpoint'}
        elif environ.get('HTTP_ORIGIN') not in (None, public_origin):
            status, value = 403, {'error':'Cross-origin execution is not supported'}
        else:
            try:
                payload = None
                schema = REQUESTS[key]
                if schema:
                    if environ.get('CONTENT_TYPE', '').split(';')[0].strip().lower() != POLICY['request-content-type']:
                        raise ValueError('Expected application/json')
                    size = int(environ.get('CONTENT_LENGTH') or '0')
                    if size <= 0: raise ValueError('Request body must contain JSON')
                    payload = decode_json(environ['wsgi.input'].read(size).decode('utf-8'))
                    MODELS[schema].validate_shape(payload)
            except (ValueError, TypeError, UnicodeError) as error:
                status, value = 400, {'error':str(error)}
            else:
                try:
                    status, value = dispatch(method, path, payload, store, checkpoint=checkpoint)
                except Exception:
                    logging.getLogger(__name__).exception('HTTP execution failed')
                    status, value = 500, {'error':'Execution or evidence storage failed'}
        schema = RESPONSES.get((*key,status)) if key in REQUESTS else UNKNOWN_RESPONSE[1]
        if schema is None: raise ValueError('Undeclared HTTP response status')
        MODELS[schema].validate_shape(value)
        raw = canonical(value)
        headers = list(POLICY['response-headers'].items()) + [('Content-Length',str(len(raw)))]
        start_response(f'{status} {HTTPStatus(status).phrase}', headers)
        return [raw]
    return respond
