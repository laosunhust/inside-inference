import assert from 'node:assert/strict';
import {readFile,writeFile,rename,access} from 'node:fs/promises';

export async function checkModels({send,evaluate,until,base,output,site,assetBase,requests=[]}) {
  const evidence={models:[],numerical:[],storage:[],tokenizer:[],screenshots:[]};
  const fixtureRoot=new URL('../../../data/preparation/story-models/',import.meta.url);
  const references=JSON.parse(await readFile(new URL('export.json',fixtureRoot),'utf8'));
  const raw=await readFile(new URL('logits.bin',fixtureRoot));
  const expectedLogits=new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));
  const catalogPath=site+'/models/catalog.json',catalogBytes=await readFile(catalogPath);
  const started=performance.now();
  const click=id=>evaluate(`document.getElementById(${JSON.stringify(id)}).click()`);
  async function ready(){await until("['ready','failed'].includes(document.getElementById('binding-status')?.dataset.phase)");assert.equal(await evaluate("document.getElementById('binding-status').dataset.phase"),'ready',await evaluate("document.getElementById('binding-status').textContent"));}
  async function navigate(){await send('Page.navigate',{url:base+'/index.html'});await ready();}
  async function choose(id){if(await evaluate("document.getElementById('inference-form').hidden"))await click('edit-input');await evaluate(`document.getElementById('model-choice').value=${JSON.stringify(id)};document.getElementById('model-choice').dispatchEvent(new Event('change'))`);await ready();}
  async function apply(text,budget=8){if(await evaluate("document.getElementById('inference-form').hidden"))await click('edit-input');await evaluate(`document.getElementById('prompt').value=${JSON.stringify(text)};document.getElementById('prompt').dispatchEvent(new Event('input'));document.getElementById('output-budget').value=${budget};document.getElementById('output-budget').dispatchEvent(new Event('change'));document.getElementById('inference-form').requestSubmit()`);await ready();assert.equal(await evaluate("document.getElementById('inference-form').hidden"),true);}
  const snapshot=()=>evaluate("JSON.parse(document.getElementById('run-identity').textContent)");
  async function empty(){assert.equal(await evaluate("document.getElementById('response-preview').textContent"),'');assert.equal(await evaluate("document.getElementById('run-identity').textContent"),'');assert.equal(await evaluate("document.querySelectorAll('#computation-path [data-observations]').length"),0);assert.equal(await evaluate("document.getElementById('download-run').disabled"),true);}
  async function rejection(expression,pattern){const message=await evaluate(`(async()=>{try{await (${expression});return null;}catch(e){return String(e);}})()`);assert.match(message||'',pattern);return message;}
  await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:output});
  const comparable=result=>{const value=structuredClone(result);delete value.compute_ms;return value;};
  try {
    await navigate();evidence.ready_ms=performance.now()-started;await empty();
    const initial=await evaluate("JSON.parse(document.getElementById('inference-data').textContent)");
    assert.equal(initial.experiment.model_id,'tinyllm-4m');
    assert.equal(await evaluate("document.getElementById('model-choice').value"),initial.experiment.model_id);
    assert.equal(await evaluate("document.getElementById('change-model')===null && document.getElementById('inference-form').contains(document.getElementById('model-choice'))"),true);
    assert.equal(await evaluate("document.getElementById('continue-tokens').textContent"),'Generate');
    assert.equal(await evaluate("document.getElementById('data-plane').contains(document.getElementById('next-token')) && document.getElementById('explanation').contains(document.getElementById('token-journey'))"),true);
    assert.ok(requests.every(r=>!r.url.endsWith('tinyllm-8k.bin')&&!r.url.endsWith('tinyllm-0.5m.bin')),'Only the initial model may auto-load');
    const catalog=await evaluate('Execution.modelCatalog()');
    assert.equal(catalog.models.length,3);
    const inputFor=(id,text)=>{const value=structuredClone(initial);value.experiment.model_id=id;value.workload.requests[0].request.text=text;value.workload.requests[0].request.generation.max_new_tokens=8;return value;};
    const requestFor=(input,ids)=>({experiment:input.experiment,prefix_ids:ids,output_ids:[],generation:input.workload.requests[0].request.generation});
    for(const model of catalog.models) {
      const m=JSON.stringify(model.id);
      const loaded=await evaluate(`Execution.loadModel({model_id:${m}})`);
      if(model.runtime==='llama2c-wasm') {
        for(const test of references.tokenizer_cases) {
          const actual=await evaluate(`Execution.prepareGeneration(${JSON.stringify(inputFor(model.id,test.text))})`);
          assert.deepEqual(actual.prompt_ids,test.ids,JSON.stringify(test.text));
        }
        evidence.tokenizer.push({model:model.id,cases:references.tokenizer_cases.length});
        for(const test of references.cases.filter(c=>c.model_id===model.id)) {
          const input=inputFor(model.id,test.prompt);
          const prepared=await evaluate(`Execution.prepareGeneration(${JSON.stringify(input)})`);
          assert.deepEqual(prepared.prompt_ids,test.ids);
          const result=await evaluate(`Execution.generateToken(${JSON.stringify(requestFor(input,test.ids))})`);
          let maxError=0,expectedChoice=0;
          const expected=expectedLogits.slice(test.logit_offset,test.logit_offset+test.logit_count);
          result.logits.forEach((v,i)=>{const error=Math.abs(v-expected[i]);maxError=Math.max(maxError,error);assert.ok(error<=.001+.001*Math.abs(expected[i]),`Logit ${i}: ${error}`);if(expected[i]>expected[expectedChoice])expectedChoice=i;});
          const peak=Math.max(...result.logits),exp=result.logits.map(x=>Math.exp(x-peak)),total=exp.reduce((a,b)=>a+b,0);
          result.probabilities.forEach((p,i)=>assert.ok(Math.abs(p-exp[i]/total)<1e-5,'Runtime softmax differs from independent calculation'));
          const ranked=Array.from(expected).sort((a,b)=>b-a),margin=ranked[0]-ranked[1];
          evidence.numerical.push({model:model.id,prompt:test.prompt,max_error:maxError,argmax_equal:result.selected_id===expectedChoice,top_two_margin:margin,near_tie:margin<=2*maxError});
          if(result.selected_id!==expectedChoice)assert.ok(margin<=2*maxError,'Unexplained token flip');
        }
      }
      const prompt=initial.workload.requests[0].request.text,input=inputFor(model.id,prompt);
      const prepared=await evaluate(`Execution.prepareGeneration(${JSON.stringify(input)})`);
      const request=requestFor(input,prepared.prompt_ids);
      let result;const times=[];
      for(let i=0;i<8;i++){result=await evaluate(`Execution.generateToken(${JSON.stringify(request)})`);request.output_ids=result.output_ids;times.push(result.compute_ms);if(result.stop_reason)break;}
      const warm=times.slice(1).sort((a,b)=>a-b),median=warm[Math.floor(warm.length/2)];assert.ok(median<500);
      await choose(model.id);await empty();await apply(prompt);
      await click('continue-tokens');await until("document.getElementById('stop-tokens').hidden && !document.getElementById('reset').disabled");
      const interactive=await snapshot();assert.deepEqual(comparable(interactive),comparable(result));
      if(model.id==='tinyllm-4m') {
        const {rm}=await import('node:fs/promises');await rm(output+'/inference-run.json',{force:true});await click('download-run');
        let exported;for(let i=0;i<100;i++){try{exported=JSON.parse(await readFile(output+'/inference-run.json','utf8'));break;}catch{await new Promise(r=>setTimeout(r,50));}}
        assert.deepEqual(exported.prediction,interactive,'Download must contain the current accepted prediction');
        assert.deepEqual(exported.input,input);assert.deepEqual(exported.model,model);
      }
      assert.equal(await evaluate("document.getElementById('response-preview').textContent"),result.text);
      assert.equal(await evaluate("document.getElementById('active-model-summary').textContent"),`${model.parameters.toLocaleString('en-US',{notation:'compact',maximumFractionDigits:0})} params · ${model.architecture.layers} ${model.architecture.layers===1?'layer':'layers'}`);
      assert.equal(await evaluate("document.querySelectorAll('#computation-path li').length>0"),true);
      assert.equal(await evaluate("document.getElementById('inspection-unavailable').hidden"),model.inspection==='tensors');
      if(model.inspection!=='tensors') {
        assert.equal(await evaluate("document.getElementById('token-journey').disabled"),false);
        const labels=await evaluate("Array.from(document.querySelectorAll('#computation-path button'),b=>b.textContent)");
        assert.equal(labels.filter(x=>x==='Attention').length,1);
        assert.equal(labels.filter(x=>x==='Feed-forward').length,1);
        assert.ok(!labels.some(x=>/RoPE|GELU|RMSNorm|SiLU|reuse|L[1-9]/.test(x)),'Schematic labels must stay generic');
        assert.ok(labels.length<=12,'Do not flatten repeated layers');
        await evaluate("document.getElementById('explanation-layer').value='2';document.getElementById('explanation-layer').dispatchEvent(new Event('change'))");
        assert.equal(await evaluate("document.getElementById('explanation-layer').value"),'2');
        assert.match(await evaluate("document.getElementById('inspection-context').textContent"),/layer 3/);
        await evaluate("Array.from(document.querySelectorAll('#computation-path button')).find(b=>b.textContent==='Attention').click()");
        assert.match(await evaluate("document.getElementById('detail-body').textContent"),/RoPE/);
        const before=await snapshot();await click('token-journey');
        await until("document.getElementById('inspection-context').dataset.surface==='architecture'");
        assert.equal(await evaluate("document.getElementById('inspection-context').dataset.observationId"),'');
        assert.equal(await evaluate("document.querySelectorAll('#computation-path .selected-object').length"),1);
        assert.deepEqual(await snapshot(),before,'Walkthrough must not execute or replace evidence');
        await click('token-journey');
      }
      await click('output-details');
      assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('#sequence-strip small'),s=>Number(s.textContent.split('#')[1]))"),result.sequence_ids);
      if(model.inspection==='tensors') {
        await evaluate("document.querySelector('#computation-path [data-operation=attention]').click()");
        const shown=await evaluate("JSON.parse(document.querySelector('#detail-body script').textContent)");
        assert.deepEqual(shown,result.nodes.find(n=>n.id===shown.id));
        const inputId=shown.inputs.find(id=>result.nodes.some(n=>n.id===id));
        await evaluate(`document.querySelector('#observation-inputs [data-observation-id="${inputId}"]').click()`);
        assert.equal(await evaluate("document.getElementById('inspection-context').dataset.observationId"),inputId);
      }
      for(const [label,width,height] of [['desktop',1280,1000],['mobile',390,844]]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
        assert.ok(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),'Horizontal overflow');
        await writeFile(output+'/'+model.id+'-'+label+'.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
      }
      evidence.screenshots.push(model.id);
      evidence.models.push({id:model.id,parameters:model.parameters,load_ms:loaded.load_ms,prefill_ms:times[0],warm_median_ms:median,continuation:result.text,selected_ids:result.output_ids});
      // Selection defines a new raw prefix, not a seek through recorded output.
      await evaluate("document.querySelectorAll('#sequence-strip button')[2].click()");
      await click('next-token');await ready();const branch=await snapshot();
      assert.deepEqual(branch.request.prefix_ids,result.sequence_ids.slice(0,3));assert.deepEqual(branch.request.output_ids,[]);
      const repeated=await evaluate(`Execution.generateToken(${JSON.stringify(branch.request)})`);assert.deepEqual(comparable(branch),comparable(repeated));
      await click('reset');await empty();
      await evaluate("document.getElementById('continue-tokens').click();document.getElementById('stop-tokens').click()");await ready();assert.equal((await snapshot()).output_ids.length,1);
      // A late result after model selection must never become the new model's output.
      await evaluate("document.getElementById('next-token').click();document.getElementById('model-choice').dispatchEvent(new Event('change'))");await ready();await empty();
    }
    // Keep source/settings and expose a real model change when entering numerical inspection.
    await apply('a cat',5);await click('switch-inspection');await ready();await empty();
    assert.equal(await evaluate("document.getElementById('model-choice').value"),'tinyllm-8k');
    assert.equal(await evaluate("document.getElementById('request-preview').textContent"),'a cat');
    assert.equal(await evaluate("Number(document.getElementById('output-budget').value)"),5);
    await click('next-token');await ready();
    await click('token-journey');await until("document.getElementById('inspection-context').dataset.surface==='model'");
    assert.equal(await evaluate("document.querySelectorAll('#computation-path .selected-object').length"),1);
    await click('reset');await empty();await new Promise(r=>setTimeout(r,700));
    assert.equal(await evaluate("document.getElementById('token-journey').getAttribute('aria-pressed')"),'false');
    // Preview-only configurations must disable actual generation without replacing observations.
    await click('next-token');await ready();
    await evaluate("document.getElementById('configure-system-attention-mechanism').value='kda';document.getElementById('configure-system-attention-mechanism').dispatchEvent(new Event('change'))");
    assert.equal(await evaluate("document.getElementById('next-token').disabled"),true);
    await evaluate("document.getElementById('configure-system-attention-mechanism').selectedIndex=0;document.getElementById('configure-system-attention-mechanism').dispatchEvent(new Event('change'))");
    // Input edits during weight loading keep the newly typed source, but never stale tokens.
    await click('edit-input');
    await evaluate("document.getElementById('model-choice').value='tinyllm-500k';document.getElementById('model-choice').dispatchEvent(new Event('change'));document.getElementById('prompt').value='a dog';document.getElementById('prompt').dispatchEvent(new Event('input'))");await ready();await empty();
    assert.equal(await evaluate("document.getElementById('request-preview').textContent"),'a dog');
    await apply('cat '.repeat(700),8).then(()=>assert.fail('Expected overflow'),()=>{});
    assert.equal(await evaluate("document.getElementById('next-token').disabled"),true);await empty();
    const invalid=inputFor('tinyllm-500k','a cat');invalid.workload.requests.push({...invalid.workload.requests[0],request_id:'r2'});
    await rejection(`Execution.prepareGeneration(${JSON.stringify(invalid)})`,/one request/);
    // Optional assets are not required to prepare the default model.
    const small=catalog.models.find(m=>m.id==='tinyllm-500k'),path=site+'/models/'+small.weights.path;
    await rename(path,path+'.held');
    try {await navigate();evidence.storage.push(await rejection("Execution.loadModel({model_id:'tinyllm-500k'})",/unavailable.*404/));evidence.storage.push(await rejection(`Execution.prepareGeneration(${JSON.stringify(inputFor('tinyllm-4m','a cat'))})`,/Load the selected model/));}
    finally{await rename(path+'.held',path);}
    const original=await readFile(path),corrupt=Buffer.from(original);corrupt[corrupt.length-1]^=1;await writeFile(path,corrupt);
    try {evidence.storage.push(await rejection("Execution.loadModel({model_id:'tinyllm-500k'})",/digest mismatch/));}finally{await writeFile(path,original);}
    if(assetBase) {
      const remote=JSON.parse(catalogBytes);remote.storage.base_url=assetBase;await writeFile(catalogPath,JSON.stringify(remote));await navigate();
      await click('next-token');await ready();assert.equal((await snapshot()).model_id,'tinyllm-4m');evidence.storage.push('Cross-origin default-model execution passed');
      remote.storage.base_url=base.replace('127.0.0.1','localhost')+'/models/';await writeFile(catalogPath,JSON.stringify(remote));
      await send('Page.navigate',{url:base+'/index.html'});await until("document.getElementById('binding-status')?.dataset.phase==='failed'");
      assert.equal(await evaluate("document.getElementById('next-token').disabled"),true);evidence.storage.push('CORS failure blocks execution');
    }
    for(const retired of ['model-size.html','models/page.js','labs/model-size-quality.html'])await assert.rejects(access(site+'/'+retired));
    evidence.passed=true;await writeFile(output+'/story-models.json',JSON.stringify(evidence,null,2));return evidence;
  }catch(error){evidence.passed=false;evidence.error=String(error);await writeFile(output+'/story-models.json',JSON.stringify(evidence,null,2));throw error;}
  finally{await writeFile(catalogPath,catalogBytes);}
}
