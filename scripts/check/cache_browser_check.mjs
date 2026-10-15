import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
export async function checkCache({send,evaluate,until,click,base,output}) {
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
 const cases=JSON.parse(await readFile(output+'/cache-references.json','utf8'));
 await send('Page.navigate',{url:base+'/'});
 await until(`document.getElementById('model-choice')?.disabled===false`,300);
 await evaluate(`document.getElementById('model-choice').value='tinyllm-8k';document.getElementById('model-choice').dispatchEvent(new Event('change'))`);
 await until(`['ready','failed'].includes(document.getElementById('binding-status').dataset.phase)`,300);
 assert.equal(await evaluate(`document.getElementById('run-error').textContent`),'');
 await evaluate(`globalThis.cardModelSelector=document.getElementById('model-choice')`);
 const pointer=async selector=>{
  const ancestors=await evaluate(`(()=>{const result=[];let at=document.querySelector(${JSON.stringify(selector)}).parentElement.closest('.map-node')?.parentElement.closest('.map-node');while(at){const b=at.querySelector(':scope>button');if(b&&b.getAttribute('aria-expanded')==='false')result.unshift('#'+at.id+'>button');at=at.parentElement.closest('.map-node');}return result;})()`);
  for(const ancestor of ancestors)await pointer(ancestor);
  const point=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
 };
 await click('open-system');
 const ownership=await evaluate(`(()=>{
  const definitions=Declarations.schemas.ExecutionControl.oneOf;
  return {expected:definitions.map(d=>({control:d.properties.control.const,owner:d.properties.ontology_binding.const.primary})),
   cards:Array.from(document.querySelectorAll('#configure-system .map-node:not(.map-root)'),c=>({owner:c.dataset.owner,disabled:c.querySelector(':scope>button').disabled,branch:!!c.querySelector('.map-children')})),
   editors:Array.from(document.querySelectorAll('#configure-system [data-control]'),e=>({control:e.dataset.control,owner:e.closest('.map-node').dataset.owner})),
   unowned:Array.from(document.querySelectorAll('#system-dialog input,#system-dialog select,#system-dialog textarea')).filter(e=>!e.closest('[data-control]')).map(e=>e.id)};
 })()`);
 assert.deepEqual(ownership.editors.sort((a,b)=>a.control.localeCompare(b.control)),ownership.expected.sort((a,b)=>a.control.localeCompare(b.control)),'Editors have exactly one primary concept home');
 assert.deepEqual(ownership.unowned,[],'No standalone system editors');
 assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('#system-map [data-explanation-control]'),e=>({control:e.dataset.explanationControl,owner:e.closest('.map-node').dataset.owner})).sort((a,b)=>a.control.localeCompare(b.control))`),ownership.expected,'Every configurable control has its explanation at the same owner');
 assert.equal(new Set(ownership.cards.map(c=>c.owner)).size,ownership.cards.length);
 for(const card of ownership.cards)assert.equal(card.disabled,!card.branch&&!ownership.expected.some(e=>e.owner===card.owner),'Branches navigate; leaf settings are enabled iff a declared editor exists');
 for(const c of ownership.expected){
  await pointer(`#configure-system [data-owner="${c.owner}"]>button`);
  assert.equal(await evaluate(`document.getElementById('system-dialog').open`),true,'Concept cards must reveal settings in place');
  assert.equal(await evaluate(`(()=>{const card=document.querySelector('#configure-system [data-owner="${c.owner}"]'),button=card.querySelector('button'),panel=document.getElementById(button.getAttribute('aria-controls'));return button.getAttribute('aria-expanded')==='true'&&!panel.hidden&&!!panel.querySelector('input,select,textarea');})()`),true,'Expanded card must contain its usable editor');
  await pointer(`#configure-system [data-owner="${c.owner}"]>button`);
 }
 // The same model selector works inside the card and returns to Interaction on close.
 const modelOwner=ownership.expected.find(c=>c.control==='model').owner;
 await pointer(`#configure-system [data-owner="${modelOwner}"]>button`);
 assert.equal(await evaluate(`document.querySelectorAll('#model-choice').length===1&&document.getElementById('model-choice')===cardModelSelector`),true);
 await evaluate(`document.getElementById('model-choice').value='tinyllm-500k';document.getElementById('model-choice').dispatchEvent(new Event('change'))`);
 await until(`['ready','failed'].includes(document.getElementById('binding-status').dataset.phase)`,300);
 assert.equal(await evaluate(`document.getElementById('run-error').textContent`),'');
 assert.equal(await evaluate(`document.getElementById('model-choice').value`),'tinyllm-500k');
 assert.match(await evaluate(`document.getElementById('active-model-summary').textContent`),/476K/);
 let modelShot=await send('Page.captureScreenshot',{format:'png'});await writeFile(output+'/model-card-desktop.png',Buffer.from(modelShot.data,'base64'));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await evaluate(`document.getElementById('model-choice').scrollIntoView({block:'center'})`);
 assert.ok(await evaluate(`document.getElementById('system-dialog').scrollWidth<=document.getElementById('system-dialog').clientWidth`));
 modelShot=await send('Page.captureScreenshot',{format:'png'});await writeFile(output+'/model-card-mobile.png',Buffer.from(modelShot.data,'base64'));
 await evaluate(`document.getElementById('model-choice').value='tinyllm-8k';document.getElementById('model-choice').dispatchEvent(new Event('change'))`);
 await until(`['ready','failed'].includes(document.getElementById('binding-status').dataset.phase)`,300);
 assert.equal(await evaluate(`document.getElementById('run-error').textContent`),'');
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await until(`!document.getElementById('system-dialog').open&&document.getElementById('inference-form').contains(cardModelSelector)`);
 assert.equal(await evaluate(`document.querySelectorAll('#model-choice').length`),1);
 await click('open-system');
 await pointer(`#configure-system [data-owner="${modelOwner}"]>button`);
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
 let configShot=await send('Page.captureScreenshot',{format:'png'});await writeFile(output+'/concept-controls-desktop.png',Buffer.from(configShot.data,'base64'));
 await pointer('#configure-system [data-owner="KVCache"]>button');
 await click('kv-reuse');await click('resource-enabled');
 assert.equal(await evaluate(`document.querySelector('[data-explanation-control="kv_reuse"]').dataset.value`),'true');
 assert.equal(await evaluate(`JSON.parse(document.querySelector('[data-explanation-control="kv_cache"]').dataset.value).device_kv_bytes`),await evaluate(`Number(document.getElementById('resource-device_kv_bytes').value)`));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await evaluate(`document.querySelector('#configure-system [data-owner="KVCache"]').scrollIntoView({block:'start'})`);
 assert.ok(await evaluate(`document.getElementById('system-dialog').scrollWidth<=document.getElementById('system-dialog').clientWidth`));
 configShot=await send('Page.captureScreenshot',{format:'png'});await writeFile(output+'/concept-controls-mobile.png',Buffer.from(configShot.data,'base64'));
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
 const logical=({measurements,...rest})=>rest;
 let replayChecked=false;
 for(const c of cases){
  const input=await evaluate(`(()=>{const input=JSON.parse(document.getElementById('inference-data').textContent);input.execution.experiments.find(e=>e.control==='model').value='tinyllm-8k';input.execution.experiments.find(e=>e.control==='kv_reuse').value=true;const system=${JSON.stringify(c.spec.system)};for(const d of Declarations.schemas.ExecutionControl.oneOf.filter(d=>Object.hasOwn(Declarations.schemas.KVResidencySystemConfig.properties,d.properties.control.const))){const control=d.properties.control.const;input.execution.experiments.push({control,value:system[control],ontology_binding:d.properties.ontology_binding.const});}input.workload=${JSON.stringify(c.spec.workload)};return input;})()`);
  // Current generation policy, not the retired standalone chat endpoint.
  input.workload.requests.forEach(r=>r.request.generation.stopping='model-end-or-budget');
  const expected=await evaluate(`Execution.simulateResources(${JSON.stringify(input)})`);Declarations.assertShape('ResourceExecution',expected);
  if(c.id==='warm'){
   const ordinary=structuredClone(input);ordinary.execution.experiments=ordinary.execution.experiments.filter(e=>['model','kv_reuse'].includes(e.control));ordinary.workload.requests=ordinary.workload.requests.slice(0,1);
   const prepared=await evaluate(`Execution.prepareGeneration(${JSON.stringify(ordinary)})`);
   const first=expected.run.computations.find(c=>c.selection);
   assert.deepEqual(prepared.prompt_ids,first.state_after.token_ids,'Resource execution cannot invent framing');
   const prediction=await evaluate(`Execution.generateToken(${JSON.stringify({execution:ordinary.execution,prefix_ids:prepared.prompt_ids,output_ids:[],generation:ordinary.workload.requests[0].request.generation})})`);
   assert.equal(prediction.selected_id,first.selection.selected_id);
   prediction.logits.forEach((v,i)=>assert.ok(Math.abs(v-first.selection.raw_logits[i])<=1e-10,'Resource/ordinary numerical parity'));
   const incompatible=structuredClone(input);incompatible.execution.experiments.find(e=>e.control==='kv_reuse').value=false;
   const rejection=await evaluate(`Execution.simulateResources(${JSON.stringify(incompatible)}).then(()=>null,e=>e.message)`);assert.match(rejection,/GenerationInput:.*kv_reuse/);
  }
  await evaluate(`(()=>{const config=${JSON.stringify(c.spec.system)};const visit=o=>Object.entries(o).forEach(([k,v])=>{if(v&&typeof v==='object')visit(v);else {const e=document.getElementById('resource-'+k);if(e){e.value=v;e.dispatchEvent(new Event('change'));}}});visit(config);})()`);
  await evaluate(`document.getElementById('system-dialog').close();if(document.getElementById('inference-form').hidden)document.getElementById('edit-input').click();`);
  await evaluate(`(()=>{const requests=${JSON.stringify(input.workload.requests)};while(document.querySelectorAll('#resource-requests fieldset').length>requests.length)document.querySelector('#resource-requests fieldset:last-child button').click();while(document.querySelectorAll('#resource-requests fieldset').length<requests.length)document.getElementById('add-request').click();requests.forEach((r,i)=>{for(const [k,v]of [['text',r.request.text],['arrival_us',r.arrival_us],['max_new_tokens',r.request.generation.max_new_tokens]]){const e=document.getElementById('resource-'+k+'-'+i);e.value=v;e.dispatchEvent(new Event('change'));}});document.getElementById('inference-form').requestSubmit();})()`);
  assert.equal(await evaluate(`document.getElementById('response-preview').textContent`),'');
  await click('continue-tokens');await until(`!document.getElementById('continue-tokens').disabled`,300);
  assert.equal(await evaluate(`document.getElementById('run-error').textContent`),'');
  const actual=await evaluate(`JSON.parse(document.getElementById('resource-explanation').dataset.execution)`);
  assert.equal(await evaluate("document.getElementById('timing-measurements').hidden && !document.getElementById('timing-simulation').hidden"),true,'Virtual simulation never displays browser timings');
  assert.deepEqual(logical(actual.run),logical(expected.run),c.id+': main-page/headless parity');assert.deepEqual(actual.outputs,expected.outputs);
  assert.equal(await evaluate(`document.querySelectorAll('#resource-explanation table tr').length`),actual.run.events.length+1);
  // Resource numerics use the main diagram and inspector, not a second tensor viewer.
  const last=actual.run.computations.length-1,work=actual.run.computations[last];
  await evaluate(`document.querySelector('[aria-label="Resource computation"]').value=${last};document.querySelector('[aria-label="Resource computation"]').dispatchEvent(new Event('change'));document.querySelector('[data-configuration-owner="Attention"] button').click();`);
  const tensor=await evaluate(`JSON.parse(document.querySelector('#detail-body script[type="application/json"]').textContent)`);
  assert.deepEqual(tensor,work.nodes.find(n=>n.id===tensor.id),'Shared inspector shows this resource computation');
  assert.equal(await evaluate(`document.getElementById('token-journey').disabled`),false);
  if(c.id==='remote'){
   await evaluate(`document.getElementById('numerical-inspector').scrollIntoView()`);
   const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(output+'/resources-inspection.png',Buffer.from(shot.data,'base64'));
   assert.ok(actual.run.events.some(e=>e.kind==='remote-hit'),'Fixture must still exercise actual transfer');
   const replay=await evaluate(`Execution.replayCache({record_json:${JSON.stringify(JSON.stringify(actual.run))}})`);assert.deepEqual(logical(replay),logical(actual.run));replayChecked=true;
  }
  await writeFile(output+'/'+c.id+'.cache-browser.json',JSON.stringify(actual));
 }
 assert.ok(replayChecked);
 await click('reset');assert.equal(await evaluate(`document.getElementById('response-preview').textContent`),'');assert.equal(await evaluate(`document.getElementById('resource-explanation').hidden`),true);
 await click('open-system');await evaluate(`document.getElementById('resource-device_kv_bytes').value=1;document.getElementById('resource-device_kv_bytes').dispatchEvent(new Event('change'));document.getElementById('system-dialog').close()`);
 await click('continue-tokens');await until(`document.getElementById('binding-status').dataset.phase==='failed'`);
 assert.match(await evaluate(`document.getElementById('run-error').textContent`),/capacity/);
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
 let shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(output+'/resources-desktop.png',Buffer.from(shot.data,'base64'));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`));
 shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(output+'/resources-mobile.png',Buffer.from(shot.data,'base64'));
 await writeFile(output+'/cache-browser-checks.json',JSON.stringify({passed:true,cases:cases.map(c=>c.id),checks:['main-page/headless parity','selected artifact','resource admission','replay','reset invalidation','desktop/narrow']},null,2));
}
