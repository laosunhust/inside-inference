/* Render only accepted observations. No numerical execution or alternate model state. */
globalThis.InspectionDetails=(()=>{
  const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
  const json=value=>{const p=el('pre',JSON.stringify(value,null,2));p.className='raw-values';return p;};
  function table(headers,rows) {
    const wrap=el('div');wrap.className='table-scroll';const t=el('table'),head=el('tr');
    headers.forEach(h=>head.append(el('th',h)));t.append(head);
    rows.forEach(row=>{const tr=el('tr');row.forEach(v=>tr.append(el('td',v)));t.append(tr);});wrap.append(t);return wrap;
  }
  function render(s,inspect,ontology) {
    const $=id=>document.getElementById(id),body=$('detail-body'),step=s.step,view=s.view;
    body.replaceChildren();
    const node=step?.nodes.find(n=>n.id===view.observation_id);
    const stage=view.surface==='architecture'?InspectionSession.architecture(s)[view.architecture_step]:null;
    const owner=stage?stage.owner:node?Declarations.operationOwners[node.operation.name]:({request:'Tokenizer',workload:'Workload',system:'ModelExecution',client:'CustomerInteraction',selection:'Decoding',response:'InferenceResponse'})[view.surface];
    const meaning=Declarations.meanings[owner];
    $('detail-title').textContent=stage?.label || node?.operation.name || ({request:'Input tokens',workload:'Workload',system:'Execution',client:'Client',selection:'Next-token scores',response:'Output'})[view.surface];
    $('definition').textContent='';
    $('definition-link').href='ontology.html#'+owner;
    const labs=Declarations.labs.filter(l=>l.ontology_binding.primary===owner&&l.status==='mechanical-demo');
    $('labs-link').hidden=!labs.length;$('labs-empty').hidden=!!labs.length;
    $('labs-link').textContent=`Labs (${labs.length}) ↗`;if(labs.length)$('labs-link').href='labs-by-concept.html#'+owner;else $('labs-link').removeAttribute('href');
    $('inspection-context').dataset.observationId=node?.id || '';
    $('inspection-context').dataset.surface=view.surface;
    $('inspection-context').dataset.position=view.position;
    $('inspection-context').textContent=node?node.formula:'';
    const pieces=s.loaded?.token_pieces || [];
    const piece=id=>(pieces[id] || '').replaceAll(' ','␠');
    if(stage) {
      $('inspection-context').textContent=`Architecture walkthrough${stage.layer===null?'':` · layer ${stage.layer+1}`}`;
      body.append(el('p',stage.detail));
    } else if(node) {
      const selector=el('select');selector.id='tensor-choice';selector.setAttribute('aria-label','Executed tensor');
      step.nodes.filter(n=>Declarations.operationOwners[n.operation.name]===owner).forEach(n=>selector.append(new Option(`${n.operation.name} · ${n.shape.join(' × ')}`,n.id)));
      selector.value=node.id;selector.onchange=()=>inspect({surface:'model',observation_id:selector.value});body.append(selector);
      const row=Math.min(view.position,step.sequence_ids.length-2);
      body.append(el('p',`${node.shape.join(' × ')} · ${node.dtype} · row ${row}`));
      if(['attention','scores','causal_mask'].includes(node.operation.name)) {
        const heat=el('div');heat.className='attention-grid';heat.style.gridTemplateColumns=`repeat(${node.shape[1]},minmax(20px,1fr))`;
        node.values.forEach((values,i)=>values.forEach((value,j)=>{const cell=el('button');cell.className='heat-cell'+(i===row?' heat-selected':'');cell.title=`p${i} ${piece(step.sequence_ids[i])} → p${j} ${piece(step.sequence_ids[j])}: ${value}`;cell.setAttribute('aria-label',cell.title);cell.style.setProperty('--heat-strength',String(node.operation.name==='attention'?value:node.operation.name==='causal_mask'?Number(value):.35));heat.append(cell);}));
        const wrap=el('div');wrap.className='table-scroll';wrap.append(heat);body.append(wrap);
      }
      const values=node.shape.length===1?[node.values[row]]:node.values[row];
      body.append(table([node.axes[1] || 'Index','Value'],values.map((v,i)=>[node.operation.name==='logits'?`${i} ${piece(i)}`:i,typeof v==='number'?v.toPrecision(6):v])));
      const full=el('details'),record=el('script',JSON.stringify(node));record.type='application/json';full.append(el('summary','Full tensor'),json(node),record);body.append(full);
      const dependencies=el('div');dependencies.id='observation-inputs';dependencies.append(el('h3','Inputs'));
      for(const id of node.inputs) {
        const source=step.nodes.find(n=>n.id===id);
        if(source){const b=el('button',source.operation.name);b.dataset.observationId=id;b.onclick=()=>inspect({surface:'model',observation_id:id});dependencies.append(b);}
        else if(id.startsWith('parameter:')) {
          const name=id.slice(10),parameter=s.loaded.parameters[name],value=node.layer===null?parameter:parameter?.[node.layer];
          if(value===undefined)throw Error('Missing recorded parameter '+id);
          const d=el('details');d.dataset.parameter=name;d.append(el('summary',id),json(value));dependencies.append(d);
        } else throw Error('Unresolved observation input '+id);
      }
      body.append(dependencies);
    } else if(view.surface==='selection' && step) {
      body.append(table(['Token','ID','Logit','Probability'],step.logits.map((value,id)=>({value,id})).sort((a,b)=>b.value-a.value||a.id-b.id).slice(0,20).map(({value,id})=>[piece(id),id,value.toPrecision(6),step.probabilities[id].toPrecision(6)])));
      const full=el('details');full.append(el('summary','All logits'));full.ontoggle=()=>{if(full.open&&full.children.length===1)full.append(json(step.logits));};body.append(full);
    } else if(view.surface==='system') {
      body.append(el('p',s.loaded?.model.runtime==='naive-python'?'Full-prefix computation · tensor capture':'Compiled WebAssembly · KV reuse · logits only'));
      body.append(json(s.input.experiment));
    } else if(view.surface==='request') {
      const ids=step?[...step.request.prefix_ids,...step.request.output_ids]:s.prepared?.prompt_ids || [];
      body.append(table(['Position','ID','Token'],ids.map((id,i)=>[i,id,piece(id)])));
      if(!step&&s.prepared?.encoding) {
        const d=el('details');d.append(el('summary','Tokenizer decisions'),json(s.prepared.encoding));body.append(d);
      }
    } else if(view.surface==='workload')body.append(json(s.input.workload));
    else if(view.surface==='response') {
      if(step){const b=el('button','Inspect next-token scores');b.id='response-selection';b.onclick=()=>inspect({surface:'selection',observation_id:null});body.append(b);}
      body.append(json({output_ids:step?.output_ids || [],stop_reason:step?.stop_reason || null}));
    } else body.append(el('p',meaning?.meaning || 'No observation yet.'));
  }
  return {render,table};
})();
