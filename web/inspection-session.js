/* One request and one inspection cursor; views never own a second token sequence. */
globalThis.InspectionSession=(()=>{
  const clone=structuredClone;
  const equal=(a,b)=>a===b || !!(a&&b&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)&&Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>Object.hasOwn(b,k)&&equal(a[k],b[k])));
  const sequence=s=>s.step?.sequence_ids || s.prepared?.prompt_ids || [];
  const output=s=>s.step?.text || '';
  function create(input) {
    Declarations.assertShape('GenerationInput',input);
    return {input:clone(input),loaded:null,prepared:null,step:null,view:{run_id:null,position:0,surface:'request',observation_id:null,architecture_step:null}};
  }
  function reset(s) {
    return {...s,step:null,view:{run_id:null,position:Math.max(0,(s.prepared?.prompt_ids.length || 1)-1),surface:'request',observation_id:null,architecture_step:null}};
  }
  function select(s,id) {return reset({...s,input:{...s.input,experiment:{...s.input.experiment,model_id:id}},loaded:null,prepared:null});}
  function edit(s,workload) {
    const input={...s.input,workload:clone(workload)};Declarations.assertShape('GenerationInput',input);
    return reset({...s,input,prepared:null});
  }
  function admitModel(s,loaded) {
    if(loaded.model.id!==s.input.experiment.model_id)throw Error('Loaded model differs from selected experiment');
    return {...s,loaded};
  }
  function prepare(s,prepared) {
    if(!s.loaded || !equal(prepared.input,s.input))throw Error('Preparation differs from current experiment and workload');
    if(prepared.prompt_ids.some(i=>i>=s.loaded.model.architecture.vocabulary))throw Error('Tokenizer ID outside selected vocabulary');
    return reset({...s,prepared});
  }
  function nextRequest(s) {
    if(!s.loaded || !s.prepared)throw Error('Wait for model loading and input preparation');
    const ids=sequence(s),position=s.view.position;
    const root=s.step?.request.prefix_ids || s.prepared.prompt_ids;
    const prefix_ids=position<root.length ? ids.slice(0,position+1) : [...root];
    const output_ids=position<root.length ? [] : ids.slice(root.length,position+1);
    const request={experiment:clone(s.input.experiment),prefix_ids,output_ids,generation:clone(s.input.workload.requests[0].request.generation)};
    Declarations.assertShape('GenerationStep',request);
    if(output_ids.some(i=>s.loaded.model.stop_ids.includes(i)))throw Error('End token selected; reset or select an earlier prefix');
    if(output_ids.length>=request.generation.max_new_tokens)throw Error('Token budget reached; reset or select an earlier prefix');
    if(prefix_ids.length+output_ids.length>s.loaded.model.architecture.context)throw Error('Context full; reset or select an earlier prefix');
    return request;
  }
  function accept(s,result,request) {
    const model=s.loaded?.model;
    if(result.contract_sha256!==Declarations.hash || !model || !equal(request,nextRequest(s)) || !equal(result.request,request) || result.model_id!==model.id || result.weights_sha256!==model.weights.sha256 || result.tokenizer_sha256!==model.tokenizer.sha256)throw Error('Prediction differs from current request/model');
    const output_ids=[...request.output_ids,result.selected_id];
    const ids=[...request.prefix_ids,...output_ids];
    const winner=result.logits.reduce((best,x,i)=>x>result.logits[best]?i:best,0);
    const stop=model.stop_ids.includes(winner)?'end_token':output_ids.length>=request.generation.max_new_tokens?'output_budget':ids.length>model.architecture.context?'context_capacity':null;
    if(winner!==result.selected_id || result.logits.length!==model.architecture.vocabulary || result.probabilities.length!==model.architecture.vocabulary || !equal(ids,result.sequence_ids) || !equal(output_ids,result.output_ids) || result.stop_reason!==stop || (model.inspection!=='tensors' && result.nodes.length))throw Error('Prediction evidence violates prefix, selection or inspection boundary');
    return {...s,step:result,view:{run_id:result.id,position:ids.length-1,surface:'selection',observation_id:null,architecture_step:null}};
  }
  function inspect(s,change) {
    const view={...s.view,...change,architecture_step:change.surface==='architecture'?change.architecture_step:null};Declarations.assertShape('InspectionState',view);
    if(view.run_id!==(s.step?.id || null) || view.position>=sequence(s).length)throw Error('Inspection outside current sequence');
    if(view.observation_id!==null && !s.step?.nodes.some(n=>n.id===view.observation_id))throw Error('Observation outside current computation');
    if(view.surface==='architecture' && !architecture(s)[view.architecture_step])throw Error('Architecture step outside selected model');
    if(view.surface==='selection'&&!s.step)throw Error('No prediction to inspect');
    return {...s,view};
  }
  function architecture(s) {
    const model=s.loaded?.model;if(!model)return [];
    const recipe=Declarations.schemas.ArchitectureWalkthrough.oneOf.map(x=>x.const).find(x=>x.runtime===model.runtime);
    if(!recipe)throw Error('No declared walkthrough for selected runtime');
    Declarations.assertShape('ArchitectureWalkthrough',recipe);
    const stages=[];
    const append=(scope,layer)=>recipe.stages.filter(x=>x.scope===scope).forEach(x=>stages.push({...x,layer}));
    recipe.stages.forEach((s,i)=>{if(s.inputs.some(source=>source>=i))throw Error('Architecture edge must reference an earlier stage');});
    append('prefix',null);
    for(let layer=0;layer<model.architecture.layers;layer++)append('layer',layer);
    append('suffix',null);return stages;
  }
  function layer(s) {
    if(s.view.surface==='architecture'){const stage=architecture(s)[s.view.architecture_step];return stage?.layer ?? (stage?.scope==='suffix'?s.loaded.model.architecture.layers-1:0);}
    return s.step?.nodes.find(n=>n.id===s.view.observation_id)?.layer ?? 0;
  }
  function chooseLayer(s,index) {
    const node=s.step?.nodes.find(n=>n.layer===index);
    if(node)return {surface:'model',observation_id:node.id};
    const architecture_step=architecture(s).findIndex(n=>n.layer===index);
    if(architecture_step<0)throw Error('Unknown transformer layer');
    return {surface:'architecture',architecture_step,observation_id:null};
  }
  function journey(s) {
    const model=s.step?.nodes.length?s.step.nodes.map(n=>({surface:'model',observation_id:n.id})):
      architecture(s).map((_,i)=>({surface:'architecture',architecture_step:i,observation_id:null}));
    return [{surface:'request',observation_id:null},{surface:'system',observation_id:null},...model,
      ...(s.step?[{surface:'selection',observation_id:null},{surface:'response',observation_id:null}]:[])];
  }
  return {create,reset,select,edit,admitModel,prepare,nextRequest,accept,inspect,journey,architecture,layer,chooseLayer,sequence,output};
})();
