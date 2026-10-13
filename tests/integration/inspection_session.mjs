import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
for(const file of ['contract-validators.generated.js','contract-runtime.js','declarations.generated.js'])vm.runInThisContext(readFileSync('web/'+file,'utf8'));
await import('../../web/inspection/session.js');
const {input,loaded}=JSON.parse(readFileSync(process.argv[2],'utf8')),S=InspectionSession;
let state=S.create(input);
assert.equal(S.output(state),'');assert.throws(()=>S.nextRequest(state));
state=S.admitModel(state,loaded);
const prepared={input,prompt_ids:[0,24,42],pieces:['<BOS>','.','x'],encoding:null};
state=S.prepare(state,prepared);
const stages=S.architecture(state);
assert.ok(stages.length>0);
assert.equal(stages.filter(x=>x.scope==='layer').length,loaded.model.architecture.layers*6);
state=S.inspect(state,{surface:'architecture',architecture_step:1,observation_id:null});
assert.equal(state.view.architecture_step,1);assert.equal(state.view.observation_id,null);
const layered=structuredClone(state);layered.loaded.model.architecture.layers=2;layered.step={nodes:[{id:'last-norm',layer:null,operation:{name:'ln_final'}}]};layered.view={surface:'model',observation_id:'last-norm'};assert.equal(S.layer(layered),1,'Final normalization belongs after the last block');
assert.throws(()=>S.inspect(state,{surface:'architecture',architecture_step:999,observation_id:null}));
state=S.inspect(state,{surface:'request',observation_id:null});assert.equal(state.view.architecture_step,null);
Declarations.assertShape('ArchitectureWalkthrough',Declarations.schemas.ArchitectureWalkthrough.const);
const badStage={...Declarations.schemas.ArchitectureWalkthrough.const.stages[0],owner:'Invented'};assert.throws(()=>Declarations.assertShape('ArchitectureStage',badStage));
const request=S.nextRequest(state),logits=Array(384).fill(0);logits[42]=2;
const step={contract_sha256:Declarations.hash,id:'1'.repeat(64),request,model_id:loaded.model.id,weights_sha256:loaded.model.weights.sha256,tokenizer_sha256:loaded.model.tokenizer.sha256,sequence_ids:[0,24,42,42],output_ids:[42],text:'x',pieces:['<BOS>','.','x','x'],logits,probabilities:logits.map(x=>Math.exp(x)/(383+Math.exp(2))),selected_id:42,stop_reason:null,compute_ms:0,work:{processed_positions:3,reused_positions:0,matmul_flops:0},nodes:[],decoding_note:null};
state=S.accept(state,step,request);assert.equal(S.output(state),'x');
const wrong=structuredClone(step);wrong.selected_id=0;assert.throws(()=>S.accept(S.prepare(S.admitModel(S.create(input),loaded),prepared),wrong,request));
assert.throws(()=>S.inspect(state,{surface:'model',observation_id:'foreign'}));
state=S.inspect(state,{position:1,surface:'request',observation_id:null});
assert.deepEqual(S.nextRequest(state).prefix_ids,[0,24]);assert.deepEqual(S.nextRequest(state).output_ids,[]);
state=S.reset(state);assert.equal(S.output(state),'');assert.equal(state.view.run_id,null);
const changed=S.select(state,'tinyllm-4m');assert.equal(changed.loaded,null);assert.deepEqual(changed.input.workload,input.workload);assert.throws(()=>S.accept(changed,step,request));
assert.throws(()=>S.prepare(changed,prepared));assert.throws(()=>S.admitModel(changed,loaded));
const edited=structuredClone(input.workload);edited.requests[0].request.text='new source';state=S.edit(state,edited);assert.equal(state.prepared,null);assert.throws(()=>S.prepare(state,prepared));
for(const invalid of [true,0,1.5,'8',129]){const bad=structuredClone(input);bad.workload.requests[0].request.generation.max_new_tokens=invalid;assert.throws(()=>S.create(bad));}
assert.throws(()=>Declarations.assertShape('OntologyBinding',{primary:'Invented',related:[]}));
// Structural object equality is independent of Python/JavaScript key serialization order.
const reverse=v=>Array.isArray(v)?v.map(reverse):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).reverse().map(k=>[k,reverse(v[k])])):v;
assert.deepEqual(S.prepare(S.admitModel(S.create(input),loaded),reverse(prepared)).prepared,prepared);
globalThis.document={currentScript:{src:'https://example.test/execution/client.generated.js'}};
vm.runInThisContext(readFileSync('web/execution/client.generated.js','utf8'));
const calls=[];const client=ExecutionClient.create(async(name,input)=>{calls.push({name,input});return JSON.stringify(prepared);});
assert.deepEqual(await client.prepareGeneration(input),prepared);assert.equal(calls[0].name,'prepareGeneration');
await assert.rejects(()=>client.prepareGeneration({}));assert.equal(calls.length,1);
assert.equal(client.capabilities,undefined);assert.equal(client.invented,undefined);
// Responses are validated by the harness, not by the production transport.
assert.deepEqual(await ExecutionClient.create(async()=>JSON.stringify({})).prepareGeneration(input),{});
assert.throws(()=>Declarations.assertShape('GenerationPrepared',{}));
const originalShape=Declarations.assertShape;
Declarations.assertShape=(name,value)=>{assert.notEqual(name,'GenerationPrediction','No response-schema traversal in the token path');return originalShape(name,value);};
S.accept(S.prepare(S.admitModel(S.create(input),loaded),prepared),step,request);
await ExecutionClient.create(async()=>JSON.stringify(step)).generateToken(request);
Declarations.assertShape=originalShape;
Declarations.assertShape('GenerationPrediction',step);
await assert.rejects(()=>ExecutionClient.create(async()=>{throw Error('transport failed');}).prepareGeneration(input),/transport failed/);
assert.equal(await client.prepareGeneration(input,{raw:true}),JSON.stringify(prepared));
console.log('Model-bound request, branch, stale-response and generated client checks passed.');

const {resolveExecution}=await import('../../web/execution/controls.js');
const duplicate=structuredClone(input.execution);duplicate.experiments[1]=structuredClone(duplicate.experiments[0]);
assert.throws(()=>resolveExecution(duplicate),/Conflicting/);
assert.throws(()=>resolveExecution({experiments:[]}),/requires exactly/);
const {finishSelection}=await import('../../web/execution/decoder.js');
const model={stop_ids:[1],architecture:{context:4}},base={prefix_ids:[0],output_ids:[],generation:{max_new_tokens:3}};
assert.equal(finishSelection(base,7,model).stop,null);
for(const [request,selected,reason] of [[{...base,generation:{max_new_tokens:1}},7,'output_budget'],[{...base,prefix_ids:[0,2,3,4]},7,'context_capacity'],[{...base,output_ids:[7]},1,'end_token']]){
 const result=finishSelection(request,selected,model);assert.equal(result.stop,reason);assert.deepEqual(result.output,[...request.output_ids,selected]);
 assert.deepEqual(result.visible,selected===1?request.output_ids:result.output);
}

// Every nonterminal ID, including byte/control IDs, continues until the budget.
for(let id=0;id<384;id++){
 assert.equal(finishSelection(base,id,model).stop,id===1?'end_token':null);
 const atBudget={...base,output_ids:[7,7]};
 assert.equal(finishSelection(atBudget,id,model).stop,id===1?'end_token':'output_budget');
}

const partial=structuredClone(input.execution);partial.experiments.push({control:'kv_cache',value:{}});
assert.throws(()=>resolveExecution(partial),/together/);
