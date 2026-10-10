import assert from 'node:assert/strict';
import {checkInspection} from './inspection_browser_check.mjs';
import {checkCache} from './cache_browser_check.mjs';
import {writeFile,readFile,rm} from 'node:fs/promises';
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
  await send('Runtime.enable'); await send('Page.enable');
  await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:output});
  await send('Emulation.setDeviceMetricsOverride', {width:1280,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate', {url:base+'/index.html'});
  await until(`document.getElementById('execute') && !document.getElementById('execute').disabled`);
  assert.equal(await evaluate(`document.querySelector('.play-heading').textContent.trim()`), 'What happens if you change this?');
  for (const [section, ids] of [
    ['control-plane', ['open-input', 'open-system', 'open-client', 'binding-status']],
    ['data-plane', ['inference-form', 'execute', 'request-fields', 'inspect-request', 'previous-pass', 'next-pass', 'sequence-strip', 'computation-path', 'selected-token', 'inspect-response']],
    ['numerical-inspector', ['detail-body', 'run-identity', 'download-run']],
  ]) {
    for (const id of ids) assert.ok(await evaluate(`document.getElementById('${section}').contains(document.getElementById('${id}'))`));
  }
  for(const key of ['input','system','client']) {
    await click('open-'+key);
    assert.ok(await evaluate(`document.getElementById('${key}-dialog').open && document.getElementById('${key}-dialog').contains(document.activeElement)`));
    await evaluate(`document.querySelector('#${key}-dialog .dialog-close').click()`);
    assert.ok(await evaluate(`!document.getElementById('${key}-dialog').open && document.activeElement.id==='open-${key}'`));
  }
  assert.ok(await evaluate(`document.querySelectorAll('#unavailable-system button:disabled').length>0 && Array.from(document.querySelectorAll('#unavailable-system button')).every(b=>Declarations.meanings[b.dataset.concept])`));
  assert.equal(await evaluate(`Array.from(document.querySelectorAll('#unavailable-system button')).some(b=>['ExperimentSpec','InferenceResponse'].includes(b.dataset.concept))`),false);
  assert.equal(await evaluate(`document.querySelector('#inspect-system, #pass-tabs, #inspect-client, #response-status')`),null);
  assert.equal(await evaluate(`document.querySelector('.source-editor').open`),false);
  const initial = await evaluate(`JSON.parse(document.getElementById('inference-data').textContent)`);
  assert.equal(await evaluate(`document.querySelectorAll('#event-stream li').length`),initial.events.length);
  assert.equal(await evaluate(`document.getElementById('control-plane').contains(document.getElementById('prompt'))`),false);
  await evaluate(`document.getElementById('configure-input-suffix_variants').value=10;document.getElementById('configure-input-suffix_variants').dispatchEvent(new Event('change'))`);
  assert.ok(await evaluate(`document.getElementById('workload-boundary').classList.contains('configuration-changed')`));
  assert.equal(await evaluate(`document.getElementById('request-preview').textContent`),initial.declaration.workload.requests[0].request.text);
  assert.equal(await evaluate(`document.getElementById('definition-link').getAttribute('href')`),'ontology.html#Workload');
  await evaluate(`document.getElementById('configure-input-suffix_variants').value=0;document.getElementById('configure-input-suffix_variants').dispatchEvent(new Event('change'))`);
  const previewRecord=await evaluate(`document.getElementById('run-identity').textContent`);
  await evaluate(`document.getElementById('configure-system-attention-mechanism').value='kda';document.getElementById('configure-system-attention-mechanism').dispatchEvent(new Event('change'))`);
  assert.ok(await evaluate(`document.querySelector('#inspect-layers').parentElement.classList.contains('configuration-changed')`));
  assert.ok(await evaluate(`document.getElementById('configuration-detail').textContent.includes('KDA')`));
  assert.ok(await evaluate(`document.getElementById('configuration-status').textContent.includes('preview only') && !document.getElementById('execute').disabled`));
  await click('next-pass');
  assert.ok(await evaluate(`document.querySelector('#inspect-layers').parentElement.dataset.configuration==='KDA'`));
  await evaluate(`document.getElementById('configure-client-consumption').value='paused';document.getElementById('configure-client-consumption').dispatchEvent(new Event('change'))`);
  assert.ok(await evaluate(`document.getElementById('client-boundary').classList.contains('configuration-changed')`));
  assert.equal(await evaluate(`document.getElementById('definition-link').getAttribute('href')`),'ontology.html#CustomerInteraction');
  assert.ok(await evaluate(`document.getElementById('configuration-detail').textContent.includes('Paused')`));
  assert.equal(await evaluate(`document.getElementById('run-identity').textContent`),previewRecord);
  await evaluate(`for(const id of ['configure-system-attention-mechanism','configure-client-consumption']) {const field=document.getElementById(id);field.selectedIndex=0;field.dispatchEvent(new Event('change'));} document.getElementById('previous-pass').click()`);
  assert.equal(await evaluate(`document.getElementById('execute').disabled`),false);
  assert.equal(await evaluate(`document.querySelectorAll('.configuration-changed').length`),0);
  const firstDelivery=initial.events.filter(e=>e.payload.kind==='token-published' && e.payload.work_id===initial.traces[0].passes[0].id).map(e=>e.payload.display_delta).join('');
  assert.equal(await evaluate(`document.getElementById('response-preview').textContent`),firstDelivery);
  assert.equal(await evaluate(`document.getElementById('output-label').textContent`),
    initial.traces[0].checkpoint.provenance.kind==='untrained' ? 'Published output · untrained' : 'Published output');
  assert.ok(await evaluate(`document.getElementById('workload-summary').textContent.includes('execution order only')`));
  assert.equal(await evaluate(`document.querySelectorAll('#sequence-strip button').length`), initial.traces[0].passes[0].input_ids.length);
  for (const id of ['inspect-request','inspect-embedding','inspect-layers','inspect-projection','selected-token','inspect-response']) {
    await click(id);
    assert.ok(await evaluate(`document.getElementById('detail-body').textContent.length > 30`));
    assert.equal(await evaluate(`/[a-f0-9]{64}/.test(document.body.innerText)`),false,'Hashes must not appear in presentation');
  }
  await click('inspect-request');
  assert.ok(await evaluate(`document.getElementById('labs-link').hidden`));
  await click('inspect-layers');
  assert.equal(await evaluate(`document.getElementById('labs-link').hidden`),false);
  await evaluate(`document.getElementById('tensor-choice').value='attention'; document.getElementById('tensor-choice').dispatchEvent(new Event('change'))`);
  assert.equal(await evaluate(`document.querySelectorAll('.heat-cell').length`), initial.traces[0].passes[0].input_ids.length**2);
  await evaluate(`document.querySelector('#sequence-strip button').click()`);
  assert.ok(await evaluate(`document.getElementById('detail-body').textContent.includes('position 0')`));
  assert.equal(await evaluate(`JSON.parse(document.querySelector('#detail-body > details script').textContent).operation.name`),'embedding');
  assert.equal(await evaluate(`document.getElementById('inspection-context').dataset.position`),'0');
  assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('#detail-body table tr')).slice(1).map(tr=>tr.cells[1].textContent)`),initial.traces[0].passes[0].nodes.find(n=>n.operation.name==='embedding').values[0].map(v=>v.toPrecision(6)));
  await click('inspect-layers');
  await click('next-pass');
  assert.equal(await evaluate(`document.querySelectorAll('#sequence-strip button').length`), initial.traces[0].passes[1].input_ids.length);
  await evaluate(`document.getElementById('numerical-inspector').scrollIntoView()`);
  let shot = await send('Page.captureScreenshot', {format:'png'});
  await writeFile(output+'/attention.png', Buffer.from(shot.data,'base64'));
  const observedNode = await evaluate(`JSON.parse(document.querySelector('#detail-body details script').textContent)`);
  assert.deepEqual(observedNode, initial.traces[0].passes[1].nodes.find(n => n.operation.name === 'attention'));
  await checkInspection(evaluate,initial,1);
  await evaluate('window.scrollTo(0,0)');
  shot = await send('Page.captureScreenshot', {format:'png'});
  await writeFile(output+'/journey.png', Buffer.from(shot.data,'base64'));
  // Inspect files downloaded by the real UI; no accessor to internal session state.
  let changed;
  await evaluate(`document.getElementById('configure-system-attention-mechanism').value='kda';document.getElementById('configure-system-attention-mechanism').dispatchEvent(new Event('change'))`);
  for(const fixture of references) {
    await evaluate(`document.querySelector('.source-editor > summary').click()`);
    assert.ok(await evaluate(`document.querySelector('.source-editor').open`));
    const request=fixture.workload.requests[0].request;
    const expected=fixture.record, outcome=expected.traces[0].outcome;
    const budget=request.generation.max_new_tokens;
    const before=await evaluate(`document.getElementById('run-identity').textContent`);
    const cursorBefore=await evaluate(`document.getElementById('inspection-context').outerHTML`);
    await evaluate(`document.getElementById('prompt').value=${JSON.stringify(request.text)}; document.getElementById('prompt').dispatchEvent(new Event('input')); document.getElementById('output-budget').value=${budget}; document.getElementById('output-budget').dispatchEvent(new Event('change'))`);
    assert.equal(await evaluate(`document.getElementById('binding-status').dataset.phase`),'dirty');
    assert.equal(await evaluate(`document.getElementById('run-identity').textContent`),before);
    assert.equal(await evaluate(`document.getElementById('inspection-context').outerHTML`),cursorBefore);
    await evaluate(`document.getElementById('execute').click(); if(!document.getElementById('output-budget').disabled) throw new Error('controls must lock while executing')`);
    await until(`document.getElementById('binding-status').dataset.phase==='ready'`);
    assert.equal(await evaluate(`document.querySelector('.source-editor').open`),false);
    changed=await evaluate(`JSON.parse(document.getElementById('run-identity').textContent)`);
    assert.deepEqual(changed.declaration.workload,fixture.workload);
    assert.ok(await evaluate(`document.querySelector('#inspect-layers').parentElement.dataset.configuration==='KDA' && document.getElementById('configuration-status').textContent.includes('preview only')`));
    assert.deepEqual(changed.outcome,outcome);
    assert.ok(await evaluate(`document.getElementById('computation-caption').textContent.startsWith('Prediction 1 / ${expected.traces[0].passes.length}')`));
    assert.ok(await evaluate(`document.getElementById('previous-pass').disabled`));
    assert.ok(await evaluate(`document.getElementById('run-outcome').textContent.includes('${outcome.selected_tokens} / ${budget}')`));
    const downloadPath=output+'/inference-run.json';
    await rm(downloadPath,{force:true});
    await click('download-run');
    let exportedSource;
    for(let attempt=0;attempt<100;attempt++) {
      try { const candidate=await readFile(downloadPath,'utf8');JSON.parse(candidate);exportedSource=candidate;break; }
      catch(error) { if(error.code!=='ENOENT' && !(error instanceof SyntaxError)) throw error;await new Promise(r=>setTimeout(r,50)); }
    }
    assert.ok(exportedSource,fixture.id+': browser did not download its run');
    const exported=JSON.parse(exportedSource);
    await writeFile(output+'/'+fixture.id+'.browser.json',exportedSource);
    assert.deepEqual(exported,expected,fixture.id+': browser export differs from headless/CLI/HTTP evidence');
    const visible=[];
    for(const [i,pass] of expected.traces[0].passes.entries()) {
      if(i>0) await click('next-pass');
      const chips=await evaluate(`Array.from(document.querySelectorAll('#sequence-strip button small'),n=>Number(n.textContent.split('#')[1]))`);
      assert.deepEqual(chips,pass.input_ids);
      if(i===0 || i===expected.traces[0].passes.length-1) {
        await checkInspection(evaluate,expected,i);
      }
      const token=expected.traces[0].vocabulary[pass.selection.selected_id];
      const tokenLabel=token.kind==='space'?'␠':token.kind==='control'?'<'+token.piece+'>':token.piece;
      assert.equal(await evaluate(`document.getElementById('selected-token').textContent`),tokenLabel);
      visible.push(...expected.events.filter(e=>e.payload.kind==='token-published' && e.payload.work_id===pass.id).map(e=>e.payload.display_delta));
      assert.equal(await evaluate(`document.getElementById('response-preview').textContent`),visible.join('') || '—');
      assert.equal(await evaluate(`document.getElementById('response-preview').children.length`),0,'Published output must remain an unmodified text node');

    }
    if(fixture.id==='budget-8') {
      await evaluate('window.scrollTo(0,0)');
      shot=await send('Page.captureScreenshot',{format:'png'});
      await writeFile(output+'/budget-8.png',Buffer.from(shot.data,'base64'));
    }
  }
  assert.notEqual(changed.run_id,initial.id);
  assert.equal(changed.declaration.model.checkpoint_sha256,initial.declaration.model.checkpoint_sha256);
  await click('inspect-request');
  assert.ok(await evaluate(`document.getElementById('detail-body').textContent.includes('BYTE')`));
  await evaluate(`document.getElementById('output-budget').value=1; document.getElementById('output-budget').dispatchEvent(new Event('change')); document.getElementById('prompt').value='cat '.repeat(62); document.getElementById('prompt').dispatchEvent(new Event('input')); document.getElementById('inference-form').requestSubmit()`);
  await until(`document.getElementById('binding-status').dataset.phase==='ready'`);
  assert.equal(await evaluate(`document.querySelectorAll('#sequence-strip button').length`), 128);
  await click('inspect-layers');
  assert.equal(await evaluate(`document.querySelectorAll('.heat-cell').length`), 128**2);
  const boundaryID = await evaluate(`JSON.parse(document.getElementById('run-identity').textContent).run_id`);
  await evaluate(`document.querySelector('.source-editor').open=true; document.getElementById('prompt').value='cat '.repeat(200); document.getElementById('prompt').dispatchEvent(new Event('input')); document.getElementById('inference-form').requestSubmit()`);
  await until(`!document.getElementById('run-error').hidden`);
  assert.ok(await evaluate(`document.querySelector('.source-editor').open`));
  assert.equal(await evaluate(`JSON.parse(document.getElementById('run-identity').textContent).run_id`), boundaryID);
  await send('Page.navigate', {url:file+'/index.html'});
  await until(`document.getElementById('binding-status')?.dataset.phase==='offline'`);
  assert.ok(await evaluate(`['execute','prompt','output-budget'].every(id=>document.getElementById(id).disabled)`));
  await click('selected-token');
  assert.equal(await evaluate(`document.querySelectorAll('#detail-body tr').length`), 385);
  await send('Emulation.setDeviceMetricsOverride', {width:390,height:844,deviceScaleFactor:1,mobile:true});
  await evaluate('window.scrollTo(0,0)');
  assert.ok(await evaluate(`document.documentElement.scrollWidth <= window.innerWidth`), 'mobile overflow');
  shot = await send('Page.captureScreenshot', {format:'png'});
  await writeFile(output+'/mobile.png', Buffer.from(shot.data,'base64'));
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
  assert.deepEqual(errors, []);
  await writeFile(output+'/browser-checks.json', JSON.stringify({passed:true, initial_run:initial.id, changed_run:changed.run_id, checks:['complete headless/CLI/HTTP/browser record parity','per-pass delivered text and token IDs','draft/applied separation','budgets 1/2/3/8','observed budget/stop summary','in-flight edit lock','live execution','offline inspection','observation dependencies and checkpoint operands on first/last passes of every run','token positions','attention values','prefill/decode','384-logit inspection','same-checkpoint intervention','trace-to-render equality','128-position attention','fallback trace','explicit overflow','mobile layout','KDA scenario/step controls and every displayed recurrence value','all request-cost scenarios and generated rate choices','no runtime exceptions']}, null, 2));
  console.log('Browser checks passed; screenshots and evidence: '+output);
} finally { socket.close(); }
