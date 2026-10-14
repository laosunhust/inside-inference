import assert from 'node:assert/strict';
import {checkModels} from './story_models/check.mjs';
import {fileURLToPath} from 'node:url';
import {checkCache} from './cache_browser_check.mjs';
import {writeFile,rename,readFile} from 'node:fs/promises';
import vm from 'node:vm';
for(const name of ['contract-validators.generated.js','contract-runtime.js','declarations.generated.js'])vm.runInThisContext(await readFile(new URL('../../web/'+name,import.meta.url),'utf8'));
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
  throw new Error(`Timed out: ${expression}\n${await evaluate("document.body.innerText")}`);
}
const timings=[];let measuredAt=performance.now();
const mark=name=>{const now=performance.now();timings.push({phase:name,milliseconds:now-measuredAt});measuredAt=now;};
const click = id => evaluate(`document.getElementById(${JSON.stringify(id)}).click()`);
try {
  await send('Runtime.enable'); await send('Page.enable');
  const requests=[];
  socket.addEventListener('message',event=>{
    const data=JSON.parse(event.data);
    if(data.method==='Network.requestWillBeSent')requests.push(data.params.request);
    if(data.method==='Network.loadingFailed')console.error('Browser network failure',data.params);

  });
  // Observe worker requests at the fixture servers; attaching Network during cold
  // worker startup can abort its module/WASM downloads in Chrome.
  await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:output});
  // Measure model wall time before journey tests enable Chrome virtual time.
  await checkModels({send,evaluate,until,base,output,site:fileURLToPath(file),assetBase,requests});
  mark('model family and object storage');
  await checkCache({send,evaluate,until,click,base,file,output});
  mark('cache lab');
  // Failure is explicit; there is no native service to fall back to.
  const workerPath=fileURLToPath(file)+'/execution/worker.generated.js';
  await rename(workerPath,workerPath+'.missing');
  try {
    await send('Page.navigate',{url:base+'/?missing-worker'});
    await until(`document.getElementById('binding-status')?.dataset.phase==='failed'`);
    assert.equal(await evaluate(`document.getElementById('next-token').disabled`),true);
    assert.ok(await evaluate(`document.getElementById('run-error').textContent.length>0`));
  } finally {await rename(workerPath+'.missing',workerPath);}
  assert.ok(requests.every(request=>request.method==='GET'),'Static site must not submit computation over HTTP');
  assert.ok(requests.every(request=>!new URL(request.url).pathname.startsWith('/api/')),'No compute endpoint');
  assert.deepEqual(errors, []);
  mark('standalone labs and missing-worker failure');
  await writeFile(output+'/browser-timing.json',JSON.stringify(timings,null,2));
  await writeFile(output+'/browser-checks.json',JSON.stringify({passed:true,checks:['model selection and empty initial output','apply/reset clear evidence','selected-model headless/UI numerical parity','step exports and branching in the same browser runtime','replay cancellation','explicit overflow','mobile layout','cache/KDA parity','model-family numerical/UI parity and object storage']},null,2));
  console.log('Browser checks passed; screenshots and evidence: '+output);
} finally { socket.close(); }
