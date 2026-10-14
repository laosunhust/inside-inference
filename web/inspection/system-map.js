/* Both surfaces use this containment tree. Configuration supplies editors, not structure. */
globalThis.SystemMap=(()=>{
  const label=owner=>owner.replace(/([a-z])([A-Z])|([A-Z])([A-Z][a-z])/g,'$1$3 $2$4');
  function mount(root,engine=null,configure=null) {
    const map=Declarations.schemas.InferenceMap.const,definitions=Declarations.schemas.ExperimentSpec.oneOf;
    Declarations.assertShape('InferenceMap',map);
    const regions=new Map(),panels=new Map(),settings=new Map(),prefix=configure?'configure':'map';
    const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
    const link=(text,href)=>{const a=el('a',text);a.href=href;return a;};
    function open(id,value=true){const row=regions.get(id),body=panels.get(id);body.hidden=!value;row.querySelector(':scope>button')?.setAttribute('aria-expanded',String(value));}
    function reveal(owner){let node=map.nodes.find(n=>n.owner===owner);while(node){open(node.id);node=map.nodes.find(n=>n.id===node.parent);}}
    for(const node of map.nodes){
      const row=el('section'),body=el('div'),button=el('button',label(node.owner));
      row.className='map-node';row.id=`${prefix}-${node.id}`;row.dataset.mapNode=node.id;row.dataset.owner=node.owner;row.dataset.mapParent=node.parent??'';row.dataset.kind=node.kind;row.dataset.view=node.view;
      body.id=`${prefix}-${node.id}-body`;body.className='map-body';button.type='button';button.setAttribute('aria-controls',body.id);button.setAttribute('aria-expanded',String(node.expanded));
      const controls=definitions.filter(d=>d.properties.ontology_binding.const.primary===node.owner),children=map.nodes.filter(n=>n.parent===node.id);
      button.disabled=!!configure&&!controls.length&&!children.length;
      button.onclick=()=>open(node.id,body.hidden);body.hidden=!node.expanded;
      if(configure&&node.view==='engine'&&!controls.length)body.hidden=true;
      button.setAttribute('aria-expanded',String(!body.hidden));
      regions.set(node.id,row);panels.set(node.id,body);
      if(node.parent===null){row.classList.add('map-root');body.hidden=false;}else row.append(button);
      row.append(body);
      if(configure)configure(node,body,controls);
      else {
        const description=el('details');description.className='map-description';description.append(el('summary',node.parent===null?'About this system':'First principles'),...Principles.of(node.owner).map(Principles.render),el('p',Declarations.meanings[node.owner].meaning));body.append(description);
        const links=el('div');links.className='map-links';links.append(link('Ontology ↗',`ontology.html#${node.owner}`));
        for(const lab of Declarations.labs.filter(l=>l.ontology_binding.primary===node.owner&&l.status==='mechanical-demo'))links.append(link(lab.name+' ↗',`labs/${lab.id}.html`));
        description.append(links);
        for(const definition of controls){const control=definition.properties.control.const,projection=el('div');projection.dataset.explanationControl=control;body.append(projection);settings.set(control,{projection,definition});}
        if(node.view==='engine')body.append(engine);
        const edges=map.relationships.filter(e=>e.source===node.id);
        if(edges.length){const relations=el('div');relations.className='map-relations';
          for(const edge of edges){const target=map.nodes.find(n=>n.id===edge.target),a=link(`${edge.label} ${label(target.owner).toLowerCase()}`,`#map-${target.id}`);a.onclick=()=>reveal(target.owner);relations.append(a);}body.append(relations);
        }
      }
    }
    for(const node of map.nodes){const row=regions.get(node.id);if(node.parent===null)root.append(row);else {const parent=panels.get(node.parent);let children=parent.querySelector(':scope>.map-children');if(!children){children=el('div');children.className='map-children';parent.append(children);}children.append(row);}}
    function values(schema,value,name){
      if(schema.$ref)return values(Declarations.schemas[schema.$ref.split('/').at(-1)],value,name);
      if(schema.properties)return Object.entries(schema.properties).flatMap(([key,s])=>values(s,value[key],s.title||label(key.replaceAll('_',' '))));
      return [[schema.title||name,typeof value==='boolean'?(value?'On':'Off'):String(value)]];
    }
    function refresh(execution){for(const [control,{projection,definition}] of settings){const setting=execution.experiments.find(e=>e.control===control);projection.replaceChildren();projection.dataset.value=JSON.stringify(setting?.value??null);if(setting)projection.append(InspectionDetails.table(['Setting','Applied value'],values(definition.properties.value,setting.value,label(control.replaceAll('_',' ')))));}}
    return {reveal,refresh,open:owner=>reveal(owner)};
  }
  return {mount};
})();
