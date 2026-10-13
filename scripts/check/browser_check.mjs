import assert from 'node:assert/strict';
import {checkModels} from './story_models/check.mjs';
import {fileURLToPath} from 'node:url';
import {checkCache} from './cache_browser_check.mjs';
import {writeFile,rename} from 'node:fs/promises';
const [port, base, file, output, assetBase] = process.argv.slice(2);
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, {once:true}));
let counter = 0; const pending = new Map(), errors = [];
socket.addEventListener('message', event => {
  const data = JSON.parse(event.data);
  if (data.method === 'Runtime.exceptionThrown') errors.push(data.params.exceptionDetails);
  if (data.id && pending.has(data.id)) {
    const {resolve, reject} = pending.get(data.id); pending.delete(data.id);
    data.error ? reject(new Error(JSON.stringify(data.error))) : resolve(data.result);
  }
});
function send(method, params = {}, sessionId) {
  const id = ++counter;
  return new Promise((resolve, reject) => { pending.set(id, {resolve, reject}); socket.send(JSON.stringify({id, method, params, ...(sessionId?{sessionId}:{})})); });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {expression, returnByValue:true, awaitPromise:true});
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function until(expression, attempts=100) {
  for (let i=0; i<attempts; i++) { if (await evaluate(expression)) return; await new Promise(r=>setTimeout(r,100)); }
  throw new Error(`Timed out: ${expression}`);
}
const timings=[];let measuredAt=performance.now();
const mark=name=>{const now=performance.now();timings.push({phase:name,milliseconds:now-measuredAt});measuredAt=now;};
const click = id => evaluate(`document.getElementById(${JSON.stringify(id)}).click()`);
try {
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  const requests=[];
  socket.addEventListener('message',event=>{
    const data=JSON.parse(event.data);
    if(data.method==='Network.requestWillBeSent')requests.push(data.params.request);
    if(data.method==='Network.loadingFailed')console.error('Browser network failure',data.params);
    if(data.method==='Target.attachedToTarget') {
      const session=data.params.sessionId;
      (async()=>{try{await send('Network.enable',{},session);}finally{await send('Runtime.runIfWaitingForDebugger',{},session);}})().catch(e=>console.error('Worker diagnostics failed',e));
    }
  });
  await send('Target.setAutoAttach',{autoAttach:true,waitForDebuggerOnStart:true,flatten:true});
  await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:output});
  // Measure model wall time before journey tests enable Chrome virtual time.
  await checkModels({send,evaluate,until,base,output,site:fileURLToPath(file),assetBase,requests});
  mark('model family and object storage');
  await checkCache({send,evaluate,until,click,base,file,output});
  mark('cache lab');
  // The small standalone labs must also project their headless evidence exactly.
  await send('Page.navigate', {url:base+'/labs/kimi-delta-attention.html'});
  await until(`document.querySelector('#trace pre')`);
  const recurrence = await evaluate(`JSON.parse(document.getElementById('trace-data').textContent)`);
  assert.deepEqual(await evaluate(`Array.from(document.querySelector('#scenario').options,o=>o.value)`),Object.keys(recurrence));
  const formatValue = value => Array.isArray(value) ? '['+value.map(formatValue).join(Array.isArray(value[0])?',\n ':', ')+']' : Number(value.toFixed(5)).toString();
  const fields=['before','key','value','query','alpha','beta','decayed','prediction','error','delta','after','output'];
  for(const [label,events] of Object.entries(recurrence)) {
    await evaluate(`document.getElementById('scenario').value=${JSON.stringify(label)};document.getElementById('scenario').dispatchEvent(new Event('change'));`);
    assert.equal(await evaluate(`Number(document.getElementById('step').max)`),events.length-1);
    for(let i=0;i<events.length;i++) {
      await evaluate(`document.getElementById('step').value=${i};document.getElementById('step').dispatchEvent(new Event('input'));`);
      assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('#trace pre'),n=>n.textContent)`),fields.map(k=>formatValue(events[i][k])));
    }
  }
  await send('Page.navigate', {url:base+'/request-cost.html'});
  await until(`document.getElementById('finish-value')?.textContent`);
  const costRuns=await evaluate(`JSON.parse(document.getElementById('journey-data').textContent)`);
  const rates=[...new Set(Object.values(costRuns).map(r=>r.compute))].sort((a,b)=>a-b);
  assert.equal(await evaluate(`Number(document.getElementById('compute').max)`),rates.length-1);
  assert.deepEqual(await evaluate(`Array.from(document.getElementById('bandwidth').options,o=>Number(o.value))`),[...new Set(Object.values(costRuns).map(r=>r.bandwidth))].sort((a,b)=>a-b));
  for(const run of Object.values(costRuns)) {
    await evaluate(`document.getElementById('reuse').checked=${run.reuse};document.getElementById('compute').value=${rates.indexOf(run.compute)};document.getElementById('bandwidth').value=${run.bandwidth};document.getElementById('compute').dispatchEvent(new Event('input'));`);
    assert.equal(await evaluate(`document.getElementById('finish-value').textContent`),`${Number(run.end.toFixed(3))} ticks`);
    assert.equal(await evaluate(`document.querySelectorAll('#timeline button').length`),run.events.length);
    await evaluate(`document.getElementById('time').value=${run.end};document.getElementById('time').dispatchEvent(new Event('input'));`);
    assert.equal(await evaluate(`document.getElementById('output-count').textContent`),`${run.output_tokens} / ${run.output_tokens} delivered`);
  }
  mark('existing standalone labs');
  // Failure is explicit; there is no native service to fall back to.
  const workerPath=output+'/site/execution/worker.generated.js';
  await rename(workerPath,workerPath+'.missing');
  try {
    await send('Page.navigate',{url:base+'/index.html?missing-worker'});
    await until(`document.getElementById('binding-status')?.dataset.phase==='failed'`);
    assert.equal(await evaluate(`document.getElementById('next-token').disabled`),true);
    assert.ok(await evaluate(`document.getElementById('run-error').textContent.length>0`));
  } finally {await rename(workerPath+'.missing',workerPath);}
  assert.ok(requests.every(request=>request.method==='GET'),'Static site must not submit computation over HTTP');
  assert.ok(requests.every(request=>!new URL(request.url).pathname.startsWith('/api/')),'No compute endpoint');
  assert.deepEqual(errors, []);
  mark('standalone labs and missing-worker failure');
  await writeFile(output+'/browser-timing.json',JSON.stringify(timings,null,2));
  await writeFile(output+'/browser-checks.json',JSON.stringify({passed:true,checks:['model selection and empty initial output','apply/reset clear evidence','selected-model headless/UI numerical parity','step exports and branching in the same browser runtime','replay cancellation','configuration preview blocks execution','explicit overflow','mobile layout','cache/KDA/request-cost parity','model-family numerical/UI parity and object storage']},null,2));
  console.log('Browser checks passed; screenshots and evidence: '+output);
} finally { socket.close(); }
