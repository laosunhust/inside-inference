/* Declared model operations; presentation never imports runtimes or asset readers. */
import {readAsset,readCatalog} from './model-storage.js';
let loaded=null, module=null, prefix=[];
let catalog=null;
export function handlesModelOperation(name) {return ['modelCatalog','loadModel','prepareGeneration','generateToken'].includes(name);}
export async function executeModelOperation(name,input,py) {
  const result=await execute(name,input,py);
  if(name==='generateToken') {
    result.request=input;
    result.contract_sha256=py.runPython('from inside_inference.declarations_generated import CONTRACT_SHA256; CONTRACT_SHA256');
    const raw=new TextEncoder().encode(JSON.stringify([result.contract_sha256,result.weights_sha256,result.tokenizer_sha256,input]));
    result.id=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),b=>b.toString(16).padStart(2,'0')).join('');
  }
  return result;
}
async function execute(name,input,py) {
  if(!catalog) {
    const value=await readCatalog(new URL('../',import.meta.url));
    py.globals.set('story_catalog_json',JSON.stringify(value));
    await py.runPythonAsync('import json; from inside_inference.declarations_generated import ModelCatalog; ModelCatalog.validate_shape(json.loads(story_catalog_json))');
    catalog=value;
  }
  if(name==='modelCatalog')return catalog;
  const model=catalog.models.find(m=>m.id===(input.experiment?.model_id ?? input.model_id));
  if(!model)throw Error('Unknown model');
  if(name==='loadModel') {
    loaded=null;prefix=[];
    const start=performance.now();
    const [weights,tokenizer]=await Promise.all([model.weights,model.tokenizer].map(a=>readAsset(catalog.storage,a,new URL('../',import.meta.url))));
    if(model.runtime==='llama2c-wasm') {
      // The weights and tokenizer are verified before entering upstream C code.
      if(!module)module=await (await import('./llama/llama.mjs')).default();
      const header=new Int32Array(weights.buffer,weights.byteOffset,7),a=model.architecture;
      if(JSON.stringify(Array.from(header))!==JSON.stringify([a.width,a.ffn,a.layers,a.heads,a.heads,a.vocabulary,a.context]))throw Error('Model header differs from declaration');
      module.FS.writeFile('/weights.bin',weights);module.FS.writeFile('/tokenizer.bin',tokenizer);
      if(module._load_model()!==a.vocabulary)throw Error('Runtime vocabulary mismatch');
    } else {
      py.FS.writeFile('/story-weights.bin',weights);py.FS.writeFile('/story-tokenizer.json',tokenizer);
      py.globals.set('story_model_json',JSON.stringify(model));
      await py.runPythonAsync('from inside_inference.runtimes.inspectable import load_tiny; load_tiny(story_model_json)');
    }
    const token_pieces=model.runtime==='llama2c-wasm'?Array.from({length:model.architecture.vocabulary},(_,i)=>module.UTF8ToString(module._vocab_piece(i))):JSON.parse(await py.runPythonAsync('from inside_inference.runtimes.inspectable import vocabulary_json; vocabulary_json()'));
    loaded=model;
    const parameters=model.runtime==='naive-python'?JSON.parse(await py.runPythonAsync('from inside_inference.runtimes.inspectable import parameters_json; parameters_json()')):null;
    return {model,load_ms:performance.now()-start,token_pieces,parameters};
  }
  if(!loaded || loaded.id!==model.id)throw Error('Load the selected model first');
  if(model.runtime==='naive-python') {
    py.globals.set('story_operation',name);py.globals.set('story_input',JSON.stringify(input));
    return JSON.parse(await py.runPythonAsync('from inside_inference.runtimes.inspectable import execute_tiny; execute_tiny(story_operation, story_input)'));
  }
  if(name==='prepareGeneration') {
    const source=input.workload.requests[0].request.text;
    if(source.includes('\0'))throw Error('NUL input is not supported by the upstream tokenizer');
    // Export admits only the identity SentencePiece normalizer with these exact flags.
    const text=source.replace(/ +/g,' ').replace(/^ | $/g,'').replaceAll('▁',' ');
    const ptr=module._malloc((new TextEncoder().encode(text).length+4)*4);
    let ids;
    try {const n=module.ccall('tokenize','number',['string','number'],[text,ptr]);ids=Array.from(module.HEAP32.subarray(ptr/4,ptr/4+n));}
    finally{module._free(ptr);}
    if(ids.length>model.architecture.context)throw Error('Input exceeds model context');
    return {input,prompt_ids:ids,pieces:pieces(ids),encoding:null};
  }
  if(name!=='generateToken')throw Error('Unknown generation operation');
  const ids=[...input.prefix_ids,...input.output_ids],a=model.architecture;
  if(ids.some(id=>!Number.isInteger(id)||id<0||id>=a.vocabulary))throw Error('Token ID outside vocabulary');
  if(ids.length>a.context || input.output_ids.length>=input.generation.max_new_tokens || (input.output_ids.length && input.output_ids.some(id=>model.stop_ids.includes(id))))throw Error('Request has already finished');
  const start=performance.now();
  let same=0;while(same<ids.length && same<prefix.length && ids[same]===prefix[same])same++;
  // Cache only exact already-executed prefixes. Branches recompute from position zero.
  if(same!==prefix.length || same===ids.length)same=0;
  let pointer;
  for(let i=same;i<ids.length;i++)pointer=module._step(ids[i],i);
  prefix=ids;
  const logits=Array.from(module.HEAPF32.subarray(pointer/4,pointer/4+a.vocabulary));
  if(logits.some(x=>!Number.isFinite(x)))throw Error('Nonfinite model output');
  py.globals.set('generation_logits',JSON.stringify(logits));
  const selection=JSON.parse(await py.runPythonAsync('from inside_inference.generation import select_greedy; json.dumps(select_greedy(json.loads(generation_logits)))'));
  const {probabilities,selected_id:selected}=selection;
  const output=[...input.output_ids,selected],sequence=[...input.prefix_ids,...output];
  const stop=model.stop_ids.includes(selected)?'end_token':output.length>=input.generation.max_new_tokens?'output_budget':sequence.length>a.context?'context_capacity':null;
  return {model_id:model.id,weights_sha256:model.weights.sha256,tokenizer_sha256:model.tokenizer.sha256,
    sequence_ids:sequence,output_ids:output,text:decode(output,input.prefix_ids.at(-1)),pieces:pieces(sequence),logits,probabilities,selected_id:selected,stop_reason:stop,compute_ms:performance.now()-start,nodes:[],decoding_note:null};
}
function bytes(previous,id) {
  if(id===1||id===2)return new Uint8Array();
  if(id===0)return new TextEncoder().encode(' ⁇ ');
  const ptr=module._piece(previous,id);
  let length=0;while(module.HEAPU8[ptr+length])length++;
  // run.c maps raw-byte tokens to one-byte strings; ID3 is byte zero.
  if(id===3)length=1;
  return module.HEAPU8.slice(ptr,ptr+length);
}
function decode(ids,previous) {
  const chunks=ids.map((id,i)=>bytes(i?ids[i-1]:previous,id));
  const all=new Uint8Array(chunks.reduce((n,c)=>n+c.length,0));let offset=0;
  for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length;}
  return new TextDecoder().decode(all);
}
function pieces(ids) {
  return ids.map(id=>module.UTF8ToString(module._vocab_piece(id)));
}
