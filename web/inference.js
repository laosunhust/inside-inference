/* Presentation only. Every displayed model value comes from the Python execution record. */
(async () => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!$('inference-data')) return;
  // Preserve the execution record's numerical representation for exact replay.
  let receipt=null;
  let session=InspectionSession.create(JSON.parse($('inference-data').textContent));
  let configuration;
  const accepted = () => session.prepared;
  const draftRequest = () => session.draft.requests[0].request;
  const ontology = JSON.parse($('ontology-data').textContent);
  const owner = node => Declarations.operationOwners[node.operation.name];
  const make = (tag, text, className) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  };
  const current = () => InspectionSession.computation(session);
  const sequence = () => InspectionSession.sequence(session);
  const executionId = () => session.step?.id || '';
  const observedPosition = () => Math.min(position(),current()?.selection_position ?? position());
  const displayedOutput = () => InspectionSession.output(session);
  const position = () => session.view.position;
  const playback = ExecutionPath.playback(() => renderStatus());
  const inspect = (view, automatic=false) => {
    if(!automatic) playback.stop();
    session = InspectionSession.transition(session,{type:'INSPECT',view}); renderPass();
    const stage=$('computation-path').querySelector('.selected-object')?.parentElement;
    if(stage) {
      const scroll=document.querySelector('.execution-scroll');
      if(stage.offsetLeft<scroll.scrollLeft || stage.offsetLeft+stage.offsetWidth>scroll.scrollLeft+scroll.clientWidth)
        scroll.scrollLeft=stage.offsetLeft-(scroll.clientWidth-stage.offsetWidth)/2;
    }
  };
  const entity = () => {
    if(session.view.surface!=='model') return session.view.surface;
    const stage=[...$('computation-path').children].find(el=>JSON.parse(el.dataset.observations).includes(session.view.observation_id));
    if(!stage) throw new Error('Selected observation has no diagram stage');
    return stage.querySelector('[data-entity]').dataset.entity;
  };
  const label = id => {
    const t = accepted().vocabulary[id];
    return t.kind === 'space' ? '␠' : t.kind === 'control' ? `<${t.piece}>` : t.piece;
  };
  const number = x => typeof x === 'number' ? x.toPrecision(6) : String(x);
  const json = value => make('pre', JSON.stringify(value, null, 2), 'raw-values');
  function table(headers, rows) {
    const wrapper = make('div', undefined, 'table-scroll'), t = make('table');
    const head = make('tr'); headers.forEach(h => head.append(make('th', h))); t.append(head);
    rows.forEach(row => { const tr = make('tr'); row.forEach(v => tr.append(make('td', v))); t.append(tr); });
    wrapper.append(t); return wrapper;
  }
  function tokenButton(id, pos) {
    const active=pos===position();
    const b = make('button', undefined, 'token-chip' + (active ? ' active' : ''));
    b.append(make('small', `p${pos} · #${id}`), make('strong', label(id)));
    b.disabled=session.phase==='running';
    b.setAttribute('aria-pressed',String(active));
    b.onclick = () => {
      const pass=InspectionSession.computation({...session,view:{...session.view,position:pos}});
      inspect({position:pos,surface:pass?'model':'request',observation_id:pass?.nodes.find(n=>n.operation.name==='embedding').id || null});
    };
    return b;
  }
  function chooseEntity(value) {
    const operation=document.querySelector(`[data-entity="${value}"]`)?.dataset.operation;
    const node=operation ? current()?.nodes.find(n=>n.operation.name===operation) : null;
    inspect({surface:node ? 'model' : operation ? 'system' : value,observation_id:node?.id || null});
  }
  function openObservation(node) {
    inspect({surface:'model',observation_id:node.id});
  }
  function renderExecutionPath() {
    const pass=current(), path=$('computation-path');
    $('dispatch-label').textContent=Declarations.schemas.InferenceSystem.properties.dispatch.title;
    document.querySelector('.execution-endpoint').hidden=!pass;
    document.querySelector('.system-route').hidden=!pass;
    document.querySelector('.execution-scroll').hidden=!pass;
    if(!pass) {
      path.replaceChildren();delete path.dataset.passId;delete path.dataset.runId;
      $('execution-edges').querySelectorAll('path').forEach(p=>p.remove());
      $('computation-caption').textContent=session.phase==='running'?'Computing…':'';
      return;
    }
    if(path.dataset.passId===pass.id && path.dataset.runId===executionId()) return;
    ExecutionPath.render(pass,executionId(),ontology,(selected,node)=>{
      inspect({surface:'model',observation_id:node.id});
    });
    $('dispatch-label').textContent=Declarations.schemas.InferenceSystem.properties.dispatch.title;
    $('computation-caption').textContent=`Prediction ${pass.step+1} · ${pass.phase}`;

  }
  function dependencies(body, node) {
    const links=make('div'); links.id='observation-inputs';
    links.append(make('h3','Actual inputs to this operation'));
    for(const id of node.inputs) {
      const input=current().nodes.find(n=>n.id===id);
      if(input) {
        const button=make('button',`${input.operation.name} [${input.shape.join(' × ')}]`);
        button.dataset.observationId=id; button.onclick=()=>openObservation(input); links.append(button);
      } else if(id.startsWith('parameter:')) {
        const name=id.slice('parameter:'.length), value=accepted().checkpoint.parameters[name];
        if(value===undefined) throw new Error(`Missing parameter ${id}`);
        const details=make('details'); details.dataset.parameter=name;
        details.append(make('summary',`${id} · bound checkpoint`),json(value)); links.append(details);
      } else throw new Error(`Unresolved observation input ${id}`);
    }
    if(!node.inputs.length) links.append(make('p','Input IDs supplied to this forward pass.'));
    body.append(links);
    const outputs=current().nodes.filter(n=>n.inputs.includes(node.id));
    if(outputs.length) {
      const next=make('div');next.id='observation-outputs';next.append(make('h3','Used by'));
      outputs.forEach(n=>{const b=make('button',n.operation.name);b.dataset.observationId=n.id;b.onclick=()=>openObservation(n);next.append(b);});body.append(next);
    }
  }
  function tensorView(body, filter) {
    const nodes = current().nodes.filter(filter), select = make('select');
    select.id = 'tensor-choice'; select.setAttribute('aria-label', 'Executed tensor');
    nodes.forEach(n => { const option = make('option', `${n.operation.name} [${n.shape.join(' × ')}]`); option.value = n.operation.name; select.append(option); });
    const node = nodes.find(n=>n.id===session.view.observation_id);
    if(!node) throw new Error('Selected observation is missing from this operation');
    select.value = node.operation.name;
    select.onchange = () => openObservation(nodes.find(n=>n.operation.name===select.value));
    body.append(select);
    body.append(make('p', node.formula, 'equation'));
    body.append(make('p', `Pass ${node.step} · position ${observedPosition()} · ${node.dtype} · axes: ${node.axes.join(' × ')}. Display: 6 significant digits.`));
    if (node.operation.name === 'attention' || node.operation.name === 'scores' || node.operation.name === 'causal_mask') {
      const heat = make('div', undefined, 'attention-grid');
      heat.style.gridTemplateColumns = `repeat(${node.shape[1]}, minmax(20px, 1fr))`;
      node.values.forEach((row, i) => row.forEach((value, j) => {
        const cell = make('button', undefined, 'heat-cell' + (i === observedPosition() ? ' heat-selected' : ''));
        cell.title = `query p${i} (${label(current().input_ids[i])}) → key p${j} (${label(current().input_ids[j])}): ${number(value)}`;
        cell.setAttribute('aria-label', cell.title);
        const strength = node.operation.name === 'attention' ? value : node.operation.name === 'causal_mask' ? Number(value) : 0.35;
        cell.style.setProperty('--heat-strength',String(strength));
        heat.append(cell);
      }));
      const scroll = make('div', undefined, 'table-scroll'); scroll.append(heat); body.append(scroll);
      body.append(make('p', 'Rows are query positions; columns are key positions. Hover or focus a cell for its value. Select a token above to choose the query position.'));
    }
    const values=node.shape.length===1 ? [node.values[observedPosition()]] : node.values[observedPosition()];
    body.append(table([node.axes[1] || 'Token ID', 'Value'], values.map((v, i) => [node.operation.name === 'logits' ? `#${i} ${label(i)}` : i, number(v)])));
    const details = make('details'), record=make('script',JSON.stringify(node)); record.type='application/json';
    details.append(make('summary', 'Full tensor'),json({operation:node.operation,shape:node.shape,axes:node.axes,values:node.values}),record); body.append(details);
    dependencies(body,node);
  }
  function renderDetail() {
    $('numerical-inspector').hidden=session.phase==='running';
    if(session.phase==='running') {
      $('detail-body').replaceChildren();$('inspection-context').textContent='';
      for(const key of ['runId','passId','surface','observationId','position']) delete $('inspection-context').dataset[key];
      return;
    }
    document.querySelectorAll('[data-entity]').forEach(el=>el.classList.toggle('selected-object',el.dataset.entity===entity()));
    const node=current()?.nodes.find(n=>n.id===session.view.observation_id);
    const context=$('inspection-context');
    context.dataset.runId=executionId(); context.dataset.passId=current()?.id || '';
    context.dataset.surface=session.view.surface;
    context.dataset.observationId=node?.id || ''; context.dataset.position=observedPosition();
    context.textContent=`Selected p${position()} · #${sequence()[position()]} ${label(sequence()[position()])}${current() ? ' · computed row p'+observedPosition() : ''}${node ? ' → '+node.operation.name : ''}`;
    const button = document.querySelector(`[data-entity="${entity()}"]`);
    const term = entity()==='selection' ? 'Token selection' : entity()==='request' ? 'Request' : entity()==='workload' ? 'Workload' : entity()==='client' ? 'Client' : button.dataset.term, definition = ontology[term];
    $('detail-title').textContent = term;
    $('definition').textContent = definition.meaning;
    const semanticOwner=node ? owner(node) : definition.owner;
    configuration?.detail(semanticOwner);
    $('definition-link').href = `ontology.html#${semanticOwner}`;
    const labCount=Declarations.labs.filter(l=>l.ontology_binding.primary===semanticOwner && l.status==='mechanical-demo').length;
    $('labs-link').hidden = labCount === 0;
    $('labs-empty').hidden = labCount > 0;
    if(labCount) $('labs-link').href = `labs-by-concept.html#${semanticOwner}`;
    else $('labs-link').removeAttribute('href');
    $('labs-link').textContent = `Labs (${labCount}) ↗`;
    const body = $('detail-body'); body.replaceChildren();
    if(node) {
      tensorView(body,n=>owner(n)===owner(node));
    } else if (entity() === 'system') {
      body.append(make('p',Declarations.schemas.InferenceSystem.properties.dispatch.description));
      body.append(json(session.prepared.declaration.system));
    } else if (entity() === 'request' && session.step) {
      body.append(make('p','Raw-prefix execution; no new tokenization.'));
      body.append(json({prefix_ids:session.step.request.prefix_ids,output_ids:session.step.request.output_ids}));
    } else if (entity() === 'request') {
      body.append(make('p', `Original user text: ${JSON.stringify(accepted().declaration.workload.requests[0].request.text)}`));
      body.append(table(['Byte offsets in user turn', 'Decision', 'Bytes', 'Emitted IDs'], accepted().tokenizer.spans.map(s => [s.byte_start === null ? 'framing' : `${s.byte_start}…${s.byte_end}`, s.reason, s.raw_bytes.join(' '), s.ids.map(id => `#${id} ${label(id)}`).join(' · ')])));
      body.append(make('p', 'Offsets are half-open UTF-8 byte ranges. Role markers are framing, not text. Unknown input is encoded reversibly; it is not evidence of understanding.'));
    } else if (entity() === 'workload') {
      body.append(make('p',Declarations.schemas.WorkloadTransformationPreview.description));
      body.append(table(['Request','Arrival (µs)','Source'],session.prepared.declaration.workload.requests.map(r=>[r.request_id,r.arrival_us,r.request.text])));
    } else if (entity() === 'client') {
      body.append(make('p', Declarations.schemas.ClientConfigurationPreview.description));
      const response=make('button','Inspect published response');response.onclick=()=>chooseEntity('response');body.append(response);
    } else if (entity() === 'selection') {
      const s = current().selection;
      const logits=make('button',`Inspect executed logits at position ${current().selection_position}`); logits.id='selection-logits';
      logits.onclick=()=>openObservation(current().nodes.find(n=>n.operation.name==='logits'));body.append(logits);
      body.append(make('p', `${s.decoding}. selected #${s.selected_id} ${label(s.selected_id)}. These scores come from final input position ${current().selection_position}.`));
      body.append(make('p', accepted().decoding_contract.explanation));
      body.append(table(['ID / token', 'Raw logit', 'Full-vocabulary probability'], accepted().vocabulary.map(t => [ `#${t.id} ${label(t.id)}`, number(s.raw_logits[t.id]), number(s.probabilities[t.id]) ])));
    } else {
      if(current()) {
        const selection=make('button','Inspect selected prediction');selection.id='response-selection';
        selection.onclick=()=>chooseEntity('selection');body.append(selection);
      }
      body.append(make('p', `Accepted output: ${JSON.stringify(displayedOutput())}`));
      body.append(make('p', 'TURN_END stops generation. Every other ID is retained and published. This is a token display: control/byte/hex markers are not decoded text, and no spaces are inserted between word tokens.'));
      body.append(json({selected_ids: (session.step?.output_ids || []), final_stop_reason: session.step?.stop_reason || null, complete: session.step?.stop_reason==='turn_end'}));
    }
  }
  function renderPass() {
    renderExecutionPath();
    $('download-run').disabled=!receipt || !session.step || session.phase==='running';
    $('run-identity').textContent=session.step && session.phase!=='running' ? JSON.stringify({run_id:session.step.id,request:session.step.request}) : '';
    $('client-boundary').classList.toggle('has-output',!!session.step?.output_ids.length);
    $('source-label').textContent='Input';
    $('pass-caption').textContent = `Input + output · ${sequence().length} positions`;
    $('sequence-strip').replaceChildren(...sequence().map(tokenButton));
    $('response-preview').textContent = displayedOutput();
    renderStatus();
    renderDetail();
    configuration?.refresh();
  }
  function buildControls() {
    const fields = $('request-fields');
    const textField = Declarations.schemas.InferenceRequest.properties.text;
    const policy = Declarations.schemas.GenerationPolicy.properties.max_new_tokens;
    const label = make('label',textField.title); label.htmlFor='prompt';
    const input = make('textarea'); input.id='prompt'; input.setAttribute('form','inference-form'); input.rows=2; label.append(input);
    const budgetLabel = make('label',policy.title); budgetLabel.htmlFor='output-budget';
    const budget = make('select'); budget.id='output-budget'; budget.setAttribute('form','inference-form');
    let ceiling = accepted().declaration;
    policy['x-maximum-from'].split('.').forEach(k=>{ceiling=ceiling[k];});
    for(let i=policy.minimum;i<=ceiling;i++) { const option=make('option',String(i)); option.value=i;budget.append(option); }
    budgetLabel.append(budget);
    budget.title=policy.description;
    fields.replaceChildren(label,budgetLabel);
    const edit = () => {
      playback.stop();
      session=InspectionSession.transition(session,{type:'EDIT',workload:{...session.draft,requests:[{...session.draft.requests[0],request:{...draftRequest(),text:input.value,generation:{...draftRequest().generation,max_new_tokens:Number(budget.value)}}}]}});
      renderStatus();
    };
    input.oninput=edit; budget.onchange=edit;
  }
  function renderStatus() {
    const phase=session.phase;
    const messages={offline:'Execution unavailable offline',ready:'',dirty:'Unapplied input changes',running:'',failed:'Operation failed'};
    $('binding-status').textContent=phase==='ready' && configuration && !configuration.executable() ? 'Configuration preview' : messages[phase];
    $('binding-status').dataset.phase=phase;
    for(const id of ['prompt','output-budget','execute']) $(id).disabled=!session.live || phase==='running';
    $('run-error').hidden=!session.error;
    $('run-error').textContent=session.error || '';
    let unavailable='';
    try { InspectionSession.nextRequest(session); } catch(error) { unavailable=error.message; }
    $('next-token').disabled=!session.live || !['ready','failed'].includes(phase) || !!unavailable || phase==='failed' || !!(configuration && !configuration.executable());
    $('next-token').title=unavailable;
    $('reset').disabled=phase==='running' || !session.step;
    $('token-journey').disabled=!current() || phase==='running' || phase==='dirty' || !!(configuration && !configuration.executable());
    $('token-journey').textContent=playback.running() ? 'Pause Journey' : 'Token Journey';
    $('token-journey').setAttribute('aria-pressed',String(playback.running()));
    if(session.error) $('binding-status').textContent=session.error;
    $('binding-status').hidden=!$('binding-status').textContent;
  }
  function renderRun() {
    const run=accepted();
    playback.stop();
    $('sequence-details').hidden=true;$('output-details').setAttribute('aria-expanded','false');
    $('prompt').value=draftRequest().text; $('output-budget').value=draftRequest().generation.max_new_tokens;
    $('request-preview').textContent=run.declaration.workload.requests[0].request.text || '(empty user turn)';
    const selector=$('parameter-name');selector.replaceChildren(...Object.keys(run.checkpoint.parameters).map(name=>{const o=make('option',name);o.value=name;return o;}));
    selector.onchange=()=>{$('parameter-values').textContent=JSON.stringify(run.checkpoint.parameters[selector.value],null,2);};selector.onchange();
    renderPass();renderStatus();
  }
  buildControls();
  $('workload-boundary').dataset.configurationOwner=Declarations.schemas.WorkloadTransformationPreview['x-owner'];
  $('client-boundary').dataset.configurationOwner=Declarations.schemas.ClientConfigurationPreview['x-owner'];
  configuration=ConfigurationPreview.mount(semanticOwner=>{
    const stage=[...$('computation-path').querySelectorAll('[data-configuration-owner]')].find(el=>el.dataset.configurationOwner===semanticOwner);
    if(stage) chooseEntity(stage.querySelector('[data-entity]').dataset.entity);
    else chooseEntity(semanticOwner===Declarations.schemas.WorkloadTransformationPreview['x-owner'] ? 'workload' : semanticOwner===Declarations.schemas.ClientConfigurationPreview['x-owner'] ? 'client' : 'system');
  },()=>{playback.stop();renderStatus();},[...new Set(Object.values(Declarations.operationOwners)),Declarations.schemas.TokenSelection['x-owner']]);

  document.querySelectorAll('[data-entity]').forEach(b => b.onclick = () => { chooseEntity(b.dataset.entity); $('numerical-inspector').scrollIntoView({behavior: 'smooth', block: 'start'}); });
  $('edit-input').onclick=()=>{
    const editor=$('inference-form'); editor.hidden=!editor.hidden;
    $('edit-input').setAttribute('aria-expanded',String(!editor.hidden));
    if(!editor.hidden) $('prompt').focus();
  };
  $('output-details').onclick=()=>{
    const panel=$('sequence-details');panel.hidden=!panel.hidden;
    $('output-details').setAttribute('aria-expanded',String(!panel.hidden));
    chooseEntity('response');
  };
  $('reset').onclick=()=>{
    playback.stop();
    session=InspectionSession.transition(session,{type:'RESET'});receipt=null;renderRun();
  };
  $('token-journey').onclick=()=>{
    if(playback.running()) return playback.stop();
    playback.start(InspectionSession.journey(session), view=>inspect(view,true));
  };
  $('next-token').onclick=async()=>{
    playback.stop();
    try {
      session=InspectionSession.transition(session,{type:'STEP_SUBMIT'});renderPass();
      const response=await fetch(Declarations.routes.tokenStep,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(session.submitted_step)});
      const delivered=await response.json();
      if(!response.ok) throw new Error(delivered.error);
      const result=await EvidenceClient.restore(delivered);
      session=InspectionSession.transition(session,{type:'STEP_ACCEPT',result});
      receipt=delivered;
      $('run-identity').textContent=JSON.stringify({run_id:result.id,request:result.request});
      renderPass();
    } catch(error) {
      session=InspectionSession.transition(session,{type:'FAIL',message:error.message});renderPass();
    }
  };
  $('inference-form').onsubmit=async event=>{
    event.preventDefault();playback.stop();
    try {
      session=InspectionSession.transition(session,{type:'SUBMIT'});receipt=null;renderPass();
      const response=await fetch(Declarations.routes.prepareInput,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(session.submitted.workload)});
      const delivered=await response.json();if(!response.ok) throw new Error(delivered.error);
      session=InspectionSession.transition(session,{type:'ACCEPT',prepared:delivered});
      renderRun();
      const editor=document.querySelector('.source-editor');
      const restoreFocus=editor.contains(document.activeElement);
      editor.hidden=true;
      $('edit-input').setAttribute('aria-expanded','false');
      if(restoreFocus) $('edit-input').focus();
    } catch(error) {
      session=InspectionSession.transition(session,{type:'FAIL',message:error.message});renderPass();
    }
  };
  $('download-run').onclick=async()=>{try { const serializedRun=await EvidenceClient.export(receipt);const a=make('a');const url=URL.createObjectURL(new Blob([serializedRun],{type:'application/json'}));a.href=url;a.download='inference-run.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); } catch(error) { session={...session,error:error.message};renderStatus(); } };
  renderRun();
  if(location.protocol!=='file:') fetch(Declarations.routes.capabilities).then(async response=>{
    if(!response.ok) return;
    const capabilities=await response.json();
    if(capabilities.engine!==Declarations.schemas.Capabilities.properties.engine.const || capabilities.contract_sha256!==Declarations.hash) throw new Error('Page and execution server use different declarations; rebuild and reload.');
    session=InspectionSession.transition(session,{type:'CONNECT'});renderStatus();
  }).catch(error=>{session={...session,error:error.message};renderStatus();});
  if (location.hash) {
    const target = $(location.hash.slice(1)); if (target && target.dataset.entity) chooseEntity(target.dataset.entity);
  }
})().catch(error=>{const status=document.getElementById('binding-status');status.hidden=false;status.textContent=error.message;status.dataset.phase='failed';});
