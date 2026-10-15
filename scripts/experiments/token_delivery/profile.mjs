import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const [port,base,,output]=process.argv.slice(2);
const protocol=JSON.parse(await fs.readFile(new URL('../../../data/experiments/token-fast-path/protocol.json',import.meta.url),'utf8'));
const baseline=JSON.parse(await fs.readFile(new URL('../../../'+protocol.baseline,import.meta.url),'utf8'));
const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
let id=0;const pending=new Map();
socket.addEventListener('message',event=>{const m=JSON.parse(event.data),waiter=pending.get(m.id);if(waiter){pending.delete(m.id);m.error?waiter.reject(Error(JSON.stringify(m.error))):waiter.resolve(m.result);}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});
async function evaluate(expression){const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;}
async function until(expression){for(let i=0;i<300;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,50));}throw Error(`Timed out: ${expression}: ${await evaluate("document.getElementById('run-error').textContent")}`);}
const ready=()=>until("document.getElementById('binding-status')?.dataset.phase==='ready'");
const median=values=>{const a=[...values].sort((x,y)=>x-y),i=Math.floor(a.length/2);return a.length%2?a[i]:(a[i-1]+a[i])/2;};
const summary={protocol,criterion_ms:protocol.median_residual_target_ms,models:[],status:'running'};
try{
  await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{...protocol.viewport,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:base});await ready();
  summary.environment=await evaluate('({user_agent:navigator.userAgent,hardware_concurrency:navigator.hardwareConcurrency,visibility:document.visibilityState,width:innerWidth,height:innerHeight,contract:Declarations.hash})');
  assert.equal(summary.environment.visibility,'visible');
  for(const source of baseline.models){
    const trials=[],pooled=[];
    for(let trial=-protocol.warmup_runs;trial<protocol.measured_runs;trial++){
      const input=source.evidence.input,request=input.workload.requests[0].request;
      summary.active_trial={model:source.model,trial,input};
      await evaluate(`document.getElementById('edit-input').click();document.getElementById('model-choice').value=${JSON.stringify(source.model)};document.getElementById('model-choice').dispatchEvent(new Event('change'))`);await ready();
      await evaluate("document.getElementById('kv-reuse').checked=true;document.getElementById('kv-reuse').dispatchEvent(new Event('change'))");await ready();
      await evaluate(`document.getElementById('prompt').value=${JSON.stringify(request.text)};document.getElementById('prompt').dispatchEvent(new Event('input'));document.getElementById('output-budget').value=${request.generation.max_new_tokens};document.getElementById('output-budget').dispatchEvent(new Event('change'));document.getElementById('inference-form').requestSubmit()`);await ready();
      await evaluate("document.getElementById('continue-tokens').click()");
      await until(`document.getElementById('timing-count').textContent==='${request.generation.max_new_tokens}'`);
      const evidence=await evaluate(`(async()=>{const original=URL.createObjectURL;let data;URL.createObjectURL=blob=>{data=blob.text();return original(blob);};try{document.getElementById('download-run').click();return JSON.parse(await data);}finally{URL.createObjectURL=original;}})()`);
      const final_output={output_ids:evidence.prediction.output_ids,text:evidence.prediction.text,stop_reason:evidence.prediction.stop_reason};delete evidence.prediction;
      const file=`${source.model}-${trial<0?'warmup':'trial-'+trial}.json`;
      await fs.writeFile(output+'/'+file,JSON.stringify({warmup:trial<0,evidence,final_output},null,2)+'\n');
      assert.deepEqual(final_output,source.final_output);assert.equal(evidence.timing.samples.length,request.generation.max_new_tokens);
      const samples=evidence.timing.samples,overhead=samples.slice(1).map((s,i)=>s.updated_ms-samples[i].updated_ms-s.decoder_ms);
      for(const s of samples.slice(1)){assert.equal(s.work.processed_positions,1);assert.equal(s.execution.transferred_bytes,evidence.model.architecture.vocabulary*8*2);}
      if(trial>=0){pooled.push(...overhead);trials.push({file,median_overhead_ms:median(overhead),median_interval_ms:median(samples.slice(1).map((s,i)=>s.updated_ms-samples[i].updated_ms)),median_decoder_ms:median(samples.slice(1).map(s=>s.decoder_ms))});}
    }
    const sorted=pooled.sort((a,b)=>a-b),measured=median(sorted);
    summary.models.push({model:source.model,trials,median_overhead_ms:measured,p90_overhead_ms:sorted[Math.ceil(.9*sorted.length)-1],target_met:measured<summary.criterion_ms});
  }
  delete summary.active_trial;summary.status='completed';summary.target_met=summary.models.every(m=>m.target_met);
}catch(error){summary.status='failed';summary.error=String(error);
  try{summary.partial=await evaluate("({prediction:document.getElementById('run-identity').textContent,error:document.getElementById('run-error').textContent,rows:document.getElementById('timing-samples').textContent})");}catch{}throw error;}
finally{await fs.writeFile(output+'/summary.json',JSON.stringify(summary,null,2)+'\n');socket.close();}
