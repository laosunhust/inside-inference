/* Complete declared configurations; selecting never executes a generation. */
globalThis.Experiments=(()=>{
  const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
  const contractFields=Declarations.schemas.AbstractionContract.properties;
  const title=key=>key.replaceAll('_',' ');
  function settings(input){
    const rows=[];
    function visit(schema,value,path){
      if(schema.$ref)return visit(Declarations.schemas[schema.$ref.split('/').at(-1)],value,path);
      if(schema.properties){for(const [key,field] of Object.entries(schema.properties))if(Object.hasOwn(value,key))visit(field,value[key],[...path,field.title||title(key)]);}
      else rows.push([path.join(' · '),typeof value==='boolean'?(value?'On':'Off'):String(value)]);
    }
    for(const control of input.execution.experiments){const definition=Declarations.schemas.ExecutionControl.oneOf.find(d=>d.properties.control.const===control.control);visit(definition.properties.value,control.value,[title(control.control)]);}
    input.workload.requests.forEach(request=>{
      rows.push([request.request_id+' · Arrival',request.arrival_us+' virtual µs']);
      visit(Declarations.schemas.InferenceRequest,request.request,[request.request_id]);
    });
    return InspectionDetails.table(['Setting','Configured value'],rows);
  }
  function card(experiment,configure) {
    const box=el('details',undefined,'experiment'),summary=el('summary');box.dataset.experiment=experiment.id;
    const planned=experiment.missing_controls.length>0;
    summary.append(el('strong',experiment.name),el('span',planned?'Planned':'Configurable','experiment-status'));
    box.append(summary,el('p',experiment.question));
    if(planned)box.append(el('p','Needs: '+experiment.missing_controls.map(title).join(', '),'experiment-missing'));
    for(const [index,variant] of experiment.variants.entries()){
      const section=el('div',undefined,'experiment-variant'),button=el('button',variant.label);
      button.type='button';button.dataset.configureExperiment=experiment.id;button.dataset.variant=index;button.onclick=()=>configure(variant);
      const preview=el('details');preview.append(el('summary','Input and system settings'),settings(variant.input));section.append(button,preview);box.append(section);
    }
    const contract=el('details'),fields=el('dl');contract.append(el('summary','Scope and evidence'),fields);
    for(const [key,field] of Object.entries(contractFields))fields.append(el('dt',field.title),el('dd',experiment.contract[key]));
    box.append(contract);
    if(experiment.sources.length){const list=el('ul');for(const s of experiment.sources){const item=el('li'),a=el('a',s.title);a.href=s.url;item.append(a);list.append(item);}box.append(list);}
    return box;
  }
  function mount(container,configure){container.append(...Object.values(Declarations.experiments).map(e=>card(e,configure)));}
  return {mount,settings};
})();
