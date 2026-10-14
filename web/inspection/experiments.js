/* Declared experiments. Executable ones apply their settings; planned ones name the controls they lack. */
globalThis.Experiments=(()=>{
  const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
  const contractFields=Declarations.schemas.AbstractionContract.properties;
  function card(experiment,apply) {
    const box=el('details',undefined,'experiment'),summary=el('summary');box.dataset.experiment=experiment.id;
    const planned=experiment.missing_controls.length>0;
    summary.append(el('strong',experiment.name),el('span',planned?'Planned':'Ready','experiment-status'));
    box.append(summary,el('p',experiment.question));
    if(planned)box.append(el('p','Needs: '+experiment.missing_controls.map(c=>c.replaceAll('_',' ')).join(', '),'experiment-missing'));
    else{const button=el('button','Apply');button.type='button';button.dataset.applyExperiment=experiment.id;button.onclick=()=>apply(experiment);box.append(button);}
    const contract=el('details'),fields=el('dl');contract.append(el('summary','Abstraction contract'),fields);
    for(const [key,field] of Object.entries(contractFields))fields.append(el('dt',field.title),el('dd',experiment.contract[key]));
    box.append(contract);
    if(experiment.sources.length){const list=el('ul');for(const s of experiment.sources){const item=el('li'),a=el('a',s.title);a.href=s.url;item.append(a);list.append(item);}box.append(list);}
    return box;
  }
  function mount(container,apply){container.append(...Object.values(Declarations.experiments).map(e=>card(e,apply)));}
  return {mount};
})();
