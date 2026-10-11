"""Standard JSON Schema validation plus declaration conversion and bound capabilities."""
from dataclasses import fields, is_dataclass
from functools import lru_cache
import json
import math

from jsonschema import Draft202012Validator
from jsonschema.exceptions import ValidationError


def _json(value):
    if isinstance(value,float) and not math.isfinite(value): raise ValueError('Nonfinite JSON number')
    if is_dataclass(value): return {f.name:_json(getattr(value,f.name)) for f in fields(value)}
    if isinstance(value, (list,tuple)): return [_json(v) for v in value]
    if isinstance(value,dict): return {k:_json(v) for k,v in value.items()}
    return value


@lru_cache(maxsize=256)
def _validator(serialized):
    return Draft202012Validator(json.loads(serialized))


def validate(schema, value, definitions, *, path='$', context=None, bound=False):
    document = {'$defs':definitions, **schema}
    try:
        _validator(json.dumps(document,sort_keys=True)).validate(_json(value))
    except ValidationError as exc:
        raise ValueError(f'{path}{exc.json_path[1:]}: {exc.message}') from exc
    if bound: _bounds(schema, _json(value), definitions, context, path)


def _bounds(schema,value,definitions,context,path):
    if '$ref' in schema: return _bounds(definitions[schema['$ref'].split('/')[-1]],value,definitions,context,path)
    for keyword in ('oneOf','anyOf'):
        if keyword in schema:
            for branch in schema[keyword]:
                try: validate(branch,value,definitions)
                except ValueError: continue
                _bounds(branch,value,definitions,context,path)
                break
    if schema.get('type')=='object':
        for key,child in schema.get('properties',{}).items():
            if key in value: _bounds(child,value[key],definitions,context,f'{path}.{key}')
    if schema.get('type')=='array':
        for i,item in enumerate(value): _bounds(schema['items'],item,definitions,context,f'{path}[{i}]')
    if 'x-maximum-from' in schema:
        limit=context
        for part in schema['x-maximum-from'].split('.'):
            if not isinstance(limit,dict) or part not in limit: raise ValueError(f'{path}: unresolved capability')
            limit=limit[part]
        if value>limit: raise ValueError(f'{path}: exceeds system capability {limit}')


def _convert(schema,value,definitions,registry):
    if '$ref' in schema: return registry[schema['$ref'].split('/')[-1]]._from_validated(value)
    for keyword in ('oneOf','anyOf'):
        if keyword in schema:
            for branch in schema[keyword]:
                # The complete input graph has already passed validation. Select
                # a branch without serializing every schema for every tensor row.
                if not Draft202012Validator({'$defs':definitions, **branch}).is_valid(value): continue
                return _convert(branch,value,definitions,registry)
            raise ValueError('No admitted declaration variant')
    if schema.get('type')=='integer': return int(value)
    if schema.get('type')=='array': return tuple(_convert(schema['items'],v,definitions,registry) for v in value)
    return value


class Declaration:
    def __post_init__(self):
        for name,field in self._definitions[self.__class__.__name__]['properties'].items():
            if '$ref' in field and not isinstance(getattr(self,name),self._registry[field['$ref'].split('/')[-1]]):
                raise ValueError(f'{name}: expected a generated nested declaration')
        self.validate_shape(self)
        # JSON Schema integers include integral JSON numbers such as 1.0.
        # Normalize their Python representation after validation for range/index use.
        for name, field in self._definitions[self.__class__.__name__]['properties'].items():
            if field.get('type') == 'integer': object.__setattr__(self,name,int(getattr(self,name)))

    def to_dict(self): return _json(self)

    @classmethod
    def validate_shape(cls,value):
        # Generated definitions are fixed for the process. Cache by class rather
        # than serializing the whole schema graph for every tokenizer span.
        try: _declaration_validator(cls).validate(_json(value))
        except ValidationError as exc:
            raise ValueError(f'${exc.json_path[1:]}: {exc.message}') from exc

    @classmethod
    def from_dict(cls,value):
        value = _json(value)
        cls.validate_shape(value)
        return cls._from_validated(value)

    @classmethod
    def _from_validated(cls,value):
        # Internal conversion of the detached graph validated by from_dict.
        # Avoid recursively validating every ancestor's fields again.
        properties=cls._definitions[cls.__name__]['properties']
        result = object.__new__(cls)
        for k,v in properties.items():
            object.__setattr__(result,k,_convert(v,value[k],cls._definitions,cls._registry))
        return result

    def validate_bound(self,context):
        value = self.to_dict()
        self.validate_shape(value)
        _bounds(self._definitions[self.__class__.__name__],value,self._definitions,context,'$')


def decode_json(text):
    def unique(pairs):
        result={}
        for key,value in pairs:
            if key in result: raise ValueError(f'Duplicate JSON field: {key}')
            result[key]=value
        return result
    def constant(value): raise ValueError(f'Nonfinite JSON number: {value}')
    return _json(json.loads(text,object_pairs_hook=unique,parse_constant=constant))


@lru_cache(maxsize=None)
def _declaration_validator(cls):
    return Draft202012Validator({'$defs':cls._definitions, **cls._definitions[cls.__name__]})
