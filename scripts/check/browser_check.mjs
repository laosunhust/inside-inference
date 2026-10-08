import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
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
  const initial = await evaluate(`JSON.parse(document.getElementById('inference-data').textContent)`);
  assert.equal(await evaluate(`document.querySelectorAll('#event-stream li').length`),initial.events.length);
  const firstDelivery=initial.events.filter(e=>e.payload.kind==='token-delivered' && e.payload.work_id===initial.traces[0].passes[0].id).map(e=>e.payload.display_delta).join('');
  assert.equal(await evaluate(`document.getElementById('response-preview').textContent`),firstDelivery);
  assert.ok(await evaluate(`document.getElementById('workload-summary').textContent.includes('execution order only')`));
  assert.equal(await evaluate(`document.querySelectorAll('#sequence-strip button').length`), initial.traces[0].passes[0].input_ids.length);
  for (const id of ['request','system','tokenizer','embedding','layers','projection','selection','detokenizer']) {
    await click('inspect-'+id);
    assert.ok(await evaluate(`document.getElementById('detail-body').textContent.length > 30`));
  }
  await click('inspect-layers');
  await evaluate(`document.getElementById('tensor-choice').value='attention'; document.getElementById('tensor-choice').dispatchEvent(new Event('change'))`);
  assert.equal(await evaluate(`document.querySelectorAll('.heat-cell').length`), initial.traces[0].passes[0].input_ids.length**2);
  await evaluate(`document.querySelector('#sequence-strip button').click()`);
  assert.ok(await evaluate(`document.getElementById('detail-body').textContent.includes('position 0')`));
  await click('next-pass');
  assert.equal(await evaluate(`document.querySelectorAll('#sequence-strip button').length`), initial.traces[0].passes[1].input_ids.length);
  await evaluate(`document.getElementById('numerical-inspector').scrollIntoView()`);
  let shot = await send('Page.captureScreenshot', {format:'png'});
  await writeFile(output+'/attention.png', Buffer.from(shot.data,'base64'));
  const observedNode = await evaluate(`JSON.parse(document.querySelector('#detail-body details pre').textContent)`);
  assert.deepEqual(observedNode, initial.traces[0].passes[1].nodes.find(n => n.name === 'attention'));
  await evaluate('window.scrollTo(0,0)');
  shot = await send('Page.captureScreenshot', {format:'png'});
  await writeFile(output+'/journey.png', Buffer.from(shot.data,'base64'));
  // Inspect files downloaded by the real UI; no accessor to internal session state.
  let changed;
  for(const fixture of references) {
    const request=fixture.workload.requests[0].request;
    const expected=fixture.record, outcome=expected.traces[0].outcome;
    const budget=request.generation.max_new_tokens;
    const before=await evaluate(`document.getElementById('run-identity').textContent`);
    await evaluate(`document.getElementById('prompt').value=${JSON.stringify(request.text)}; document.getElementById('prompt').dispatchEvent(new Event('input')); document.getElementById('output-budget').value=${budget}; document.getElementById('output-budget').dispatchEvent(new Event('change'))`);
    assert.equal(await evaluate(`document.getElementById('binding-status').dataset.phase`),'dirty');
    assert.equal(await evaluate(`document.getElementById('run-identity').textContent`),before);
    await evaluate(`document.getElementById('inference-form').requestSubmit(); if(!document.getElementById('output-budget').disabled) throw new Error('controls must lock while executing')`);
    await until(`document.getElementById('binding-status').dataset.phase==='ready'`);
    changed=await evaluate(`JSON.parse(document.getElementById('run-identity').textContent)`);
    assert.deepEqual(changed.declaration.workload,fixture.workload);
    assert.deepEqual(changed.outcome,outcome);
    assert.equal(await evaluate(`document.querySelectorAll('#pass-tabs button').length`),expected.traces[0].passes.length);
    assert.ok(await evaluate(`document.getElementById('run-outcome').textContent.includes('${outcome.selected_tokens} / ${budget}')`));
    await click('download-run');
    let exportedSource;
    const downloadPath=output+'/inference-'+expected.id.slice(0,12)+'.json';
    for(let attempt=0;attempt<100;attempt++) {
      try { exportedSource=await readFile(downloadPath,'utf8');break; }
      catch(error) { if(error.code!=='ENOENT') throw error;await new Promise(r=>setTimeout(r,50)); }
    }
    assert.ok(exportedSource,fixture.id+': browser did not download its run');
    const exported=JSON.parse(exportedSource);
    await writeFile(output+'/'+fixture.id+'.browser.json',exportedSource);
    assert.deepEqual(exported,expected,fixture.id+': browser export differs from headless/CLI/HTTP evidence');
    const visible=[];
    for(const [i,pass] of expected.traces[0].passes.entries()) {
      await evaluate(`document.querySelectorAll('#pass-tabs button')[${i}].click()`);
      const chips=await evaluate(`Array.from(document.querySelectorAll('#sequence-strip button small'),n=>Number(n.textContent.split('#')[1]))`);
      assert.deepEqual(chips,pass.input_ids);
      visible.push(...expected.events.filter(e=>e.payload.kind==='token-delivered' && e.payload.work_id===pass.id).map(e=>e.payload.display_delta));
      assert.equal(await evaluate(`document.getElementById('response-preview').textContent`),visible.join('') || '(control token only)');
    }
    if(fixture.id==='budget-8') {
      await evaluate('window.scrollTo(0,0)');
      shot=await send('Page.captureScreenshot',{format:'png'});
      await writeFile(output+'/budget-8.png',Buffer.from(shot.data,'base64'));
    }
  }
  assert.notEqual(changed.run_id,initial.id);
  assert.equal(changed.declaration.model.checkpoint_sha256,initial.declaration.model.checkpoint_sha256);
  await click('inspect-tokenizer');
  assert.ok(await evaluate(`document.getElementById('detail-body').textContent.includes('BYTE')`));
  await evaluate(`document.getElementById('output-budget').value=1; document.getElementById('output-budget').dispatchEvent(new Event('change')); document.getElementById('prompt').value='cat '.repeat(62); document.getElementById('prompt').dispatchEvent(new Event('input')); document.getElementById('inference-form').requestSubmit()`);
  await until(`document.getElementById('binding-status').dataset.phase==='ready'`);
  assert.equal(await evaluate(`document.querySelectorAll('#sequence-strip button').length`), 128);
  await click('inspect-layers');
  assert.equal(await evaluate(`document.querySelectorAll('.heat-cell').length`), 128**2);
  const boundaryID = await evaluate(`JSON.parse(document.getElementById('run-identity').textContent).run_id`);
  await evaluate(`document.getElementById('prompt').value='cat '.repeat(200); document.getElementById('prompt').dispatchEvent(new Event('input')); document.getElementById('inference-form').requestSubmit()`);
  await until(`!document.getElementById('run-error').hidden`);
  assert.equal(await evaluate(`JSON.parse(document.getElementById('run-identity').textContent).run_id`), boundaryID);
  await send('Page.navigate', {url:file+'/index.html'});
  await until(`document.getElementById('binding-status')?.dataset.phase==='offline'`);
  assert.ok(await evaluate(`['execute','prompt','output-budget'].every(id=>document.getElementById(id).disabled)`));
  await click('inspect-selection');
  assert.equal(await evaluate(`document.querySelectorAll('#detail-body tr').length`), 385);
  await send('Emulation.setDeviceMetricsOverride', {width:390,height:844,deviceScaleFactor:1,mobile:true});
  await evaluate('window.scrollTo(0,0)');
  assert.ok(await evaluate(`document.documentElement.scrollWidth <= window.innerWidth`), 'mobile overflow');
  shot = await send('Page.captureScreenshot', {format:'png'});
  await writeFile(output+'/mobile.png', Buffer.from(shot.data,'base64'));
  assert.deepEqual(errors, []);
  await writeFile(output+'/browser-checks.json', JSON.stringify({passed:true, initial_run:initial.id, changed_run:changed.run_id, checks:['complete headless/CLI/HTTP/browser record parity','per-pass delivered text and token IDs','draft/applied separation','budgets 1/2/3/8','early stop explanation','in-flight edit lock','live execution','offline inspection','three zoom levels','token positions','attention values','prefill/decode','384-logit inspection','same-checkpoint intervention','trace-to-render equality','128-position attention','fallback trace','explicit overflow','mobile layout','no runtime exceptions']}, null, 2));
  console.log('Browser checks passed; screenshots and evidence: '+output);
} finally { socket.close(); }
