import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
export async function checkCache({send,evaluate,until,click,base,file,output}) {
 const cases=JSON.parse(await readFile(output+'/cache-references.json','utf8'));
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:base+'/kv-cache.html'});
 await until(`document.getElementById('cache-status')?.dataset.phase==='ready'`);
 const logical=({measurements,...rest})=>rest;
 for(const c of cases){
  const before=await evaluate(`document.getElementById('cache-run-identity').textContent`);
  await evaluate(`(() => {
   const spec=${JSON.stringify(c.spec)},$=id=>document.getElementById(id);
   while(document.querySelectorAll('.cache-request').length>spec.workload.requests.length)document.querySelectorAll('.cache-request button')[document.querySelectorAll('.cache-request button').length-1].click();
   while(document.querySelectorAll('.cache-request').length<spec.workload.requests.length)$('cache-add').click();
   const set=(id,value)=>{const e=$(id);e.value=value;e.dispatchEvent(new Event('input'));};
   for(const [key,value] of Object.entries(spec.system))if($('cache-'+key))set('cache-'+key,value);
   spec.workload.requests.forEach((r,i)=>{set('cache-text-'+i,r.request.text);set('cache-arrival-'+i,r.arrival_us);set('cache-budget-'+i,r.request.generation.max_new_tokens);});
  })()`);
  assert.equal(await evaluate(`document.getElementById('cache-status').dataset.phase`),'dirty');
  assert.equal(await evaluate(`document.getElementById('cache-run-identity').textContent`),before);
  await evaluate(`document.getElementById('cache-form').requestSubmit();if(!document.getElementById('cache-execute').disabled)throw Error('Cache controls must lock during execution')`);
  await until(`['ready','error'].includes(document.getElementById('cache-status').dataset.phase)`);
  assert.equal(await evaluate(`document.getElementById('cache-status').dataset.phase`),'ready',await evaluate(`document.getElementById('cache-error').textContent`));
  const filename=output+'/cache-'+c.record.id.slice(0,12)+'.json';await rm(filename,{force:true});await click('cache-download');
  let raw;
  for(let i=0;i<100;i++){try{raw=await readFile(filename,'utf8');break;}catch(e){if(e.code!=='ENOENT')throw e;await new Promise(r=>setTimeout(r,50));}}
  assert.ok(raw,'Cache browser download absent');const record=JSON.parse(raw);
  assert.deepEqual(logical(record),logical(c.record),c.id+': cache browser parity');
  await writeFile(output+'/'+c.id+'.cache-browser.json',raw);
  assert.equal(await evaluate(`document.querySelectorAll('#cache-events button').length`),record.events.length);
  const index=record.computations.length-1;
  await evaluate(`document.getElementById('cache-work-choice').value=${index};document.getElementById('cache-work-choice').dispatchEvent(new Event('change'));document.getElementById('cache-tensor-choice').value='attention';document.getElementById('cache-tensor-choice').dispatchEvent(new Event('change'));`);
  assert.deepEqual(await evaluate(`JSON.parse(document.getElementById('cache-raw').textContent)`),record.computations[index].nodes.find(n=>n.name==='attention'));
  const hit=record.events.findIndex(e=>e.kind==='remote-hit'||e.kind==='local-hit');
  if(hit>=0){await evaluate(`document.querySelectorAll('#cache-events button')[${hit}].click()`);assert.ok(await evaluate(`document.getElementById('cache-state').textContent.includes('Keys')`));}
  if(c.id.endsWith('-remote')){await evaluate('window.scrollTo(0,0)');const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(output+'/'+c.id+'-cache.png',Buffer.from(shot.data,'base64'));}
 }
 const id=await evaluate(`document.getElementById('cache-run-identity').textContent`);
 await evaluate(`document.getElementById('cache-device_kv_bytes').value=1;document.getElementById('cache-device_kv_bytes').dispatchEvent(new Event('input'));document.getElementById('cache-form').requestSubmit()`);
 await until(`document.getElementById('cache-status').dataset.phase==='error'`);
 assert.equal(await evaluate(`document.getElementById('cache-run-identity').textContent`),id);
 await evaluate('window.scrollTo(0,0)');let shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(output+'/cache-failure.png',Buffer.from(shot.data,'base64'));
 await send('Page.navigate',{url:file+'/kv-cache.html'});await until(`document.getElementById('cache-status')?.dataset.phase==='offline'`);
 assert.equal(await evaluate(`document.getElementById('cache-execute').disabled`),true);
 await click('cache-next');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 assert.ok(await evaluate(`document.documentElement.scrollWidth<=window.innerWidth`),'Cache mobile overflow');
 shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(output+'/cache-mobile.png',Buffer.from(shot.data,'base64'));
 await writeFile(output+'/cache-browser-checks.json',JSON.stringify({passed:true,cases:cases.map(c=>c.id),checks:['native export parity','actual tensor equality','cache outcomes','draft/applied separation','in-flight locking','explicit admission failure','offline inspection','mobile layout']},null,2));
}
