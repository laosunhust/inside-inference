/* Projections of canonical cache evidence. No inference or scheduling in the renderer. */
(async () => {
'use strict';
const $=id=>document.getElementById(id), make=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
if(!$('cache-data'))return;
let draft=JSON.parse($('cache-data').textContent),cursor=0,live=false,busy=false;
$('cache-status').textContent='Loading engine…';
let serialized=await Execution.cacheRun(draft,{raw:true}),run=JSON.parse(serialized);
const tokens=JSON.parse($('cache-tokens').textContent),ontology=JSON.parse($('cache-ontology').textContent);
Declarations.assertShape('CacheRun',run);
const number=x=>Number(x).toLocaleString(undefined,{maximumFractionDigits:3});
function status(phase,text){$('cache-status').dataset.phase=phase;$('cache-status').textContent=text;}
function dirty(){if(live&&!busy)status('dirty','Settings changed. The views still show the previous accepted run.');}
function lock(){for(const e of $('cache-form').querySelectorAll('input,select,button'))e.disabled=!live||busy;}
function input(parent,key,value,field,onChange){
 const label=make('label',field.title||key.replaceAll('_',' ')),e=make(field.enum?'select':'input');e.id='cache-'+key;
 if(field.enum){for(const v of field.enum){const o=make('option',v);o.value=v;e.append(o);}}
 else {e.type=field.type==='string'?'text':'number';if(field.minimum!==undefined)e.min=field.minimum;if(field.maximum!==undefined)e.max=field.maximum;e.step=field.type==='integer'?'1':'any';}
 e.value=value;e.addEventListener('input',()=>{onChange(e.type==='number'?Number(e.value):e.value);dirty();});label.append(e);parent.append(label);return e;
}
function controls(){
 $('cache-system-fields').replaceChildren();$('cache-rate-fields').replaceChildren();
 function fields(schema,value,parent){
  for(const [key,field] of Object.entries(schema.properties)){
   if(field.const!==undefined)continue;
   if(field.$ref){
    const child=Declarations.schemas[field.$ref.split('/').at(-1)],group=make('fieldset'),legend=make('legend');
    const link=make('a',child['x-owner'].replace(/([a-z])([A-Z])/g,'$1 $2').replace(/([A-Z])([A-Z][a-z])/g,'$1 $2'));link.href='ontology.html#'+child['x-owner'];legend.append(link);group.append(legend);parent.append(group);
    fields(child,value[key],group);
   }else input(parent,key,value[key],field,v=>value[key]=v);
  }
 }
 fields(Declarations.schemas.KVResidencySystemConfig,draft.system,$('cache-system-fields'));
 requests();lock();
}
function requests(){
 const parent=$('cache-request-fields');parent.replaceChildren();
 draft.workload.requests.forEach((r,i)=>{
  const row=make('div');row.className='cache-request';row.append(make('small',r.request_id));
  input(row,'text-'+i,r.request.text,Declarations.schemas.InferenceRequest.properties.text,v=>r.request.text=v);
  const pair=make('div');pair.className='cache-request-grid';row.append(pair);
  input(pair,'arrival-'+i,r.arrival_us,Declarations.schemas.RequestArrival.properties.arrival_us,v=>r.arrival_us=v);
  input(pair,'budget-'+i,r.request.generation.max_new_tokens,{...Declarations.schemas.GenerationPolicy.properties.max_new_tokens,maximum:draft.system.max_new_tokens_cap},v=>r.request.generation.max_new_tokens=v);
  const remove=make('button','Remove request');remove.type='button';remove.id='cache-remove-'+i;
  remove.onclick=()=>{if(draft.workload.requests.length>1){draft.workload.requests.splice(i,1);requests();dirty();}};row.append(remove);
  parent.append(row);
 });lock();
}
function matrix(value,labels){
 const wrap=make('div');wrap.className='cache-grid-wrap';const table=make('table');table.className='cache-grid';
 const rows=Array.isArray(value[0])?value:value.map(x=>[x]);
 rows.forEach((row,i)=>{const tr=make('tr');tr.append(make('th',labels?labels[i]:i));row.forEach(x=>{const td=make('td',typeof x==='boolean'?String(x):number(x));td.dataset.positive=String(x>=0);td.title=String(x);tr.append(td);});table.append(tr);});wrap.append(table);return wrap;
}
function inspect(){
 const event=run.events[cursor];$('cache-event-caption').textContent=`${cursor+1}/${run.events.length} · ${event.request_id} · ${event.kind} · ${number(event.time_us)} µs`;
 for(const [tier,key,cap] of [['device','device_reserved_bytes','device_kv_bytes'],['host','host_retained_bytes','host_kv_bytes']]){
  $(tier+'-meter').max=run.declaration.system.kv_cache[cap];$(tier+'-meter').value=event[key];$(tier+'-count').textContent=`${event[key]} / ${run.declaration.system.kv_cache[cap]} bytes`;
 }
 $('cache-prev').disabled=cursor===0;$('cache-next').disabled=cursor===run.events.length-1;
 $('cache-events').querySelectorAll('button').forEach((b,i)=>b.classList.toggle('active',i===cursor));
 $('cache-causes').replaceChildren();if(event.causes.length)$('cache-causes').append(make('small','Enabled by: '));for(const id of event.causes){const i=run.events.findIndex(e=>e.event_id===id),cause=run.events[i],button=make('button',cause.request_id+' '+cause.kind);button.onclick=()=>{cursor=i;inspect();};$('cache-causes').append(button);}
 $('cache-state').replaceChildren();const state=event.state_id&&run.states[event.state_id];
 $('cache-state-caption').textContent=(event.phase||event.transfer_direction||event.detail)+(state?` · ${state.token_ids.length} cached positions · ${state.precision} K/V state`:' · No state snapshot attached to this event.');
 if(state){const labels=state.token_ids.map((id,i)=>`${i}: #${id} ${tokens[id]}`);state.keys.forEach((keys,layer)=>$('cache-state').append(make('h3',`Layer ${layer+1} · Keys`),matrix(keys,labels),make('h3',`Layer ${layer+1} · Values`),matrix(state.values[layer],labels)));$('cache-raw').textContent=JSON.stringify(state,null,2);}
 const work=run.computations.findIndex(c=>c.request_id===event.request_id&&event.state_id&&JSON.stringify(c.state_after)===JSON.stringify(state));
 if(work>=0){$('cache-work-choice').value=work;tensorChoices();}
}
function tensorChoices(){
 const work=run.computations[Number($('cache-work-choice').value)];if(!work)return;
 const prior=$('cache-tensor-choice').value;$('cache-tensor-choice').replaceChildren();
 for(const n of work.nodes){const o=make('option',`${n.layer===null?'':`L${n.layer+1} · `}${n.operation.name}`);o.value=n.id;$('cache-tensor-choice').append(o);}
 $('cache-tensor-choice').value=work.nodes.some(n=>n.id===prior)?prior:work.nodes.find(n=>n.operation.name==='attention').id;tensor();
}
function tensor(){
 const work=run.computations[Number($('cache-work-choice').value)];if(!work)return;
 const node=work.nodes.find(n=>n.id===$('cache-tensor-choice').value);if(!node)return;
 const owner=Declarations.operationOwners[node.operation.name], definition=Declarations.meanings[owner];
 if(!definition)throw new Error('Unknown operation owner: '+node.operation.name);
 const link=make('a','Ontology: '+owner+' ↗');link.href='ontology.html#'+owner;link.title=definition.meaning;
 const labs=make('a','Labs ↗');labs.href='labs-by-concept.html#'+owner;
 $('cache-tensor').replaceChildren(make('p',`${work.phase} · positions ${node.positions.join(', ')} · shape [${node.shape.join(', ')}] · ${node.formula}`),make('p',`This work: ${work.matmul_flops} dense-matmul FLOPs; full-prefix reference check: ${work.reference_matmul_flops}. Scalar operations are excluded.`),link,labs,matrix(node.values));
 $('cache-raw').textContent=JSON.stringify(node,null,2);
}
function timeline(){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),req=run.declaration.workload.requests,total=Math.max(1,...run.events.map(e=>e.time_us));
 svg.setAttribute('viewBox',`0 0 700 ${req.length*56+24}`);svg.setAttribute('role','img');svg.setAttribute('aria-label','Recorded virtual request timelines');
 const element=(tag,attrs,text)=>{const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;svg.append(e);return e;};
 req.forEach((r,i)=>{
  const y=i*56+18;element('text',{x:0,y:y+12,class:'timeline-label'},r.request_id);
  const arrived=run.events.find(e=>e.request_id===r.request_id&&e.kind==='arrived'),admitted=run.events.find(e=>e.request_id===r.request_id&&e.kind==='admitted');
  const block=(start,end,kind,label,index)=>{const rect=element('rect',{x:65+start/total*620,y,width:Math.max(2,(end-start)/total*620),height:23,rx:4,class:kind});const title=document.createElementNS(ns,'title');title.textContent=`${label}: ${number(start)} → ${number(end)} µs`;rect.append(title);rect.addEventListener('click',()=>{cursor=index;inspect();});};
  if(arrived&&admitted&&admitted.time_us>arrived.time_us)block(arrived.time_us,admitted.time_us,'admission','Admission wait',run.events.indexOf(admitted));
  run.events.forEach((e,j)=>{if(e.request_id!==r.request_id||!['compute-start','transfer-start','retention-start'].includes(e.kind))return;const end=run.events.slice(j+1).find(x=>x.kind===(e.kind==='retention-start'?'retained':e.kind.replace('start','end')));if(end)block(e.time_us,end.time_us,e.kind==='compute-start'?'compute':e.kind==='retention-start'?'retention':'transfer',e.phase||e.transfer_direction||e.detail,j);});
 });element('text',{x:65,y:req.length*56+15,class:'timeline-axis'},`0 → ${number(total)} virtual µs`);$('cache-timeline').replaceChildren(svg);
}
function render(){
 timeline();$('cache-events').replaceChildren();run.events.forEach((e,i)=>{const b=make('button',`${e.request_id} ${e.kind}`);b.dataset.kind=e.kind;b.onclick=()=>{cursor=i;inspect();};$('cache-events').append(b);});
 $('cache-work-choice').replaceChildren();run.computations.forEach((c,i)=>{const o=make('option',`${c.request_id} · ${c.phase} · ${c.input_ids.length} new positions`);o.value=i;$('cache-work-choice').append(o);});
 const rows=run.declaration.workload.requests.map(r=>{const ids=run.computations.filter(c=>c.request_id===r.request_id&&c.selection).map(c=>c.selection.selected_id);return `${r.request_id}: ${ids.map(id=>`#${id} ${tokens[id]}`).join(' · ')} — ${run.outcomes[r.request_id].stop_reason}`;});$('cache-results').replaceChildren(...rows.map(t=>make('p',t)));
 $('cache-evidence').textContent=run.evidence;$('cache-backend-info').textContent=JSON.stringify(run.provenance.backend,null,2);
 $('cache-measurements').replaceChildren(...run.measurements.map(m=>make('p',`${m.kind}: ${number(m.elapsed_us)} measured µs${m.bytes?' · '+m.bytes+' bytes':''}`)));
 if(!run.measurements.length)$('cache-measurements').append(make('p','Wall-clock samples are omitted from the reproducible embedded example. Execute a live run to measure this host.'));
 $('cache-run-identity').textContent=JSON.stringify({id:run.id,provenance:run.provenance,declaration:run.declaration},null,2);cursor=0;tensorChoices();inspect();
}
$('cache-prev').onclick=()=>{cursor--;inspect();};$('cache-next').onclick=()=>{cursor++;inspect();};$('cache-work-choice').onchange=tensorChoices;$('cache-tensor-choice').onchange=tensor;
$('cache-add').onclick=()=>{if(draft.workload.requests.length>=draft.system.max_requests)return;const next=structuredClone(draft.workload.requests.at(-1));let id=1;while(draft.workload.requests.some(r=>r.request_id==='r'+id))id++;next.request_id='r'+id;draft.workload.requests.push(next);requests();dirty();};
$('cache-form').onsubmit=async event=>{
 event.preventDefault();if(!live||busy)return;
 try{Declarations.assertShape('KVExperimentInput',draft);busy=true;lock();$('cache-error').hidden=true;status('running','Executing the submitted experiment…');
 const raw=await Execution.cacheRun(draft,{raw:true}),value=JSON.parse(raw);
 if(value.declaration.ontology_binding.primary!==draft.ontology_binding.primary || JSON.stringify(value.declaration.ontology_binding.related)!==JSON.stringify(draft.ontology_binding.related))throw Error('Response ontology binding differs from the submitted experiment');
 serialized=raw;run=value;render();status('ready','Accepted run. Every view reads this computation and schedule.');
 }catch(error){$('cache-error').hidden=false;$('cache-error').textContent=error.message;status('error','Execution failed. Previous accepted evidence remains visible.');}
 finally{busy=false;lock();}
};
$('cache-download').onclick=()=>{const url=URL.createObjectURL(new Blob([serialized],{type:'application/json'}));const a=make('a');a.href=url;a.download='cache-'+run.id.slice(0,12)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
controls();render();
(async()=>{try{if(location.protocol==='file:')throw Error('offline');const capability=await Execution.cacheCapabilities();if(capability.contract_sha256!==Declarations.hash)throw Error('Server contract differs; restart it');live=true;for(const option of $('cache-backend').options)option.disabled=!capability.backends.includes(option.value);status('ready','Accepted recorded run. Change a setting to execute a new experiment.');}catch(error){status('offline','Browser execution unavailable. '+(error.message==='offline'?'':error.message));}lock();})();
})().catch(error=>{document.getElementById('cache-status').textContent=error.message;});
