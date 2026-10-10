/* Schema-owned configuration previews, separate from immutable execution evidence. */
globalThis.ConfigurationPreview = (() => {
  const schemas=Declarations.schemas;
  const resolve=field=>field.$ref ? schemas[field.$ref.split('/').at(-1)] : field;
  function defaults(field) {
    const schema=resolve(field);
    if(schema.type==='object') return Object.fromEntries(Object.entries(schema.properties).map(([key,child])=>[key,defaults(child)]));
    if(!Object.hasOwn(schema,'default')) throw new Error('Preview field needs a declared default');
    return schema.default;
  }
  function mount(focus, changed, modelOwners) {
    const schema=schemas.ConfigurationPreview, value=defaults(schema), controls=[];
    const read=path=>path.reduce((v,key)=>v[key],value);
    function fields(declaration, path, parent) {
      const owner=declaration['x-owner'];
      for(const [key,field] of Object.entries(declaration.properties)) {
        const child=resolve(field), keys=[...path,key];
        if(child.type==='object') {
          const group=document.createElement('fieldset'), legend=document.createElement('legend');
          legend.textContent=child.title;group.append(legend);parent.append(group);fields(child,keys,group);
        } else {
          const label=document.createElement('label'), select=document.createElement(child.oneOf ? 'select' : 'input');
          label.textContent=child.title;select.id='configure-'+keys.join('-');
          select.dataset.owner=owner;select.title=declaration.description;
          if(child.type==='integer') {select.type='number';select.min=child.minimum;select.max=child.maximum;select.step=1;}
          for(const choice of child.oneOf || []) {
            const option=document.createElement('option');option.value=choice.const;option.textContent=choice.title;select.append(option);
          }
          select.value=read(keys);label.append(select);parent.append(label);
          const item={owner,keys,field:child,select};controls.push(item);
          select.onchange=()=>{
            const target=keys.slice(0,-1).reduce((v,k)=>v[k],value);const next=structuredClone(value), targetNext=keys.slice(0,-1).reduce((v,k)=>v[k],next);
            targetNext[keys.at(-1)]=child.type==='integer' ? Number(select.value) : select.value;
            if(!select.reportValidity() || select.value==='') return;
            Declarations.assertShape('ConfigurationPreview',next);
            target[keys.at(-1)]=targetNext[keys.at(-1)];
            changed();focus(owner);refresh();
          };
        }
      }
      if(controls.some(c=>c.owner===owner && c.keys.length===path.length+1)) {
        const link=document.createElement('a');link.href='ontology.html#'+owner;link.textContent='Ontology ↗';parent.append(link);
      }
    }
    for(const key of Object.keys(schema.properties)) {
      const dialog=document.getElementById(key+'-dialog');
      const trigger=document.getElementById('open-'+key);
      trigger.onclick=()=>{trigger.focus();dialog.showModal();};
      dialog.querySelector('.dialog-close').onclick=()=>dialog.close();
      dialog.onclick=event=>{if(event.target===dialog) {
        const r=dialog.getBoundingClientRect();
        if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) dialog.close();
      }};
    }
    for(const key of Object.keys(schema.properties)) fields(resolve(schema.properties[key]),[key],document.getElementById('configure-'+key));
    // Traverse admitted system compositions, then the actual model's operation owners.
    // No settings are invented for concepts which have no declaration here.
    const owners=new Set(modelOwners), visited=new Set();
    function collect(name) {
      if(visited.has(name)) return;
      visited.add(name);const definition=schemas[name];owners.add(definition['x-owner']);
      for(const field of Object.values(definition.properties || {})) if(field.$ref) collect(field.$ref.split('/').at(-1));
    }
    const systemOwner=resolve(schema.properties.system)['x-owner'];
    Declarations.meanings[systemOwner].schemas.forEach(collect);
    const unavailable=document.getElementById('unavailable-system');
    for(const owner of owners) {
      if(owner===systemOwner || controls.some(c=>c.owner===owner)) continue;
      const row=document.createElement('div'), button=document.createElement('button'), link=document.createElement('a');
      button.type='button';button.disabled=true;button.dataset.concept=owner;
      button.textContent=owner.replace(/([A-Z]+)([A-Z][a-z])/g,'$1 $2').replace(/([a-z])([A-Z])/g,'$1 $2');
      button.title=Declarations.meanings[owner].meaning;
      link.href='ontology.html#'+owner;link.textContent='Ontology ↗';
      row.append(button,link);unavailable.append(row);
    }
    const modified=()=>controls.filter(c=>read(c.keys)!==c.field.default);
    const label=c=>c.field.oneOf ? c.field.oneOf.find(o=>o.const===read(c.keys)).title : c.field.title+': '+read(c.keys);
    function describe(owner) {
      return controls.filter(c=>c.owner===owner).map(label).join(' · ');
    }
    function refresh() {
      const changes=modified();
      for(const block of document.querySelectorAll('[data-configuration-owner]')) {
        const owner=block.dataset.configurationOwner, active=changes.some(c=>c.owner===owner);
        block.classList.toggle('configuration-changed',active);
        block.dataset.configuration=describe(owner);
      }
      const status=document.getElementById('configuration-status');
      status.hidden=!changes.length;
      status.textContent=changes.length ? changes.map(label).join(' · ')+' — preview only; recorded baseline below' : '';
    }
    function detail(owner) {
      const panel=document.getElementById('configuration-detail');
      panel.replaceChildren();panel.hidden=!controls.some(c=>c.owner===owner);
      if(panel.hidden) return;
      const caption=document.createElement('strong');caption.textContent='Configured: '+describe(owner);panel.append(caption);
      if(modified().some(c=>c.owner===owner)) panel.append(document.createTextNode(' · preview only'));
    }
    Declarations.assertShape('ConfigurationPreview',value);
    return {refresh,detail,executable:()=>modified().length===0};
  }
  return {mount};
})();
