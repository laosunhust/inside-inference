"""Strict authored YAML: duplicate keys, aliases, and non-JSON values are errors.

Adapted from CNCRover's readSemanticYAML admission principle; provenance is in
 governance/reuse.yaml. PyYAML is already a locked build dependency here.
"""
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


def read_yaml(path):
    value = yaml.load(Path(path).read_text(), Loader=StrictLoader)
    try:
        return decode_json(json.dumps(value, allow_nan=False))
    except (TypeError, ValueError) as exc:
        raise ValueError(f'{path}: YAML must represent finite JSON-compatible values') from exc
