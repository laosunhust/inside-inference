/* Presentation only. Every displayed model value comes from the Python execution record. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!$('inference-data')) return;
  // Preserve the execution record's numerical representation for exact replay.
  let serializedRun = $('inference-data').textContent;
  let session = InspectionSession.create(JSON.parse(serializedRun));
  let entity = 'request';
  let configuration;
  const accepted = () => session.run.traces[0];
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
  const executionId = () => session.step?.id || session.run.id;
  const observedPosition = () => Math.min(position(),current().selection_position);
  const displayedOutput = () => session.step ? session.step.computation.display_so_far : InspectionSession.publicationText(session.run,current().step);
  const position = () => session.view.position;
  const inspect = view => { session = InspectionSession.transition(session,{type:'INSPECT',view}); renderPass(); };
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
    const b = make('button', undefined, 'token-chip' + (pos === position() ? ' active' : ''));
    b.append(make('small', `p${pos} · #${id}`), make('strong', label(id)));
    b.disabled=session.phase==='running';
    b.setAttribute('aria-pressed',String(pos===position()));
    b.onclick = () => {
      entity='embedding';
      const pass=InspectionSession.computation({...session,view:{...session.view,position:pos}});
      inspect({position:pos,observation_id:pass.nodes.find(n=>n.operation.name==='embedding').id});
    };
    return b;
  }
  function chooseEntity(value) {
    entity = value;
    document.querySelectorAll('[data-entity]').forEach(el => el.classList.toggle('selected-object', el.dataset.entity === entity));
    const defaultNode=document.querySelector(`[data-entity="${value}"]`)?.dataset.operation;
    const node = defaultNode ? current().nodes.find(n=>n.operation.name===defaultNode) : null;
    inspect({observation_id:node?.id || null});
  }
  function openObservation(node) {
    const stage=[...$('computation-path').querySelectorAll('[data-observations]')]
      .find(el=>JSON.parse(el.dataset.observations).includes(node.id));
    if(!stage) throw new Error(`No execution stage for ${node.id}`);
    entity=stage.querySelector('[data-entity]').dataset.entity;
    inspect({observation_id:node.id});
  }
  function renderExecutionPath() {
    const pass=current(), path=$('computation-path');
    if(path.dataset.passId===pass.id && path.dataset.runId===executionId()) return;
    ExecutionPath.render(pass,executionId(),ontology,(selected,node)=>{
      entity=selected;inspect({observation_id:node.id});
    });
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
    document.querySelectorAll('[data-entity]').forEach(el=>el.classList.toggle('selected-object',el.dataset.entity===entity));
    const node=current().nodes.find(n=>n.id===session.view.observation_id);
    const context=$('inspection-context');
    context.dataset.runId=executionId(); context.dataset.passId=current().id;
    context.dataset.observationId=node?.id || ''; context.dataset.position=observedPosition();
    context.textContent=`Selected p${position()} · #${sequence()[position()]} ${label(sequence()[position()])} · computed row p${observedPosition()}${node ? ' → '+node.operation.name : ''}`;
    const button = document.querySelector(`[data-entity="${entity}"]`);
    const term = entity==='request' ? 'Request' : entity==='workload' ? 'Workload' : entity==='client' ? 'Client' : button.dataset.term, definition = ontology[term];
    $('detail-title').textContent = `Zoom 3 · ${term}`;
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
    } else if (entity === 'request') {
      body.append(make('p', `Original user text: ${JSON.stringify(accepted().declaration.request.text)}`));
      body.append(table(['Byte offsets in user turn', 'Decision', 'Bytes', 'Emitted IDs'], accepted().tokenizer.spans.map(s => [s.byte_start === null ? 'framing' : `${s.byte_start}…${s.byte_end}`, s.reason, s.raw_bytes.join(' '), s.ids.map(id => `#${id} ${label(id)}`).join(' · ')])));
      body.append(make('p', 'Offsets are half-open UTF-8 byte ranges. Role markers are framing, not text. Unknown input is encoded reversibly; it is not evidence of understanding.'));
    } else if (entity === 'workload') {
      body.append(make('p',Declarations.schemas.WorkloadTransformationPreview.description));
      body.append(table(['Request','Arrival (µs)','Source'],session.run.declaration.workload.requests.map(r=>[r.request_id,r.arrival_us,r.request.text])));
    } else if (entity === 'client') {
      body.append(make('p', Declarations.schemas.ClientConfigurationPreview.description));
      const response=make('button','Inspect published response');response.onclick=()=>chooseEntity('response');body.append(response);
    } else if (entity === 'selection') {
      const s = current().selection;
      const logits=make('button',`Inspect executed logits at position ${current().selection_position}`); logits.id='selection-logits';
      logits.onclick=()=>{entity='projection';inspect({observation_id:current().nodes.find(n=>n.operation.name==='logits').id});};body.append(logits);
      body.append(make('p', `${s.decoding}. selected #${s.selected_id} ${label(s.selected_id)}. These scores come from final input position ${current().selection_position}.`));
      body.append(make('p', accepted().decoding_contract.explanation));
      body.append(table(['ID / token', 'Raw logit', 'Full-vocabulary probability'], accepted().vocabulary.map(t => [ `#${t.id} ${label(t.id)}`, number(s.raw_logits[t.id]), number(s.probabilities[t.id]) ])));
    } else {
      const selection=make('button','Inspect the prediction that produced this output');selection.id='response-selection';
      selection.onclick=()=>chooseEntity('selection');body.append(selection);
      body.append(make('p', `Visible output through this pass: ${JSON.stringify(displayedOutput())}`));
      body.append(make('p', 'TURN_END stops generation. Every other ID is retained and published. This is a token display: control/byte/hex markers are not decoded text, and no spaces are inserted between word tokens.'));
      body.append(json({selected_ids: (session.step?.output_ids || accepted().output_ids.slice(0,current().step+1)), final_stop_reason: session.step ? session.step.stop_reason : accepted().outcome.stop_reason, complete: session.step ? session.step.stop_reason==='turn_end' : accepted().outcome.complete}));
    }
  }
  function renderPass() {
    const p = current();
    renderExecutionPath();
    document.querySelector('.event-record').hidden=!!session.step;
    $('source-label').textContent=session.step ? 'Source' : 'Input';
    $('pass-caption').textContent = `Token sequence · ${sequence().length} positions`;
    $('sequence-strip').replaceChildren(...sequence().map(tokenButton));
    const id = p.selection.selected_id;
    $('selected-token').textContent = label(id);
    $('output-label').textContent = accepted().checkpoint.provenance.kind === 'untrained'
      ? 'Published output · untrained' : 'Published output';
    $('response-preview').textContent = displayedOutput() || '—';
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
      session=InspectionSession.transition(session,{type:'EDIT',workload:{...session.draft,requests:[{...session.draft.requests[0],request:{...draftRequest(),text:input.value,generation:{...draftRequest().generation,max_new_tokens:Number(budget.value)}}}]}});
      renderStatus();
    };
    input.oninput=edit; budget.onchange=edit;
  }
  function renderStatus() {
    const phase=session.phase;
    const messages={offline:'Recorded run · offline',ready:'Applied',dirty:'Unapplied changes · showing previous run',running:'Computing… · showing previous run',failed:'Failed · showing previous run'};
    $('binding-status').textContent=phase==='ready' && configuration && !configuration.executable() ? 'Configuration preview' : messages[phase];
    $('binding-status').dataset.phase=phase;
    for(const id of ['prompt','output-budget','execute']) $(id).disabled=!session.live || phase==='running';
    $('run-error').hidden=!session.error;
    $('run-error').textContent=session.error || '';
    let unavailable='';
    try { InspectionSession.nextRequest(session); } catch(error) { unavailable=error.message; }
    $('next-token').disabled=!session.live || !['ready','failed'].includes(phase) || !!unavailable;
    $('next-token').title=unavailable;
    if(session.error) $('binding-status').textContent=session.error;
  }
  function renderRun() {
    const run=accepted(), binding=run.declaration, outcome=run.outcome;
    entity='request';
    $('prompt').value=draftRequest().text; $('output-budget').value=draftRequest().generation.max_new_tokens;
    $('request-preview').textContent=binding.request.text || '(empty user turn)';
    $('run-outcome').textContent=`${outcome.selected_tokens} / ${binding.request.generation.max_new_tokens} selections · ${outcome.stop_reason === 'turn_end' ? 'TURN_END' : 'token limit'}`;
    const arrival=session.run.declaration.workload.requests[0];
    $('workload-summary').textContent=`${arrival.request_id} · declared arrival ${arrival.arrival_us} µs · execution order only; no latency simulation`;
    $('event-stream').replaceChildren(...session.run.events.map(e=>make('li',`${e.sequence} · ${e.payload.kind}${e.payload.token_ids ? ' · '+e.payload.token_ids.map(label).join(' ') : ''}`)));
    $('run-identity').textContent=JSON.stringify({run_id:run.id,request_id:run.request_id,declaration:session.run.declaration,clock:session.run.clock,outcome,contract_sha256:run.contract_sha256,provenance:run.provenance,evidence:run.evidence},null,2);
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
    else chooseEntity(semanticOwner===Declarations.schemas.WorkloadTransformationPreview['x-owner'] ? 'workload' : 'client');
  },renderStatus,[...current().nodes.map(owner),Declarations.schemas.TokenSelection['x-owner']]);

  document.querySelectorAll('[data-entity]').forEach(b => b.onclick = () => { chooseEntity(b.dataset.entity); $('numerical-inspector').scrollIntoView({behavior: 'smooth', block: 'start'}); });
  $('edit-input').onclick=()=>{
    const editor=$('inference-form'); editor.hidden=!editor.hidden;
    $('edit-input').setAttribute('aria-expanded',String(!editor.hidden));
    if(!editor.hidden) $('prompt').focus();
  };
  $('selected-token').onclick=()=>chooseEntity('selection');
  $('next-token').onclick=async()=>{
    try {
      session=InspectionSession.transition(session,{type:'STEP_SUBMIT'});renderPass();
      const response=await fetch(Declarations.routes.tokenStep,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(session.submitted_step)});
      const source=await response.text(), result=JSON.parse(source);
      if(!response.ok) throw new Error(result.error);
      session=InspectionSession.transition(session,{type:'STEP_ACCEPT',result});
      serializedRun=source;entity='selection';
      $('run-identity').textContent=JSON.stringify({run_id:result.id,request:result.request});
      $('run-outcome').textContent=`${result.output_ids.length} / ${result.request.generation.max_new_tokens} selections${result.stop_reason ? ' · '+(result.stop_reason==='turn_end'?'TURN_END':'token limit') : ''}`;
      renderPass();
    } catch(error) {
      session=InspectionSession.transition(session,{type:'FAIL',message:error.message});renderPass();
    }
  };
  $('inference-form').onsubmit=async event=>{
    event.preventDefault();
    try {
      session=InspectionSession.transition(session,{type:'SUBMIT'});renderStatus();
      const response=await fetch(Declarations.routes.run,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(session.submitted.workload)});
      const source=await response.text(), result=JSON.parse(source);if(!response.ok) throw new Error(result.error);
      session=InspectionSession.transition(session,{type:'ACCEPT',run:result});
      serializedRun=source;renderRun();
      const editor=document.querySelector('.source-editor');
      const restoreFocus=editor.contains(document.activeElement);
      editor.hidden=true;
      $('edit-input').setAttribute('aria-expanded','false');
      if(restoreFocus) $('edit-input').focus();
    } catch(error) {
      session=InspectionSession.transition(session,{type:'FAIL',message:error.message});renderStatus();
    }
  };
  $('download-run').onclick=()=>{const a=make('a');const url=URL.createObjectURL(new Blob([serializedRun],{type:'application/json'}));a.href=url;a.download='inference-run.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
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
})();
