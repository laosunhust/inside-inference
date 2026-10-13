/* Controls project the submitted ExecutionSpec. There is no separate preview state. */
globalThis.ExecutionConfiguration=(()=>{
  function mount(read,change) {
    const fields=[],editors=new Map(),homes=new Map();
    const modelEditor=document.getElementById('model-choice').closest('fieldset'),modelHome=modelEditor.parentElement;
    for(const key of ['input','system','client']) {
      const dialog=document.getElementById(key+'-dialog'),trigger=document.getElementById('open-'+key);
      trigger.onclick=()=>{if(key==='system')editors.get('model').append(modelEditor);dialog.showModal();};
      if(key==='system')dialog.addEventListener('close',()=>{if(!dialog.open)modelHome.append(modelEditor);});dialog.querySelector('.dialog-close').onclick=()=>dialog.close();
      dialog.onclick=e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}};
    }
    const definitions=Declarations.schemas.ExperimentSpec.oneOf;
    const owners=Declarations.schemas.InferenceMap.const.areas.flatMap(a=>a.concepts);
    for(const owner of owners){
      const controls=definitions.filter(d=>d.properties.ontology_binding.const.primary===owner);
      const row=document.createElement('div'),button=document.createElement('button'),link=document.createElement('a'),panel=document.createElement('div');
      row.dataset.concept=owner;button.type='button';button.disabled=!controls.length;
      button.textContent=owner.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/([A-Z])([A-Z][a-z])/g,'$1 $2');button.title=Declarations.meanings[owner].meaning;
      panel.id='configure-'+owner;panel.className='configuration-fields';panel.hidden=true;
      button.setAttribute('aria-controls',panel.id);button.setAttribute('aria-expanded','false');
      button.onclick=()=>{panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));};
      link.href='ontology.html#'+owner;link.textContent='Ontology ↗';row.append(button,link,panel);
      document.getElementById('configure-system').append(row);
      for(const definition of controls){
        const control=definition.properties.control.const,field=definition.properties.value;
        homes.set(control,()=>{panel.hidden=false;button.setAttribute('aria-expanded','true');row.scrollIntoView({block:'nearest'});});
        const editor=document.createElement('div');editor.dataset.control=control;panel.append(editor);editors.set(control,editor);
        if(control==='model')continue;
        if(field.$ref)continue;
        const label=document.createElement('label'),input=document.createElement(field.enum?'select':'input');
        label.textContent=field.title;input.id=control.replaceAll('_','-');
        if(field.type==='boolean')input.type='checkbox';
        else if(field.enum)field.enum.forEach(value=>input.append(new Option(String(value),String(value))));
        else if(['integer','number'].includes(field.type)){input.type='number';if(field.minimum!==undefined)input.min=field.minimum;if(field.maximum!==undefined)input.max=field.maximum;input.step=field.type==='integer'?1:'any';}
        else throw Error('No editor for declared execution control '+control);
        input.onchange=()=>{if(input.reportValidity())change(control,field.type==='boolean'?input.checked:['integer','number'].includes(field.type)?Number(input.value):input.value);};label.append(input);editor.append(label);
        fields.push({control,input,field});
      }
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
    return {refresh,editor:control=>{if(!editors.has(control))throw Error('No declared editor home for '+control);return editors.get(control);},open:control=>homes.get(control)()};
  }
  return {mount};
})();
