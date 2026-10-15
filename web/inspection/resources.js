/* The residency experiment edits the same ExecutionSpec and Workload as generation. */
export function resourceExperiment(read,change,inspect,configurationUI) {
  const $=id=>document.getElementById(id),el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
  const definitions=Declarations.schemas.ExecutionControl.oneOf.filter(d=>Object.hasOwn(Declarations.schemas.KVResidencySystemConfig.properties,d.properties.control.const));
  const keys=definitions.map(d=>d.properties.control.const);
  const defaults=s=>s.$ref?defaults(Declarations.schemas[s.$ref.split('/').at(-1)]):s.properties?Object.fromEntries(Object.entries(s.properties).map(([k,v])=>[k,defaults(v)])):s.default??s.const;
  const configuration=()=>{
    const execution=read().execution;Declarations.assertShape('ExecutionSpec',execution);
    const values=Object.fromEntries(execution.experiments.map(e=>[e.control,e.value]));
    if(!keys.some(key=>Object.hasOwn(values,key)))return null;
    return Object.fromEntries(Object.entries(Declarations.schemas.KVResidencySystemConfig.properties).map(([key,field])=>[key,keys.includes(key)?values[key]:field.const]));
  };
  function configuredInput(value) {
    const input=structuredClone(read());input.execution.experiments=input.execution.experiments.filter(e=>!keys.includes(e.control));
    if(value)for(const d of definitions){const control=d.properties.control.const;input.execution.experiments.push({control,value:value[control],ontology_binding:d.properties.ontology_binding.const});}
    if(!value){input.workload.requests=input.workload.requests.slice(0,1);input.workload.requests[0].arrival_us=0;}
    return input;
  }
  function configure(value){const input=configuredInput(value);Declarations.assertShape('GenerationInput',input);change(input);}
  const enableLabel=el('label','Residency simulation · 8K'),enable=el('input');enable.type='checkbox';enable.id='resource-enabled';enableLabel.append(enable);
  configurationUI.editor('kv_cache').append(enableLabel);
  const groups=new Map();
  for(const definition of definitions){
    const control=definition.properties.control.const,group=el('fieldset');group.id='resource-'+control;
    configurationUI.editor(control).append(group);groups.set(control,group);
  }
  $('resource-enabled').onchange=()=>configure($('resource-enabled').checked?defaults(Declarations.schemas.KVResidencySystemConfig):null);
  function fields(schema,value,path=[]) {
    const group=el('div');
    for(const [key,field] of Object.entries(schema.properties)) {
      if(field.$ref){const sub=el('fieldset');sub.append(el('legend',key.replaceAll('_',' ')),fields(Declarations.schemas[field.$ref.split('/').at(-1)],value[key],[...path,key]));group.append(sub);continue;}
      if(field.const!==undefined||field.enum?.length===1)continue;
      const label=el('label',field.title||key),input=el('input');input.type='number';input.value=value[key];input.id='resource-'+key;input.min=field.minimum??'';input.max=field.maximum??'';input.step=field.type==='integer'?1:'any';
      input.onchange=()=>{if(!input.reportValidity())return;const next=structuredClone(configuration());let at=next;for(const part of path)at=at[part];at[key]=Number(input.value);configure(next);};label.append(input);group.append(label);
    }
    return group;
  }
  function requests(enabled){
    const container=$('resource-requests');container.replaceChildren();$('add-request').hidden=!enabled;$('add-request').disabled=enabled&&read().workload.requests.length>=configuration().max_requests;
    container.hidden=!enabled;document.getElementById('request-fields').hidden=enabled;if(!enabled)return;
    read().workload.requests.forEach((request,index)=>{
      const row=el('fieldset');row.append(el('legend',request.request_id));
      for(const [key,title,value] of [['text','Input',request.request.text],['arrival_us','Arrival · virtual µs',request.arrival_us],['max_new_tokens','Maximum new tokens',request.request.generation.max_new_tokens]]){
        const label=el('label',title),input=el(key==='text'?'textarea':'input');input.id=`resource-${key}-${index}`;input.value=value;
        if(key!=='text'){input.type='number';input.min=key==='arrival_us'?0:1;input.step=1;if(key==='max_new_tokens')input.max=configuration().max_new_tokens_cap;}
        input.onchange=()=>{if(!input.reportValidity())return;const next=structuredClone(read()),r=next.workload.requests[index];if(key==='text')r.request.text=input.value;else if(key==='arrival_us')r.arrival_us=Number(input.value);else r.request.generation.max_new_tokens=Number(input.value);change(next);};label.append(input);row.append(label);
      }
      if(index){const remove=el('button','Remove');remove.type='button';remove.onclick=()=>{const next=structuredClone(read());next.workload.requests.splice(index,1);change(next);};row.append(remove);}container.append(row);
    });
  }
  $('add-request').onclick=()=>{const next=structuredClone(read()),requests=next.workload.requests;let n=1;while(requests.some(r=>r.request_id==='r'+n))n++;requests.push({...structuredClone(requests.at(-1)),request_id:'r'+n});change(next);};
  function render(evidence,view){
    const config=configuration();$('resource-enabled').checked=!!config;
    let compatible=true;try{Declarations.assertShape('GenerationInput',configuredInput(defaults(Declarations.schemas.KVResidencySystemConfig)));}catch{compatible=false;}
    $('resource-enabled').disabled=!config&&!compatible;
    enableLabel.title=!compatible?'Residency simulation requires the 8K model with KV reuse and without speculative decoding':read().workload.requests.length>1?'Turning off uses the first request as a single input arriving at zero':'';
    for(const definition of definitions){
      const control=definition.properties.control.const,group=groups.get(control),schema=Declarations.schemas[definition.properties.value.$ref.split('/').at(-1)];
      group.disabled=!config;group.replaceChildren(fields(schema,config?.[control]??defaults(schema),[control]));
      let activate=configurationUI.editor(control).querySelector('button');
      if(control!=='kv_cache'&&!activate){activate=el('button','Configure KV cache');activate.type='button';activate.onclick=()=>configurationUI.open('kv_cache');configurationUI.editor(control).prepend(activate);}
      if(activate)activate.hidden=!!config;
    }
    requests(!!config);
    const panel=$('resource-explanation');panel.hidden=!evidence;panel.replaceChildren();delete panel.dataset.execution;if(!evidence)return;panel.dataset.execution=JSON.stringify(evidence);
    const run=evidence.run;panel.append(el('h3','Resource timeline · hypothetical µs'));
    const timeline=el('details');timeline.append(el('summary',`${run.events.length} events · ${run.events.at(-1).time_us.toFixed(2)} virtual µs`),InspectionDetails.table(['Request','Event','µs','Device bytes','Host bytes'],run.events.map(e=>[e.request_id,e.kind,e.time_us.toFixed(2),e.device_reserved_bytes,e.host_retained_bytes])));panel.append(timeline);
    const label=el('label','Inspect computation '),select=el('select');select.setAttribute('aria-label','Resource computation');
    run.computations.forEach((c,i)=>select.append(new Option(`${c.request_id} · ${c.phase} · ${c.input_ids.length} positions`,String(i))));
    select.value=String(view.computation_index??0);select.onchange=()=>inspect({computation_index:Number(select.value),position:run.computations[Number(select.value)].state_after.token_ids.length-1,surface:'system',observation_id:null});label.append(select);panel.append(label);
  }
  return {render,disable:()=>configure(null)};
}
