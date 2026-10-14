import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const [port,origin,release,output]=process.argv.slice(2);
const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
let counter=0;const pending=new Map(),errors=[];
socket.addEventListener('message',event=>{
  const data=JSON.parse(event.data);
  if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails);
  if(pending.has(data.id)){const {resolve,reject}=pending.get(data.id);pending.delete(data.id);data.error?reject(Error(JSON.stringify(data.error))):resolve(data.result);}
});
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++counter;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function ready(){
  for(let i=0;i<600;i++){
    const phase=await evaluate("document.getElementById('binding-status')?.dataset.phase");
    if(phase==='failed')throw Error(await evaluate("document.getElementById('binding-status').textContent"));
    if(phase==='ready')return;
    await new Promise(r=>setTimeout(r,100));
  }
  throw Error('Hosted worker startup timed out');
}
const comparable=result=>{const value=structuredClone(result);delete value.compute_ms;return value;};
const report={loads:[],models:[]};
try{
  await send('Page.enable');await send('Runtime.enable');
  for(const mode of ['fresh','warm']){
    const start=performance.now();await send('Page.navigate',{url:origin+'/'});await ready();
    assert.equal(await evaluate('location.pathname'),'/');
    report.loads.push({mode,ready_ms:performance.now()-start});
    await evaluate("document.getElementById('next-token').click()");await ready();
    const actual=await evaluate("JSON.parse(document.getElementById('run-identity').textContent)");
    assert.equal(actual.model_id,'tinyllm-4m');assert.equal(actual.output_ids.length,1);
    const repeated=await evaluate(`Execution.generateToken(${JSON.stringify(actual.request)})`);
    assert.deepEqual(comparable(actual),comparable(repeated));
  }
  const fixture=JSON.parse(await readFile(new URL('../../../tests/fixtures/integration/tiny-covered.json',import.meta.url),'utf8'));
  await evaluate("document.getElementById('edit-input').click();document.getElementById('model-choice').value='tinyllm-8k';document.getElementById('model-choice').dispatchEvent(new Event('change'))");await ready();
  const input=await evaluate("JSON.parse(document.getElementById('inference-data').textContent)");
  input.execution.experiments.find(x=>x.control==='model').value='tinyllm-8k';
  const request={execution:input.execution,prefix_ids:fixture.prefix,output_ids:fixture.output.slice(0,23),generation:{...input.workload.requests[0].request.generation,max_new_tokens:32}};
  const prediction=await evaluate(`Execution.generateToken(${JSON.stringify(request)})`);
  assert.equal(prediction.selected_id,fixture.output[23]);
  prediction.logits.forEach((v,i)=>assert.ok(Math.abs(v-fixture.logits_at_selection_24[i])<1e-12));
  assert.ok(prediction.nodes.length>0);
  await evaluate("document.getElementById('inference-form').requestSubmit()");await ready();
  await evaluate("document.getElementById('next-token').click()");await ready();
  report.models=['tinyllm-4m interactive/headless parity','tinyllm-8k independent logits and UI execution'];
  assert.equal(await evaluate("document.getElementById('timing-step').hidden"),false);
  await evaluate("document.getElementById('edit-input').click();document.getElementById('prompt').value='the dog had a';document.getElementById('prompt').dispatchEvent(new Event('input'));document.getElementById('output-budget').value=8;document.getElementById('output-budget').dispatchEvent(new Event('change'));document.getElementById('inference-form').requestSubmit()");await ready();
  await evaluate("document.getElementById('continue-tokens').click()");await ready();
  const count=await evaluate("Number(document.getElementById('timing-count').textContent)");
  assert.equal(count,8);
  assert.equal(await evaluate("document.querySelectorAll('#latency-chart circle').length"),count-1);
  assert.match(await evaluate("document.getElementById('timing-ttft').textContent"),/\d.* ms$/);
  assert.ok(await evaluate("document.getElementById('latency-chart').getBoundingClientRect().height>100"));
  report.timing={generated_tokens:count,intervals:count-1};
  for(const [label,width,height] of [['desktop',1280,1000],['narrow',390,844]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
    assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
    await evaluate("document.getElementById('data-plane').scrollIntoView({block:'start'})");
    await writeFile(output+'/'+label+'.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  }
  const assetURL=await evaluate("document.querySelector('script[src*=client]').src");
  assert.match(new URL(assetURL).pathname,/^\/assets\/[0-9a-f]{64}\/execution\/client.generated.js$/);
  assert.equal(await evaluate("Array.from(document.querySelectorAll('a')).some(a=>/ontology|declarations/i.test(a.textContent+' '+a.getAttribute('href')))"),false);
  await send('Page.navigate',{url:origin+'/'});await ready();
  assert.equal(await evaluate('location.pathname'),'/');
  assert.equal(await evaluate("document.querySelector('script[src*=client]').src"),assetURL);
  report.routes=['/'];report.asset_url=assetURL;
  assert.deepEqual(errors,[]);
  report.passed=true;await writeFile(output+'/browser.json',JSON.stringify(report,null,2));
}finally{socket.close();}
