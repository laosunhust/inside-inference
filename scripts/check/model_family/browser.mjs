import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const [port,base,out]=process.argv.slice(2);
const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let sequence=0;const calls=new Map();
ws.addEventListener('message',({data})=>{const v=JSON.parse(data);if(calls.has(v.id)){const {resolve,reject}=calls.get(v.id);calls.delete(v.id);v.error?reject(Error(JSON.stringify(v.error))):resolve(v.result);}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;calls.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const until=async expression=>{for(let i=0;i<300;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw Error('Timed out: '+expression);};
const results=[];
try {
 await send('Page.enable');
 for(const name of ['baseline','wider','deeper']){
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
  const start=performance.now();
  await send('Page.navigate',{url:`${base}/${name}/index.html`});
  await until(`document.getElementById('next-token')?.disabled===false`);
  const startupMs=performance.now()-start;
  const result=await evaluate(`(async()=>{
   const p=JSON.parse(document.getElementById('inference-data').textContent);
   const spec={checkpoint_sha256:p.declaration.model.checkpoint_sha256,prefix_ids:p.tokenizer.ids,output_ids:[],generation:p.declaration.workload.requests[0].request.generation,ontology_binding:p.declaration.ontology_binding};
   await Execution.tokenStep(spec);
   const milliseconds=[];
   for(let i=0;i<10;i++){const start=performance.now();await Execution.tokenStep(spec);milliseconds.push(performance.now()-start);}
   const sorted=[...milliseconds].sort((a,b)=>a-b);
   return {milliseconds,median_ms:(sorted[4]+sorted[5])/2,min_ms:sorted[0],max_ms:sorted[9],prefix_ids:spec.prefix_ids,architecture:p.declaration.model.architecture,user_agent:navigator.userAgent};
  })()`);
  if(results.length)assert.deepEqual(result.prefix_ids,results[0].prefix_ids);
  results.push({name,startup_ms:startupMs,...result});
  await evaluate(`document.getElementById('next-token').click()`);
  await until(`document.getElementById('binding-status').dataset.phase==='ready'`);
  for(const [view,width,height] of [['desktop',1280,1000],['mobile',390,844]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width===390});
   await evaluate(`document.querySelector('#computation-path [data-layer="${result.architecture.layers-1}"][data-operation="attention"]').click();document.querySelector('.execution-journey').scrollIntoView({block:'start'})`);
   assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),'Page overflow');
   const selected=await evaluate(`JSON.parse(document.querySelector('#detail-body > details script').textContent)`);
   assert.equal(selected.layer,result.architecture.layers-1,'Inspect final layer');
   const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(`${out}/${name}-${view}.png`,Buffer.from(shot.data,'base64'));
  }
 }
 await writeFile(out+'/timings.json',JSON.stringify({scope:'Observed local Chromium browser operation latency including trace/validation/serialization; one warmup,10 fixed-prefix samples. Sequential navigations share a browser process; startup is not a guaranteed cold-cache measurement. Not accelerator prediction.',results},null,2));
 console.log('Browser costs and per-layer screenshots captured');
}finally{ws.close();}
