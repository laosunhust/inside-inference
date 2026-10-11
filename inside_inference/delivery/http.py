"""Read-only artifact access through the declared API, usable by headless clients."""
from urllib.request import Request, urlopen
from inside_inference.model import canonical
from inside_inference.contract_runtime import decode_json
from inside_inference.declarations_generated import API_PATHS, ArtifactResponse


class HttpStore:
    def __init__(self, base): self.base = base

    def read(self, key, schema):
        reference = {'schema':schema, 'sha256':key}
        request = Request(self.base + API_PATHS['artifact'], data=canonical(reference),
                          headers={'Content-Type':'application/json'})
        with urlopen(request, timeout=60) as response:
            artifact = decode_json(response.read().decode())
        ArtifactResponse.validate_shape(artifact)
        if artifact['reference'] != reference: raise ValueError('Artifact response differs')
        return artifact['content'].encode()
