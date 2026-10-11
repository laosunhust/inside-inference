import assert from 'node:assert/strict';
import {checkJourney,checkShortInput} from './inspection_browser_check.mjs';
import {checkInspection} from './inspection_browser_check.mjs';
import {checkCache} from './cache_browser_check.mjs';
import {writeFile,readFile,rm,rename} from 'node:fs/promises';
const [port, base, file, output] = process.argv.slice(2);
const references=JSON.parse(await readFile(output+'/references.json','utf8'));
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
function send(method, params = {}) {
  const id = ++counter;
  return new Promise((resolve, reject) => { pending.set(id, {resolve, reject}); socket.send(JSON.stringify({id, method, params})); });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {expression, returnByValue:true, awaitPromise:true});
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function until(expression) {
  for (let i=0; i<100; i++) { if (await evaluate(expression)) return; await new Promise(r=>setTimeout(r,100)); }
  throw new Error(`Timed out: ${expression}`);
}
const click = id => evaluate(`document.getElementById(${JSON.stringify(id)}).click()`);
try {
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  const requests=[];
  socket.addEventListener('message',event=>{
    const data=JSON.parse(event.data);
    if(data.method==='Network.requestWillBeSent')requests.push(data.params.request);
  });
  await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:output});
  await send('Emulation.setDeviceMetricsOverride', {width:1280,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate', {url:base+'/index.html'});
  await until(`document.getElementById('execute') && !document.getElementById('execute').disabled`);
  assert.equal(await evaluate(`document.querySelector('.play-heading').textContent.trim()`), 'What happens if you change this?');
  assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('.configuration-card > strong'), b=>b.textContent.trim())`), ['Input','Inference system','Output']);
  assert.equal(await evaluate(`Array.from(document.querySelectorAll('.configuration-card'), b => Boolean(b.querySelector('small')?.textContent.trim())).filter(Boolean).length`), 3, 'Each configuration card needs a brief explanation');
  assert.equal(await evaluate(`document.querySelector('#run-outcome, #control-plane > .panel-heading, #data-plane > .panel-heading')`), null);
  assert.equal(await evaluate(`document.getElementById('binding-status').hidden`), true);
  assert.equal(await evaluate(`document.getElementById('binding-status').textContent`), '');
  const prepared=await evaluate(`JSON.parse(document.getElementById('inference-data').textContent)`);
  const noExecution=async()=>{
    assert.equal(await evaluate(`document.getElementById('response-preview').textContent`),'');
    assert.equal(await evaluate(`document.querySelectorAll('#computation-path li').length`),0);
    assert.equal(await evaluate(`document.getElementById('token-journey').disabled && document.getElementById('download-run').disabled`),true);
    assert.equal(await evaluate(`document.getElementById('run-identity').textContent`),'');
  };
  await noExecution();
  assert.equal(await evaluate(`document.getElementById('client-boundary').contains(document.getElementById('reset'))`),true);
  assert.ok(!prepared.receipt && !prepared.output_ids && !prepared.passes);
  for(const key of ['input','system','client']) {
    await click('open-'+key);
    assert.ok(await evaluate(`document.getElementById('${key}-dialog').open`));
    await evaluate(`document.querySelector('#${key}-dialog .dialog-close').click()`);
    assert.ok(await evaluate(`!document.getElementById('${key}-dialog').open && document.activeElement.id==='open-${key}'`));
  }
  assert.ok(await evaluate(`document.querySelectorAll('#unavailable-system button:disabled').length>0`));
  const download=async name=>{
    const path=output+'/inference-run.json';await rm(path,{force:true});await click('download-run');
    let source;
    for(let i=0;i<100;i++){try{const candidate=await readFile(path,'utf8');JSON.parse(candidate);source=candidate;break;}catch{await new Promise(r=>setTimeout(r,50));}}
    assert.ok(source,'Step export missing');await writeFile(output+'/'+name,source);return JSON.parse(source);
  };
  const next=async()=>{
    await click('next-token');await until(`document.getElementById('binding-status').dataset.phase==='ready'`);
  };
  const apply=async request=>{
    if(await evaluate(`document.getElementById('inference-form').hidden`))await click('edit-input');
    await evaluate(`document.getElementById('prompt').value=${JSON.stringify(request.text)};document.getElementById('prompt').dispatchEvent(new Event('input'));document.getElementById('output-budget').value=${request.generation.max_new_tokens};document.getElementById('output-budget').dispatchEvent(new Event('change'));document.getElementById('inference-form').requestSubmit()`);
    await until(`document.getElementById('binding-status').dataset.phase==='ready'`);
    assert.equal(await evaluate(`document.getElementById('inference-form').hidden`),true);
    await noExecution();
    assert.equal(await evaluate(`document.getElementById('request-preview').textContent`),request.text);
  };
  // Compare every numerical field, ignoring only the distinct execution/request identities.
  const numerical=pass=>{
    const copy=structuredClone(pass), index=new Map(copy.nodes.map((n,i)=>[n.id,i]));
    for(const node of copy.nodes) {
      node.inputs=node.inputs.map(id=>index.has(id)?index.get(id):id);
      delete node.id;delete node.run_id;delete node.request_id;
    }
    delete copy.id;delete copy.run_id;delete copy.request_id;return copy;
  };
  for(const fixture of references) {
    fixture.record=await evaluate(`Execution.run(${JSON.stringify(fixture.workload)}).then(receipt=>EvidenceClient.restore(receipt))`);
    const request=fixture.workload.requests[0].request, trace=fixture.record.traces[0];
    await apply(request);
    assert.equal(await evaluate(`document.querySelectorAll('#sequence-strip button').length`),trace.tokenizer.ids.length);
    for(const [i,pass] of trace.passes.entries()) {
      await next();
      const exported=await download(fixture.id+'.browser.json');
      assert.deepEqual(numerical(exported.computation),numerical(pass),'Step computation differs from full headless run');
      assert.deepEqual(exported.sequence_ids,[...pass.input_ids,pass.selection.selected_id]);
      assert.equal(await evaluate(`document.getElementById('response-preview').textContent`),pass.display_so_far);
      assert.equal(await evaluate(`document.getElementById('response-preview').children.length`),0);
      assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('#sequence-strip button small'),n=>Number(n.textContent.split('#')[1]))`),exported.sequence_ids);
      if(i===trace.passes.length-1) {
        const raw=await readFile(output+'/'+fixture.id+'.browser.json','utf8');
        const replayed=await evaluate(`Execution.replayTokenStep(${JSON.stringify({record_json:raw})})`);
        assert.deepEqual(replayed,exported,'Export must replay in its browser runtime');
      }
      if(i===0 || i===trace.passes.length-1)await checkInspection(evaluate,exported);
      if(fixture===references[0] && i===0)await checkJourney({send,evaluate,until,click},exported);
    }
    assert.equal(await evaluate(`document.getElementById('next-token').disabled`),true);
    await click('reset');await noExecution();
    assert.equal(await evaluate(`document.getElementById('request-preview').textContent`),request.text);
    assert.equal(await evaluate(`document.getElementById('next-token').disabled`),false);
  }
  // Configuration is preview-only; no execution silently uses a different mechanism.
  await next();
  const identityBefore=await evaluate(`document.getElementById('run-identity').textContent`);
  await evaluate(`document.getElementById('configure-system-attention-mechanism').value='kda';document.getElementById('configure-system-attention-mechanism').dispatchEvent(new Event('change'))`);
  assert.ok(await evaluate(`document.querySelector('#inspect-layers').parentElement.classList.contains('configuration-changed') && document.getElementById('next-token').disabled`));
  assert.equal(await evaluate(`document.getElementById('run-identity').textContent`),identityBefore);
  await click('reset');await noExecution();
  assert.equal(await evaluate(`document.getElementById('configure-system-attention-mechanism').value`),'kda');
  await evaluate(`document.getElementById('configure-system-attention-mechanism').selectedIndex=0;document.getElementById('configure-system-attention-mechanism').dispatchEvent(new Event('change'))`);
  await checkShortInput({evaluate,until,click});
  await apply({text:'cat '.repeat(62),generation:{max_new_tokens:1}});
  await next();await click('inspect-layers');
  assert.equal(await evaluate(`document.querySelectorAll('.heat-cell').length`),128**2);
  await click('edit-input');
  await evaluate(`document.getElementById('prompt').value='cat '.repeat(200);document.getElementById('prompt').dispatchEvent(new Event('input'));document.getElementById('inference-form').requestSubmit()`);
  await until(`!document.getElementById('run-error').hidden`);
  await noExecution();
  assert.ok(await evaluate(`!document.getElementById('inference-form').hidden && document.getElementById('next-token').disabled`));
  await send('Page.navigate',{url:base+'/index.html'});
  await until(`document.getElementById('next-token') && !document.getElementById('next-token').disabled`);
  let prior=[];
  for(const name of ['first','continue','branch']) {
    const position=name==='branch'?2:prepared.tokenizer.ids.length-1;
    if(name!=='continue')await evaluate(`document.querySelectorAll('#sequence-strip button')[${position}].click()`);
    const spec=await evaluate(`(()=>{
      const prepared=JSON.parse(document.getElementById('inference-data').textContent);
      return {checkpoint_sha256:prepared.declaration.model.checkpoint_sha256,
        prefix_ids:prepared.tokenizer.ids.slice(0,${position+1}),output_ids:[],
        generation:prepared.declaration.workload.requests[0].request.generation,
        ontology_binding:prepared.declaration.ontology_binding};
    })()`);
    if(name==='continue')spec.output_ids=prior;
    const expected=await evaluate(`Execution.tokenStep(${JSON.stringify(spec)}).then(receipt=>EvidenceClient.restore(receipt))`);
    await next();
    const exported=await download(name+'.step-browser.json');
    assert.deepEqual(exported,expected,'Branch differs from headless worker operation');
    prior=exported.output_ids;
    await checkInspection(evaluate,exported);
  }
  await click('token-journey');await click('reset');await noExecution();
  await new Promise(r=>setTimeout(r,700));
  assert.equal(await evaluate(`document.getElementById('token-journey').getAttribute('aria-pressed')`),'false');
  assert.equal(await evaluate(`document.querySelectorAll('#computation-path .selected-object').length`),0);
  await send('Page.navigate',{url:file+'/index.html'});
  await until(`document.getElementById('binding-status')?.dataset.phase==='offline'`);
  await noExecution();
  assert.ok(await evaluate(`['execute','prompt','output-budget','next-token'].every(id=>document.getElementById(id).disabled)`));
  await click('output-details');
  assert.equal(await evaluate(`document.querySelectorAll('#sequence-strip button').length`),prepared.tokenizer.ids.length);
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`));
  let shot=await send('Page.captureScreenshot',{format:'png'});
  await writeFile(output+'/mobile.png',Buffer.from(shot.data,'base64'));
  await checkCache({send,evaluate,until,click,base,file,output});
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
  await writeFile(output+'/browser-checks.json',JSON.stringify({passed:true,checks:['idle preparation without inference','apply/reset clear evidence','per-token parity with complete headless runs','step exports and branching in the same browser runtime','replay cancellation','configuration preview blocks execution','explicit overflow','offline preparation','mobile layout','cache/KDA/request-cost parity']},null,2));
  console.log('Browser checks passed; screenshots and evidence: '+output);
} finally { socket.close(); }
