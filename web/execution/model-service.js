/* One execution loop over one decoder; artifact formats affect loading/tokenization only. */
import {installComponentEngine} from './component-engine.js';
import {resolveExecution} from './controls.js';
import {readAsset,readCatalog} from './model-storage.js';
import {Decoder,loadWeights,finishSelection} from './decoder.js';
import {observations} from './observations.js';
let loaded=null,module=null,decoder=null,catalog=null,checkpoint=null;
export function handlesModelOperation(name){return ['modelCatalog','loadModel','prepareGeneration','generateToken','simulateResources'].includes(name);}
export async function executeModelOperation(name,input,py){
  const result=await execute(name,input,py);
  if(name==='generateToken'){
    result.request=input;
    result.contract_sha256=py.runPython('from inside_inference.declarations_generated import CONTRACT_SHA256; CONTRACT_SHA256');
    const raw=new TextEncoder().encode(JSON.stringify([result.contract_sha256,result.weights_sha256,result.tokenizer_sha256,input]));
    result.id=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),b=>b.toString(16).padStart(2,'0')).join('');
    const old=`prediction-${input.output_ids.length}/`;
    for(const node of result.nodes){node.id=node.id.replace(old,result.id+'/');node.run_id=result.id;node.inputs=node.inputs.map(id=>id.startsWith(old)?id.replace(old,result.id+'/'):id);}
  }
  return result;
}
async function tiny(py,expression,values={}) {
  for(const [key,value] of Object.entries(values))py.globals.set(key,value);
  return JSON.parse(await py.runPythonAsync('from inside_inference.runtimes import tokenization; '+expression));
}
async function execute(name,input,py){
  if(!catalog){
    const value=await readCatalog(new URL('../',import.meta.url));
    py.globals.set('story_catalog_json',JSON.stringify(value));
    await py.runPythonAsync('import json; from inside_inference.declarations_generated import ModelCatalog; ModelCatalog.validate_shape(json.loads(story_catalog_json))');catalog=value;
  }
  if(name==='modelCatalog')return catalog;
  const controls=input.execution?resolveExecution(input.execution):null;
  const model=catalog.models.find(m=>m.id===(controls?.model_id??input.model_id));
  if(!model)throw Error('Unknown model');
  if(name==='loadModel'){
    loaded=null;decoder=null;const start=performance.now();
    const [weights,tokenizer]=await Promise.all([model.weights,model.tokenizer].map(a=>readAsset(catalog.storage,a,new URL('../',import.meta.url))));
    if(!module)module=await (await import('./llama/llama.mjs')).default();
    checkpoint=null;let token_pieces;
    if(model.tokenizer_format==='word-hex-manifest'){
      py.FS.writeFile('/story-weights.bin',weights);py.FS.writeFile('/story-tokenizer.json',tokenizer);
      checkpoint=await tiny(py,'tokenization.load(story_model_json)',{story_model_json:JSON.stringify(model)});
      token_pieces=await tiny(py,'tokenization.pieces(story_ids)',{story_ids:JSON.stringify(Array.from({length:model.architecture.vocabulary},(_,i)=>i))});
    }else{
      module.FS.writeFile('/tokenizer.bin',tokenizer);module._load_tokenizer(model.architecture.vocabulary);
      token_pieces=Array.from({length:model.architecture.vocabulary},(_,i)=>module.UTF8ToString(module._vocab_piece(i)));
    }
    const parameters=loadWeights(module,model,weights,checkpoint);
    loaded=model;decoder=new Decoder(module,model);
    return {model,load_ms:performance.now()-start,token_pieces,parameters};
  }
  if(!loaded||loaded.id!==model.id)throw Error('Load the selected model first');
  if(name==='simulateResources'){
    if(!controls.resources)throw Error('Configure a KV residency experiment first');
    if(!checkpoint)throw Error('Resource simulation currently requires the 8K state format; select 8K explicitly');
    if(!controls.kv_reuse)throw Error('KV residency simulation requires KV reuse');
    await installComponentEngine();
    py.globals.set('resource_spec',JSON.stringify({system:controls.resources,workload:input.workload}));
    py.globals.set('resource_checkpoint',JSON.stringify(checkpoint));
    const run=JSON.parse(await py.runPythonAsync('from inside_inference.cache_lab import run_cache_experiment; from inside_inference.declarations_generated import KVResidencySystemConfig, LAB_BINDINGS; spec=json.loads(resource_spec); spec["system"]={**KVResidencySystemConfig().to_dict(), **spec["system"]}; spec["ontology_binding"]=LAB_BINDINGS["prefix-cache"]; json.dumps(run_cache_experiment(spec, checkpoint=json.loads(resource_checkpoint)))'));
    const outputs={},decoding_notes={};
    for(const request of input.workload.requests){
      const ids=run.computations.filter(c=>c.request_id===request.request_id&&c.selection).map(c=>c.selection.selected_id).filter(id=>!model.stop_ids.includes(id));
      let note;[outputs[request.request_id],note]=await tiny(py,'tokenization.decode(story_ids, True)',{story_ids:JSON.stringify(ids)});
      if(note)decoding_notes[request.request_id]=note;
    }
    return {input,run,outputs,decoding_notes};
  }
  if(controls.resources)throw Error('Resource experiments execute through simulateResources');
  if(name==='prepareGeneration'){
    if(input.workload.requests.length!==1)throw Error('This execution supports one request');
    const source=input.workload.requests[0].request.text;let ids,encoding=null,token_pieces;
    if(model.tokenizer_format==='word-hex-manifest'){
      const result=await tiny(py,'tokenization.encode(story_text)',{story_text:source});ids=result.ids;encoding=result.encoding;
      token_pieces=await tiny(py,'tokenization.pieces(story_ids)',{story_ids:JSON.stringify(ids)});
    }else{
      if(source.includes('\0'))throw Error('NUL input is not supported by the upstream tokenizer');
      const text=source.replace(/ +/g,' ').replace(/^ | $/g,'').replaceAll('▁',' ');
      const ptr=module._malloc((new TextEncoder().encode(text).length+4)*4);
      try{const n=module.ccall('tokenize','number',['string','number'],[text,ptr]);ids=Array.from(module.HEAP32.subarray(ptr/4,ptr/4+n));}finally{module._free(ptr);}
      token_pieces=pieces(ids);
    }
    if(ids.length>model.architecture.context)throw Error('Input exceeds model context');
    decoder.prefix=[];
    return {input,prompt_ids:ids,pieces:token_pieces,encoding};
  }
  if(name!=='generateToken')throw Error('Unknown generation operation');
  const ids=[...input.prefix_ids,...input.output_ids],a=model.architecture;
  if(ids.some(id=>!Number.isInteger(id)||id<0||id>=a.vocabulary))throw Error('Token ID outside vocabulary');
  if(ids.length>a.context||input.output_ids.length>=input.generation.max_new_tokens||input.output_ids.some(id=>model.stop_ids.includes(id)))throw Error('Request has already finished');
  const start=performance.now(),run=decoder.run(ids,controls.kv_reuse),logits=run.logits;
  if(logits.some(x=>!Number.isFinite(x)))throw Error('Nonfinite model output');
  py.globals.set('generation_logits',JSON.stringify(logits));
  const {probabilities,selected_id:selected}=JSON.parse(await py.runPythonAsync('from inside_inference.generation import select_greedy; json.dumps(select_greedy(json.loads(generation_logits)))'));
  const {output,sequence,stop,visible}=finishSelection(input,selected,model);
  let text,decoding_note=null,token_pieces;
  if(model.tokenizer_format==='word-hex-manifest'){
    [text,decoding_note]=await tiny(py,'tokenization.decode(story_ids, story_final)',{story_ids:JSON.stringify(visible),story_final:stop!==null});
    token_pieces=await tiny(py,'tokenization.pieces(story_ids)',{story_ids:JSON.stringify(sequence)});
  }else{text=decode(output,input.prefix_ids.at(-1));token_pieces=pieces(sequence);}
  return {model_id:model.id,weights_sha256:model.weights.sha256,tokenizer_sha256:model.tokenizer.sha256,
    sequence_ids:sequence,output_ids:output,text,pieces:token_pieces,logits,probabilities,selected_id:selected,stop_reason:stop,
    compute_ms:performance.now()-start,nodes:observations(run.captured,ids,run.work,module,model,output.length-1),decoding_note,work:run.work};
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
