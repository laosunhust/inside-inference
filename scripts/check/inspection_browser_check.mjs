import assert from 'node:assert/strict';

// Walk actual rendered dependencies from logits to inputs, not a test-only UI accessor.
export async function checkInspection(evaluate, run, prediction) {
  const pass=run.traces[0].passes[prediction];
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
    document.getElementById('selected-token').click();
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
    return {nodes,parameters,rows,links,path,edges:Array.from(document.querySelectorAll('#execution-edges path'),p=>[Number(p.dataset.source),Number(p.dataset.target)]),height:document.querySelector('.execution-journey').getBoundingClientRect().height,position:Number(document.getElementById('inspection-context').dataset.position)};
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
  for(const [name,value] of Object.entries(observed.parameters)) assert.deepEqual(value,run.traces[0].checkpoint.parameters[name]);
  const referenced=new Set(pass.nodes.flatMap(n=>n.inputs).filter(id=>id.startsWith('parameter:')).map(id=>id.slice(10)));
  assert.deepEqual(Object.keys(observed.parameters).sort(),[...referenced].sort());
  assert.equal(observed.position,pass.selection_position);
}
