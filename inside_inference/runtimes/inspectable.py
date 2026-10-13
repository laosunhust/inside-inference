"""Selected-model continuation over the same inspectable scalar engine, without chat framing."""
import gzip
import json
from pathlib import Path
import time
from inside_inference.model import Model, canonical, identity
from inside_inference.generation import select_greedy
from inside_inference.tokenizer import Tokenizer, TokenizerError
from inside_inference.declarations_generated import ModelDescriptor

_model = None
_tokenizer = None
_descriptor = None


def load_tiny(raw):
    global _model, _tokenizer, _descriptor
    _model=None;_tokenizer=None;_descriptor=None
    descriptor=json.loads(raw);ModelDescriptor.validate_shape(descriptor)
    model=Model(json.loads(gzip.decompress(Path('/story-weights.bin').read_bytes())))
    tokenizer=Tokenizer(Path('/story-tokenizer.json'))
    if model.checkpoint['manifest_sha256']!=tokenizer.manifest_sha256:raise ValueError('Model/tokenizer mismatch')
    if model.checkpoint['config']!=descriptor['architecture']:raise ValueError('Model architecture differs from catalog')
    _model,_tokenizer,_descriptor=model,tokenizer,descriptor


def _pieces(ids):
    return [_tokenizer.tokens[i].piece if _tokenizer.tokens[i].kind in ('word','space','punctuation') else '<'+_tokenizer.tokens[i].piece+'>' for i in ids]


def parameters_json():
    return canonical(_model.checkpoint["parameters"]).decode()


def vocabulary_json():
    return canonical(_pieces(range(len(_tokenizer.tokens)))).decode()


def execute_tiny(name, raw):
    request=json.loads(raw)
    if _model is None:raise ValueError('Model not loaded')
    model=_descriptor
    if model['id']!=request['experiment']['model_id']:raise ValueError('Wrong loaded model')
    if name=='prepareGeneration':
        encoding=_tokenizer.encode(request['workload']['requests'][0]['request']['text'])
        ids=[0,*encoding.ids]
        if len(ids)>_model.config.context:raise ValueError('Input exceeds model context')
        result=dict(input=request,prompt_ids=ids,pieces=_pieces(ids),encoding=encoding.to_dict())
    elif name=='generateToken':
        ids=request['prefix_ids']+request['output_ids']
        if (len(ids)>_model.config.context or len(request['output_ids'])>=request['generation']['max_new_tokens']
            or request['output_ids'] and any(i in model['stop_ids'] for i in request['output_ids'])):
            raise ValueError('Request has already finished')
        start=time.perf_counter()
        run=_model.forward(ids,capture=True,run_id=identity({'weights':model['weights']['sha256'],'ids':ids}),step=len(request['output_ids']))
        logits=run['logits'][-1]
        selection=select_greedy(logits)
        selected=selection['selected_id']
        output=[*request['output_ids'],selected];sequence=[*request['prefix_ids'],*output]
        # Literal diagnostic display preserves malformed byte/control selections.
        # No forced spaces, output repair or decoding masks.
        visible=output[:-1] if selected in model['stop_ids'] else output
        note=None
        try: text=_tokenizer.decode(visible)
        except TokenizerError as error:
            note=str(error);text=''
            for end in range(len(visible)-1,0,-1):
                try: text=_tokenizer.decode(visible[:end]);break
                except TokenizerError: pass
        stop=('end_token' if selected in model['stop_ids'] else 'output_budget' if len(output)>=request['generation']['max_new_tokens'] else 'context_capacity' if len(sequence)>_model.config.context else None)
        result=dict(model_id=model['id'],weights_sha256=model['weights']['sha256'],tokenizer_sha256=model['tokenizer']['sha256'],sequence_ids=sequence,output_ids=output,text=text,pieces=_pieces(sequence),logits=logits,probabilities=selection['probabilities'],selected_id=selected,stop_reason=stop,compute_ms=(time.perf_counter()-start)*1000,nodes=run['nodes'],decoding_note=note)
    else:raise ValueError('Unknown story operation')
    return canonical(result).decode()
