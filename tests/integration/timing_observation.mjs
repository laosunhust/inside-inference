import assert from 'node:assert/strict';
import {createTiming,timingMetrics} from '../../web/inspection/performance/observations.js';
const execution={python:{operation_validation_ms:0,operation_ms:2},worker_wait_ms:0,python_bridge_ms:2,client_validation_ms:0,round_trip_ms:2,buffer_conversion_ms:0,transferred_bytes:10};
const timing=createTiming(),prediction=n=>({id:String(n).padStart(64,'0'),output_ids:Array(n).fill(1),request:{prefix_ids:[0],output_ids:Array(n-1).fill(1)},selected_id:1,stop_reason:null,work:{processed_positions:1,reused_positions:n-1,matmul_flops:2},speculation:null,decoder_ms:1,service_ms:2});
const record=(prediction,updated,publishes)=>timing.record(prediction,updated,publishes,updated-1,updated-.5,execution);
timing.begin('continuous',100,false);record(prediction(1),140,false);
assert.equal(timingMetrics(timing.evidence()).ttft,null,'No visible text is not TTFT');
record(prediction(2),155,true);record(prediction(3),190,true);
assert.deepEqual(timingMetrics(timing.evidence()),{ttft:55,step:null,intervals:[{token:2,ms:15,segment:1},{token:3,ms:35,segment:1}]});
timing.begin('continuous',900,true);record(prediction(4),930,true);record(prediction(5),980,true);record(prediction(6),990,true);
assert.deepEqual(timingMetrics(timing.evidence()).intervals.map(p=>p.ms),[15,35,50,10],'Chronological intervals, without the stop/resume pause');
timing.begin('manual',5000,true);record(prediction(7),5012,true);
assert.equal(timingMetrics(timing.evidence()).step,12);assert.equal(timingMetrics(timing.evidence()).intervals.length,4);
const preserved=timing.evidence();preserved.samples.length=0;assert.equal(timing.evidence().samples.length,7);
timing.begin('manual',6000,false);record(prediction(1),6010,true);
assert.deepEqual(timingMetrics(timing.evidence()),{ttft:null,step:10,intervals:[]},'Branch replaces the previous trace');
timing.clear();assert.deepEqual(timingMetrics(timing.evidence()),{ttft:null,step:null,intervals:[]});
timing.begin('continuous',10,false);assert.throws(()=>record(prediction(1),9,true),/monotonic/);
Declarations.assertShape('BrowserGenerationTiming',timing.evidence());
assert.throws(()=>Declarations.assertShape('BrowserGenerationTiming',{...timing.evidence(),clock:'scenario-virtual-us'}));

// Completion lag includes deferred scheduling; synchronous observer duration does not.
timing.clear();timing.begin('continuous',100,false);timing.record(prediction(1),120,true,110,115,execution);
timing.observe(200,205);
assert.deepEqual(timing.evidence().observers,[{first_token:1,last_token:1,started_ms:200,finished_ms:205}]);
assert.equal(timing.evidence().observers[0].finished_ms-timing.evidence().samples[0].updated_ms,85);
assert.equal(timing.evidence().observers[0].finished_ms-timing.evidence().observers[0].started_ms,5);
timing.observe(300,305);assert.equal(timing.evidence().observers.length,1,'No recursive observation');
timing.record(prediction(2),320,true,310,315,execution);assert.equal(timing.evidence().observers.at(-1).last_token,1,'Unobserved updates remain absent, not zero');
assert.throws(()=>timing.observe(319,330));
timing.observe(340,345);Declarations.assertShape('BrowserGenerationTiming',timing.evidence());
const evidence=timing.evidence();evidence.samples[0].work.processed_positions=999;assert.equal(timing.evidence().samples[0].work.processed_positions,1);

const {createDispatch}=await import('../../web/inspection/performance/dispatch.js');
let clock=100,release,tokenCalls=0;
const dispatch=createDispatch({loadModel:()=>new Promise(resolve=>{release=resolve;}),generateToken:async(_request,{observe})=>{tokenCalls++;observe(execution);return prediction(1);}},()=>clock);
const prior=dispatch.invoke('loadModel',{});await Promise.resolve();
const queued=dispatch.token({},()=>true);await Promise.resolve();assert.equal(tokenCalls,0);
clock=160;release();await prior;const accepted=await queued;assert.equal(accepted.dispatched_ms,160);assert.equal(tokenCalls,1);
await assert.rejects(()=>dispatch.token({},()=>false),/canceled before dispatch/);assert.equal(tokenCalls,1);

let current=true;
const blocked=dispatch.invoke('loadModel',{});await Promise.resolve();
const canceled=dispatch.token({},()=>current);current=false;clock=200;release();await blocked;
await assert.rejects(()=>canceled,/canceled before dispatch/);assert.equal(tokenCalls,1,'No stale dispatch after waiting');

assert.equal(accepted.returned_ms,160);assert.deepEqual(accepted.execution,execution);
const missing=createDispatch({generateToken:async()=>prediction(1)},()=>0);
await assert.rejects(()=>missing.token({},()=>true),/observation missing/);
timing.clear();timing.begin('continuous',0,false);
assert.throws(()=>timing.record(prediction(1),3,true,1,4,execution),/monotonic/);
assert.throws(()=>Declarations.assertShape('BrowserExecutionTiming',{...execution,round_trip_ms:-1}));
assert.throws(()=>Declarations.assertShape('BrowserExecutionTiming',{...execution,transferred_bytes:-1}));
