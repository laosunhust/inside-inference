/* Navigation comes from admitted composition, not an inferred execution trace. */
globalThis.SystemMap=(()=>{
  const label=owner=>owner.replace(/([a-z])([A-Z])|([A-Z])([A-Z][a-z])/g,'$1$3 $2$4');
  function mount(root,engine) {
    const map=Declarations.schemas.InferenceMap.const;
    Declarations.assertShape('InferenceMap',map);
    const regions=new Map();
    function link(text,href){const a=document.createElement('a');a.textContent=text;a.href=href;return a;}
    function concept(owner) {
      const term=Declarations.meanings[owner],row=document.createElement('details'),summary=document.createElement('summary');
      row.className='map-concept';row.dataset.owner=owner;summary.textContent=label(owner);row.append(summary);
      const meaning=document.createElement('p');meaning.textContent=term.meaning;row.append(meaning);
      const links=document.createElement('div');links.className='map-links';links.append(link('Ontology ↗',`ontology.html#${owner}`));
      const primary=Declarations.labs.filter(lab=>lab.ontology_binding.primary===owner&&lab.status==='mechanical-demo');
      for(const lab of primary)links.append(link(lab.name+' ↗',`labs/${lab.id}.html`));
      if(!primary.length){const empty=document.createElement('small');empty.textContent='No runnable primary lab';links.append(empty);}
      row.append(links);return row;
    }
    for(const area of map.areas) {
      const region=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('div');
      region.className='map-area';region.id=`map-${area.id}`;region.dataset.mapArea=area.id;region.dataset.view=area.view;region.open=area.expanded;
      summary.textContent=area.title;body.className='map-body';region.append(summary,body);regions.set(area.id,region);
      let concepts=body;
      if(area.view==='engine') {
        body.append(engine);
        concepts=document.createElement('details');const title=document.createElement('summary');title.textContent='Concepts & labs';concepts.className='map-concepts';concepts.append(title);body.append(concepts);
      }
      area.concepts.forEach(owner=>concepts.append(concept(owner)));
      if(area.gaps.length){const gaps=document.createElement('p');gaps.className='map-gaps';gaps.textContent='Not yet declared: '+area.gaps.join('; ')+'.';body.append(gaps);}
      const edges=map.relationships.filter(edge=>edge.source===area.id);
      if(edges.length){const relations=document.createElement('div');relations.className='map-relations';
        for(const edge of edges){const destination=map.areas.find(a=>a.id===edge.target),a=link(`${edge.label} ${destination.title.toLowerCase()}`,`#map-${edge.target}`);
          a.onclick=()=>{regions.get(edge.target).open=true;};relations.append(a);}
        body.append(relations);
      }
      root.append(region);
    }
    return {reveal(owner){const area=map.areas.find(a=>a.concepts.includes(owner));if(area)regions.get(area.id).open=true;}};
  }
  return {mount};
})();
