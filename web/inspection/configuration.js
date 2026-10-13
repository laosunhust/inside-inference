/* Controls project the submitted ExecutionSpec. There is no separate preview state. */
globalThis.ExecutionConfiguration=(()=>{
  function mount(read,change) {
    const fields=[];
    for(const key of ['input','system','client']) {
      const dialog=document.getElementById(key+'-dialog'),trigger=document.getElementById('open-'+key);
      trigger.onclick=()=>dialog.showModal();dialog.querySelector('.dialog-close').onclick=()=>dialog.close();
      dialog.onclick=e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}};
    }
    const definitions=Declarations.schemas.ExperimentSpec.oneOf;
    for(const definition of definitions) {
      const control=definition.properties.control.const,field=definition.properties.value;
      // Model choice already has an editor next to customer input; both read the same spec.
      if(control==='model'||field.$ref)continue;
      const label=document.createElement('label'),input=document.createElement(field.enum?'select':'input');
      label.textContent=field.title;input.id=control.replaceAll('_','-');
      if(field.type==='boolean')input.type='checkbox';
      else if(field.enum)field.enum.forEach(value=>input.append(new Option(String(value),String(value))));
      else if(['integer','number'].includes(field.type)){input.type='number';if(field.minimum!==undefined)input.min=field.minimum;if(field.maximum!==undefined)input.max=field.maximum;input.step=field.type==='integer'?1:'any';}
      else throw Error('No editor for declared execution control '+control);
      input.onchange=()=>{if(input.reportValidity())change(control,field.type==='boolean'?input.checked:['integer','number'].includes(field.type)?Number(input.value):input.value);};label.append(input);document.getElementById('configure-system').append(label);
      fields.push({control,input,field,binding:definition.properties.ontology_binding.const});
    }
    const map=Declarations.schemas.InferenceMap.const;
    const owners=[...new Set(map.areas.flatMap(a=>a.concepts))];
    for(const owner of owners){
      if(definitions.some(d=>d.properties.ontology_binding.const.primary===owner))continue;
      const row=document.createElement('div'),button=document.createElement('button'),link=document.createElement('a');
      button.disabled=true;button.dataset.concept=owner;button.textContent=owner.replace(/([a-z])([A-Z])/g,'$1 $2');
      button.title=Declarations.meanings[owner].meaning;link.href='ontology.html#'+owner;link.textContent='Ontology ↗';row.append(button,link);document.getElementById('unavailable-system').append(row);
    }
    for(const [id,owner] of [['configure-input',Declarations.schemas.Workload['x-owner']],['configure-client',Declarations.schemas.CustomerInteraction['x-owner']]]){
      const p=document.createElement('p'),link=document.createElement('a');p.textContent='Not adjustable yet. ';link.href='ontology.html#'+owner;link.textContent='Ontology ↗';p.append(link);document.getElementById(id).append(p);
    }
    function refresh(){
      const spec=read();
      for(const field of fields){const experiment=spec.experiments.find(e=>e.control===field.control);if(field.field.type==='boolean')field.input.checked=experiment.value;else field.input.value=experiment.value;}
      const active=spec.experiments.filter(e=>e.control!=='model'&&e.value).flatMap(e=>[e.ontology_binding.primary,...e.ontology_binding.related]);
      for(const block of document.querySelectorAll('[data-configuration-owner],.map-concept'))block.classList.toggle('configuration-changed',active.includes(block.dataset.configurationOwner||block.dataset.owner));
    }
    return {refresh};
  }
  return {mount};
})();
