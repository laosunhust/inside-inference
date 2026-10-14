import assert from 'node:assert/strict';

export async function checkMap({evaluate,send},initial=false) {
  const result=await evaluate(`(()=>{
    const map=Declarations.schemas.InferenceMap.const;
    const path=node=>node.parent===null?[node.id]:[...path(map.nodes.find(n=>n.id===node.parent)),node.id];
    const actual=root=>Array.from(document.querySelectorAll(root+' .map-node'),e=>{
      const ids=[];for(let at=e;at;at=at.parentElement.closest('.map-node'))ids.unshift(at.dataset.mapNode);
      return {id:e.dataset.mapNode,owner:e.dataset.owner,parent:e.parentElement.closest('.map-node')?.dataset.mapNode??null,path:ids,label:e.querySelector(':scope>button')?.textContent??null,meaning:e.querySelector(':scope>.map-body>.map-description>p')?.textContent,open:!e.querySelector(':scope>.map-body').hidden};
    });
    return {expected:map.nodes.map(n=>({...n,path:path(n),meaning:Declarations.meanings[n.owner].meaning})),explanation:actual('#system-map'),configuration:actual('#configure-system'),
      links:Array.from(document.querySelectorAll('#system-map .map-links a'),a=>a.getAttribute('href')),
      labLinks:Declarations.labs.filter(l=>l.status==='mechanical-demo').map(l=>'labs/'+l.id+'.html')};
  })()`);
  const structure=nodes=>nodes.map(({id,owner,parent,path,label})=>({id,owner,parent,path,label}));
  assert.deepEqual(structure(result.configuration),structure(result.explanation),'Configuration and Explanation must have identical full containment paths');
  const expected=result.expected.map(({id,owner,parent,path})=>({id,owner,parent,path}));
  for(const nodes of [result.configuration,result.explanation])assert.deepEqual(nodes.map(({id,owner,parent,path})=>({id,owner,parent,path})),expected,'Rendered nesting must match the declared hierarchy');
  assert.deepEqual(result.explanation.map(n=>n.meaning),result.expected.map(n=>n.meaning),'Every system node has its ontology explanation');
  if(initial)for(let i=0;i<result.expected.length;i++)assert.equal(result.explanation[i].open,result.expected[i].expanded);
  assert.equal(await evaluate("document.getElementById('numerics').contains(document.getElementById('switch-inspection')) && !document.getElementById('system-map').contains(document.getElementById('switch-inspection'))"),true);
  assert.equal(await evaluate("document.getElementById('numerics').open"),await evaluate("document.getElementById('inspection-unavailable').hidden"));
  assert.ok(!result.expected.some(n=>['CustomerInteraction','GenerationPolicy'].includes(n.owner)));
  assert.deepEqual(result.links.filter(l=>l.startsWith('labs/')).sort(),result.labLinks.sort());
  assert.equal(await evaluate("document.getElementById('numerics').contains(document.getElementById('concept-body'))"),false);
  if(initial){
    assert.equal(await evaluate(`(()=>{const before=document.getElementById('run-identity').textContent;for(const b of document.querySelectorAll('#system-map .map-node>button')){const original=b.getAttribute('aria-expanded');b.click();if(b.getAttribute('aria-expanded')===original)return false;b.click();if(b.getAttribute('aria-expanded')!==original)return false;}return before===document.getElementById('run-identity').textContent;})()`),true);
    await evaluate("document.querySelector('#map-endpoint>button').focus()");
    for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key:'Enter',code:'Enter',windowsVirtualKeyCode:13,...(type==='keyDown'?{text:'\r'}:{})});
    assert.equal(await evaluate("document.querySelector('#map-endpoint>.map-body').hidden"),false);
    for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key:'Enter',code:'Enter',windowsVirtualKeyCode:13,...(type==='keyDown'?{text:'\r'}:{})});
    assert.equal(await evaluate("document.querySelector('#map-endpoint>.map-body').hidden"),true);
    await evaluate("document.querySelector('#map-state>button').click()");
  }else assert.equal(await evaluate("document.querySelector('#map-state>.map-body').hidden"),false,'Expansion survives generation and model changes');
}

export async function checkJourney({evaluate},expectedIds) {
  const diagram=await evaluate(`(()=>{
    const stages=Declarations.schemas.ArchitectureWalkthrough.const.stages;
    return {expectedLabels:stages.map(s=>s.label),
      labels:Array.from(document.querySelectorAll('#computation-path button'),b=>b.textContent),
      expectedEdges:stages.flatMap((s,target)=>s.inputs.map(source=>[source,target])),
      edges:Array.from(document.querySelectorAll('#execution-edges path[data-source]'),e=>[Number(e.dataset.source),Number(e.dataset.target)])};
  })()`);
  assert.deepEqual(diagram.labels,diagram.expectedLabels,'Every model must show the declared graph before and after execution');
  assert.deepEqual(diagram.edges,diagram.expectedEdges,'Residual edges must come from the shared declaration');
  await evaluate("document.querySelector('#computation-path button').click()");
  const ids=await evaluate("Array.from(document.querySelectorAll('#concept-body .token-readout small'),e=>Number(e.textContent.slice(1)))");
  assert.deepEqual(ids,expectedIds,'Token IDs must expose the actual executed prefix outside numerical inspection');
  await evaluate("document.querySelectorAll('#computation-path button')[1].click()");
  assert.match(await evaluate("document.getElementById('concept-body').textContent"),/→ #\d+ → embedding row \d+/,'Embedding connects an actual selected token to a vocabulary row');
}
