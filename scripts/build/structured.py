"""Strict authored YAML: duplicate keys, aliases, and non-JSON values are errors.

Adapted from CNCRover's readSemanticYAML admission principle; provenance is in
 governance/reuse.yaml. PyYAML is already a locked build dependency here.
"""
from copy import deepcopy
from functools import lru_cache
import json
import math
from pathlib import Path
import yaml
from inside_inference.contract_runtime import decode_json


class StrictLoader(yaml.SafeLoader):
    def compose_node(self, parent, index):
        if self.check_event(yaml.AliasEvent):
            raise ValueError('YAML aliases are not admitted authorities')
        return super().compose_node(parent, index)


def mapping(loader, node):
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node)
        if not isinstance(key, str) or key in result:
            raise ValueError(f'Non-string or duplicate YAML key: {key!r}')
        result[key] = loader.construct_object(value_node)
    return result


StrictLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, mapping)


@lru_cache(maxsize=128)
def _parse_yaml(source):
    value = yaml.load(source, Loader=StrictLoader)
    return decode_json(json.dumps(value, allow_nan=False))


def read_yaml(path):
    # Read every time: content (not path/mtime) owns cache identity. Callers may
    # mutate declarations, so never expose the cached object itself.
    source = Path(path).read_text()
    try:
        return deepcopy(_parse_yaml(source))
    except (TypeError, ValueError) as exc:
        raise ValueError(f'{path}: YAML must represent finite JSON-compatible values: {exc}') from exc
