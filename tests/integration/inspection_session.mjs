import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
for(const file of ['web/contract-validators.generated.js','web/contract-runtime.js','web/declarations.generated.js','web/inspection-session.js']) vm.runInThisContext(readFileSync(file,'utf8'));
const run=JSON.parse(readFileSync(process.argv[2],'utf8'));
let state=InspectionSession.create(run);
assert.throws(()=>InspectionSession.transition(state,{type:'SUBMIT'}));
state=InspectionSession.transition(state,{type:'CONNECT'});
const changed=structuredClone(state.draft);changed.requests[0].request.generation.max_new_tokens=8;
state=InspectionSession.transition(state,{type:'EDIT',workload:changed});
assert.equal(state.phase,'dirty');assert.equal(state.run,run);
state=InspectionSession.transition(state,{type:'SUBMIT'});
changed.requests[0].request.text='mutation after submit';assert.notEqual(state.submitted.workload.requests[0].request.text,changed.requests[0].request.text);
assert.throws(()=>InspectionSession.transition(state,{type:'EDIT',workload:changed}));
assert.throws(()=>InspectionSession.transition(state,{type:'ACCEPT',run}),'stale response must fail');
state=InspectionSession.transition(state,{type:'FAIL',message:'execution failed'});
assert.equal(state.run,run);assert.equal(state.phase,'failed');assert.equal(state.draft.requests[0].request.generation.max_new_tokens,8);
state=InspectionSession.transition(state,{type:'EDIT',workload:run.declaration.workload});
state=InspectionSession.transition(state,{type:'SUBMIT'});
state=InspectionSession.transition(state,{type:'ACCEPT',run});
assert.equal(state.phase,'ready');assert.equal(state.view.run_id,run.id);
state=InspectionSession.transition(state,{type:'INSPECT',view:{prediction:1,position:0}});
assert.equal(state.view.prediction,1);assert.deepEqual(state.draft,run.declaration.workload);
assert.throws(()=>InspectionSession.transition(state,{type:'INSPECT',view:{run_id:'0'.repeat(64)}}));
assert.throws(()=>InspectionSession.transition(state,{type:'INSPECT',view:{prediction:1000}}));
for(const invalid of [true,0,1.5,'8']) {
 const bad=structuredClone(run.declaration.workload.requests[0].request);bad.generation.max_new_tokens=invalid;
 assert.throws(()=>Declarations.assertShape('InferenceRequest',bad));
}
const tooLarge=structuredClone(run.declaration);tooLarge.workload.requests[0].request.generation.max_new_tokens=9;
assert.throws(()=>Declarations.assertBound('RunBinding',tooLarge,tooLarge));
const bad=structuredClone(run);bad.traces[0].outcome.selected_tokens=8;
assert.throws(()=>InspectionSession.create(bad));
console.log('Generated browser validation and request/run transitions passed.');

const forged=structuredClone(run);
for(const event of forged.events) {
 if(event.payload.kind==='token-published') event.payload.token_ids[0]=0;
}
assert.throws(()=>InspectionSession.create(forged),/Published IDs differ/);

const selected=run.traces[0].passes[1].nodes.find(n=>n.operation.name==='attention');
state=InspectionSession.transition(state,{type:'INSPECT',view:{observation_id:selected.id}});
assert.equal(state.view.observation_id,selected.id);
assert.throws(()=>InspectionSession.transition(state,{type:'INSPECT',view:{observation_id:'foreign-observation'}}));
assert.throws(()=>InspectionSession.transition(state,{type:'INSPECT',view:{observation_id:run.traces[0].passes[0].nodes[0].id}}));
state=InspectionSession.transition(state,{type:'INSPECT',view:{prediction:0,position:0}});
assert.equal(state.view.observation_id,run.traces[0].passes[0].nodes.find(n=>n.operation.name==='attention').id);
for(const binding of [
 {primary:'Invented',related:[]},
 {primary:'PositionEncoding',related:['Invented']},
 {primary:'Attention',related:['Attention']},
 {primary:'Attention',related:['Embedding','Embedding']},
 {related:[]}
]) assert.throws(()=>Declarations.assertShape('OntologyBinding',binding));
Declarations.assertShape('OntologyBinding',{primary:'PositionEncoding',related:['Attention','Embedding']});
assert.equal(Declarations.operationOwners.position_embedding,'PositionEncoding');
assert.equal(Declarations.operationOwners.attention,'Attention');
