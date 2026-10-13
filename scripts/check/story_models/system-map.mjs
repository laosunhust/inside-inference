import assert from 'node:assert/strict';

export async function checkMap({evaluate,send},initial=false) {
  const result=await evaluate(`(()=>{
    const map=Declarations.schemas.InferenceMap.const;
    const areas=Array.from(document.querySelectorAll('#system-map>.map-area'));
    return {expected:map.areas.map(a=>({id:a.id,title:a.title,concepts:a.concepts,open:a.expanded})),
      actual:areas.map(a=>({id:a.dataset.mapArea,title:a.querySelector(':scope>summary').textContent,
        concepts:Array.from(a.querySelectorAll('[data-owner]'),c=>c.dataset.owner),open:a.open})),
      links:Array.from(document.querySelectorAll('#system-map .map-links a'),a=>a.getAttribute('href')),
      labLinks:Declarations.labs.filter(l=>l.status==='mechanical-demo').map(l=>'labs/'+l.id+'.html')};
  })()`);
  for(let i=0;i<result.expected.length;i++) {
    const {open,...expected}=result.expected[i],{open:actualOpen,...actual}=result.actual[i];
    assert.deepEqual(actual,expected,'Every rendered area/concept must derive from the declared map');
    if(initial)assert.equal(actualOpen,open,'Only the engine opens by default');
  }
  assert.equal(result.actual.length,result.expected.length);
  assert.equal(await evaluate("document.getElementById('numerics').contains(document.getElementById('switch-inspection')) && !document.getElementById('system-map').contains(document.getElementById('switch-inspection'))"),true,'Model switching belongs with numerical limitations, not concepts');
  assert.equal(await evaluate("document.getElementById('numerics').open"),await evaluate("document.getElementById('inspection-unavailable').hidden"),'Initial numerical disclosure follows declared tensor capability');
  assert.ok(!result.actual.some(a=>a.concepts.includes('CustomerInteraction')||a.concepts.includes('GenerationPolicy')),'Caller interaction and requested generation policy are outside the system map');
  assert.deepEqual(result.links.filter(l=>l.startsWith('labs/')).sort(),result.labLinks.sort(),'Only implemented primary labs appear, once each');
  assert.equal(await evaluate("document.getElementById('journey-dispatch')"),null,'Retire the placeholder route');
  assert.equal(await evaluate("document.getElementById('numerics').contains(document.getElementById('concept-body'))"),false,'Concept detail remains outside numerical disclosure');
  if(initial) {
    // Every disclosure is a real interactive control; opening it cannot run inference.
    assert.equal(await evaluate(`(()=>{
      const before=document.getElementById('run-identity').textContent;
      for(const area of document.querySelectorAll('#system-map>.map-area')) {
        const original=area.open;area.querySelector(':scope>summary').click();
        if(area.open===original)return false;
        area.querySelector(':scope>summary').click();if(area.open!==original)return false;
      }
      const numerics=document.getElementById('numerics'),open=numerics.open;
      numerics.querySelector('summary').click();if(numerics.open===open)return false;
      numerics.querySelector('summary').click();
      return before===document.getElementById('run-identity').textContent && numerics.open===open;
    })()`),true);
    await evaluate("document.querySelector('#system-map summary').focus()");
    for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key:'Enter',code:'Enter',windowsVirtualKeyCode:13,...(type==='keyDown'?{text:'\r'}:{})});
    assert.equal(await evaluate("document.querySelector('#system-map>.map-area').open"),true,'Keyboard activation expands a region');
    for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key:'Enter',code:'Enter',windowsVirtualKeyCode:13,...(type==='keyDown'?{text:'\r'}:{})});
    assert.equal(await evaluate("document.querySelector('#system-map>.map-area').open"),false);
    await evaluate("document.getElementById('map-state').open=true");
  } else assert.equal(await evaluate("document.getElementById('map-state').open"),true,'Expansion survives generation and model changes');
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
