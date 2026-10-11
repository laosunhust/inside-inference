import assert from 'node:assert/strict';

// Walk actual rendered dependencies from logits to inputs, not a test-only UI accessor.
export async function checkInspection(evaluate, run, prediction) {
  const pass=run.computation || run.traces[0].passes[prediction];
  const observed=await evaluate(`(() => {
    const path=Array.from(document.querySelectorAll('#computation-path > li'),item=>({
      observations:JSON.parse(item.dataset.observations), inputs:JSON.parse(item.dataset.inputs),
      operation:item.querySelector('[data-operation]').dataset.operation,
      label:item.querySelector('strong').textContent
    }));
    for(const item of document.querySelectorAll('#computation-path > li')) {
      const button=item.querySelector('[data-operation]');button.click();
      const actual=JSON.parse(document.querySelector('#detail-body > details script').textContent);
      if(actual.operation.name!==button.dataset.operation || !JSON.parse(item.dataset.observations).includes(actual.id)) throw new Error('Stage opens a different computation');

    }
    if(document.querySelector('#inspect-tokenizer, #inspect-selection, #inspect-publication, #generation-loop')) throw new Error('Detached computation controls returned');
    document.getElementById('output-details').click();
    document.getElementById('response-selection').click();
    if(document.querySelector('#inspect-projection strong').textContent!=='Vocabulary projection') throw new Error('Ambiguous operation labels');
    function checkLabs(owner) {
      const count=Declarations.labs.filter(l=>l.ontology_binding.primary===owner && l.status==='mechanical-demo').length;
      const link=document.getElementById('labs-link'), empty=document.getElementById('labs-empty');
      if(link.hidden!==(count===0) || empty.hidden!==(count>0)) throw new Error('Lab availability differs from primary executable catalog entries');
      if(count ? link.getAttribute('href')!=='labs-by-concept.html#'+owner || link.textContent!=='Labs ('+count+') ↗' : link.hasAttribute('href') || empty.textContent!=='No primary lab yet') throw new Error('Misleading lab link or empty state');
    }
    checkLabs('Decoding');
    document.getElementById('selection-logits').click();
    const nodes=[], parameters={}, rows={}, links={}, seen=new Set();
    function visit() {
      const node=JSON.parse(document.querySelector('#detail-body > details script').textContent);
      const context=document.getElementById('inspection-context').dataset;
      if(context.observationId!==node.id || context.passId!==${JSON.stringify(pass.id)} || context.runId!==${JSON.stringify(run.id)}) throw new Error('Disconnected inspection identity');
      if(seen.has(node.id)) return;
      seen.add(node.id); nodes.push(node);
      const owner=Declarations.operationOwners[node.operation.name];
      const ontology=document.getElementById('definition-link').getAttribute('href');
      const labs=document.getElementById('labs-link').getAttribute('href');
      if(ontology!=='ontology.html#'+owner) throw new Error('Step links differ from the declared semantic owner');
      checkLabs(owner);
      links[node.id]={owner,ontology,labs};
      rows[node.id]=Array.from(document.querySelectorAll('#detail-body table tr')).slice(1).map(tr=>tr.cells[1].textContent);
      for(const element of document.querySelectorAll('#observation-inputs [data-parameter]')) {
        parameters[element.dataset.parameter]=JSON.parse(element.querySelector('pre').textContent);
      }
      const inputs=Array.from(document.querySelectorAll('#observation-inputs button'),b=>b.dataset.observationId);
      for(const id of inputs) {
        Array.from(document.querySelectorAll('#observation-inputs button')).find(b=>b.dataset.observationId===id).click();
        visit();
        const back=Array.from(document.querySelectorAll('#observation-outputs button')).find(b=>b.dataset.observationId===node.id);
        if(!back) throw new Error('Missing consumer link');
        back.click();
      }
    }
    visit();
    return {nodes,parameters,rows,links,path,edges:Array.from(document.querySelectorAll('#execution-edges path'),p=>[Number(p.dataset.source),Number(p.dataset.target)]),height:document.querySelector('.execution-endpoint').getBoundingClientRect().height,position:Number(document.getElementById('inspection-context').dataset.position)};
  })()`);
  assert.deepEqual(observed.nodes.toSorted((a,b)=>a.id.localeCompare(b.id)),pass.nodes.toSorted((a,b)=>a.id.localeCompare(b.id)));
  assert.deepEqual(observed.path.flatMap(stage=>stage.observations),pass.nodes.map(n=>n.id));
  for(const stage of observed.path) {
    const members=pass.nodes.filter(n=>stage.observations.includes(n.id));
    const owners=new Set(members.map(n=>observed.links[n.id].owner));
    assert.equal(owners.size,1,'A stage combines unrelated ontology owners');
    const inputs=[...new Set(members.flatMap(n=>n.inputs).filter(id=>pass.nodes.some(n=>n.id===id) && !stage.observations.includes(id)))];
    assert.deepEqual(stage.inputs,inputs,'Stage dependencies differ from execution');
  }
  const expectedEdges=observed.path.flatMap((stage,target)=>[...new Set(stage.inputs.map(id=>observed.path.findIndex(s=>s.observations.includes(id))))].map(source=>[source,target]));
  assert.deepEqual(observed.edges,expectedEdges,'Diagram arrows differ from trace dependencies');
  assert.ok(observed.height<380,'Computation overview should remain compact');
  const stages=observed.path.map(s=>s.operation);
  assert.ok(stages.indexOf('token_embedding')<stages.indexOf('embedding'));
  assert.ok(stages.indexOf('position_embedding')<stages.indexOf('embedding'));
  assert.deepEqual(stages.filter(name=>['ln1','ln2','ln_final'].includes(name)),['ln1','ln2','ln_final']);
  assert.deepEqual(stages.filter(name=>name.endsWith('_residual')),['attention_residual','ff_residual']);
  assert.equal(observed.path.find(s=>s.operation==='position_embedding').inputs.length,0,'Position lookup must not consume token embeddings');
  for(const node of pass.nodes) {
    const row=node.shape.length===1 ? [node.values[pass.selection_position]] : node.values[pass.selection_position];
    assert.deepEqual(observed.rows[node.id],row.map(v=>typeof v==='number' ? v.toPrecision(6) : String(v)));
  }
  for(const [name,value] of Object.entries(observed.parameters)) assert.deepEqual(value,(run.checkpoint || run.traces[0].checkpoint).parameters[name]);
  const referenced=new Set(pass.nodes.flatMap(n=>n.inputs).filter(id=>id.startsWith('parameter:')).map(id=>id.slice(10)));
  assert.deepEqual(Object.keys(observed.parameters).sort(),[...referenced].sort());
  assert.equal(observed.position,pass.selection_position);
}

// Exercise actual timed replay; virtual browser time avoids adding presentation delays to the harness.
export async function checkJourney({send,evaluate,until,click},run) {
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  assert.equal(await evaluate(`(() => {
    const input=document.getElementById('workload-boundary'),output=document.getElementById('client-boundary');
    return input.nextElementSibling===output && output.nextElementSibling.id==='sequence-details' &&
      output.nextElementSibling.nextElementSibling.classList.contains('execution-journey') &&
      document.documentElement.scrollWidth<=innerWidth;
  })()`),true,'Input, Output and token details precede the journey without mobile page overflow');
  const before=await evaluate(`document.getElementById('inspection-context').dataset.position`);
  const output=await evaluate(`document.getElementById('response-preview').textContent`);
  await evaluate(`window.journeyVisits=[]; window.journeyObserver=new MutationObserver(()=>{
    const context=document.getElementById('inspection-context').dataset;
    const tensor=document.querySelector('#detail-body > details script');
    const selected=document.querySelector('#computation-path .selected-object');
    const stage=selected?.getBoundingClientRect(), viewport=document.querySelector('.execution-scroll').getBoundingClientRect();
    window.journeyVisits.push({surface:context.surface,id:context.observationId,position:context.position,output:document.getElementById('response-preview').textContent,
      tensor:tensor ? JSON.parse(tensor.textContent) : null,
      visible:!stage || stage.left>=viewport.left && stage.right<=viewport.right,
      highlighted:selected ? JSON.parse(selected.parentElement.dataset.observations) : []});
  }); window.journeyObserver.observe(document.getElementById('inspection-context'),{attributes:true,childList:true});`);
  await click('token-journey');
  assert.equal(await evaluate(`document.getElementById('inspection-context').dataset.surface`),'request');
  await click('token-journey');
  assert.equal(await evaluate(`document.getElementById('token-journey').getAttribute('aria-pressed')`),'false');
  await click('token-journey');
  await click('inspect-layers');
  assert.equal(await evaluate(`document.getElementById('token-journey').getAttribute('aria-pressed')`),'false','Manual selection cancels replay');
  await evaluate('window.journeyVisits=[]');
  await click('token-journey');
  await send('Emulation.setVirtualTimePolicy',{policy:'advance',budget:30000});
  await until(`document.getElementById('token-journey').getAttribute('aria-pressed')==='false'`);
  await send('Emulation.setVirtualTimePolicy',{policy:'advance'});
  const visits=await evaluate(`window.journeyObserver.disconnect(); window.journeyVisits`);
  const tensors=visits.filter(v=>v.surface==='model');
  assert.deepEqual(tensors.map(v=>v.tensor),(run.computation || run.traces[0].passes[0]).nodes);
  tensors.forEach(v=>{assert.equal(v.id,v.tensor.id);assert.ok(v.highlighted.includes(v.id));assert.ok(v.visible,'Replay stage must stay visible on narrow screens');});
  assert.deepEqual(visits.map(v=>v.surface),['request','system',...tensors.map(()=>'model'),'selection','response']);
  visits.forEach(v=>{assert.equal(v.position,before,'Replay must preserve the generation prefix');assert.equal(v.output,output,'Inspection must not rewrite accepted output');});
  assert.equal(await evaluate(`document.getElementById('dispatch-label').textContent`),'Direct dispatch');
  assert.equal(await evaluate(`document.querySelector('.execution-endpoint #computation-path')!==null`),true);
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
}

export async function checkShortInput({evaluate,until,click}) {
  await evaluate(`document.getElementById('prompt').value='ann has '; document.getElementById('prompt').dispatchEvent(new Event('input')); document.getElementById('output-budget').value=2; document.getElementById('output-budget').dispatchEvent(new Event('change')); document.getElementById('inference-form').requestSubmit()`);
  await until(`document.getElementById('binding-status').dataset.phase==='ready'`);
  const ids=await evaluate(`Array.from(document.querySelectorAll('#sequence-strip button small'),n=>Number(n.textContent.split('#')[1]))`);
  assert.deepEqual(ids.slice(0,8),[0,3,331,6,131,6,5,4]);
  assert.equal(ids.length,8,'Applying input performs tokenization without inference');
  assert.equal(await evaluate(`document.getElementById('response-preview').textContent`),'');
  await click('next-token');await until(`document.getElementById('binding-status').dataset.phase==='ready'`);
  assert.equal(await evaluate(`document.getElementById('sequence-details').hidden`),true);
  assert.equal(await evaluate(`document.getElementById('request-preview').textContent`),'ann has ');
  await click('token-journey');
  await evaluate(`document.getElementById('prompt').value='ann has'; document.getElementById('prompt').dispatchEvent(new Event('input'))`);
  assert.equal(await evaluate(`document.getElementById('token-journey').getAttribute('aria-pressed')`),'false');
  assert.equal(await evaluate(`document.getElementById('token-journey').disabled`),true);
}
