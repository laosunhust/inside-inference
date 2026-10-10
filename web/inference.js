/* Presentation only. Every displayed model value comes from the Python execution record. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!$('inference-data')) return;
  // Preserve the execution record's numerical representation for exact replay.
  let serializedRun = $('inference-data').textContent;
  let session = InspectionSession.create(JSON.parse(serializedRun));
  let entity = 'request';
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
  const current = () => accepted().passes[session.view.prediction];
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
    b.onclick = () => { entity='embedding'; inspect({position:pos,observation_id:current().nodes.find(n=>n.operation.name==='embedding').id}); };
    return b;
  }
  function choosePass(index) {
    const old=current().nodes.find(n=>n.id===session.view.observation_id);
    const pass=accepted().passes[index];
    if(!old) entity='embedding';
    const node=pass.nodes.find(n=>n.operation.name===(old?.operation.name || 'embedding'));
    inspect({prediction:index,position:pass.selection_position,observation_id:node.id});
  }
  function chooseEntity(value) {
    entity = value;
    document.querySelectorAll('[data-entity]').forEach(el => el.classList.toggle('selected-object', el.dataset.entity === entity));
    const defaultNode=document.querySelector(`[data-entity="${value}"]`).dataset.operation;
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
    if(path.dataset.passId===pass.id && path.dataset.runId===session.run.id) return;
    ExecutionPath.render(pass,session.run.id,ontology,(selected,node)=>{
      entity=selected;inspect({observation_id:node.id});
    });
    $('computation-caption').textContent=`Prediction ${session.view.prediction+1} · ${pass.phase}`;

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
    body.append(make('p', `Pass ${node.step} · position ${position()} · ${node.dtype} · axes: ${node.axes.join(' × ')}. Display: 6 significant digits.`));
    if (node.operation.name === 'attention' || node.operation.name === 'scores' || node.operation.name === 'causal_mask') {
      const heat = make('div', undefined, 'attention-grid');
      heat.style.gridTemplateColumns = `repeat(${node.shape[1]}, minmax(20px, 1fr))`;
      node.values.forEach((row, i) => row.forEach((value, j) => {
        const cell = make('button', undefined, 'heat-cell' + (i === position() ? ' heat-selected' : ''));
        cell.title = `query p${i} (${label(current().input_ids[i])}) → key p${j} (${label(current().input_ids[j])}): ${number(value)}`;
        cell.setAttribute('aria-label', cell.title);
        const strength = node.operation.name === 'attention' ? value : node.operation.name === 'causal_mask' ? Number(value) : 0.35;
        cell.style.backgroundColor = `rgba(20,125,105,${0.06 + 0.94 * strength})`;
        cell.onclick = () => { inspect({position:i}); };
        heat.append(cell);
      }));
      const scroll = make('div', undefined, 'table-scroll'); scroll.append(heat); body.append(scroll);
      body.append(make('p', 'Rows are query positions; columns are key positions. Hover or focus a cell for its value. Click to inspect that query row.'));
    }
    const values=node.shape.length===1 ? [node.values[position()]] : node.values[position()];
    body.append(table([node.axes[1] || 'Token ID', 'Value'], values.map((v, i) => [node.operation.name === 'logits' ? `#${i} ${label(i)}` : i, number(v)])));
    const details = make('details'); details.append(make('summary', 'Full tensor and observation dependencies'), json(node)); body.append(details);
    dependencies(body,node);
  }
  function renderDetail() {
    document.querySelectorAll('[data-entity]').forEach(el=>el.classList.toggle('selected-object',el.dataset.entity===entity));
    const node=current().nodes.find(n=>n.id===session.view.observation_id);
    const context=$('inspection-context');
    context.dataset.runId=session.run.id; context.dataset.passId=current().id;
    context.dataset.observationId=node?.id || ''; context.dataset.position=position();
    context.textContent=`${accepted().request_id} → prediction ${session.view.prediction+1} (${current().phase}) → input position ${position()} · #${current().input_ids[position()]} ${label(current().input_ids[position()])}${node ? ' → '+node.operation.name : ''}`;
    const button = document.querySelector(`[data-entity="${entity}"]`);
    const term = button.dataset.term, definition = ontology[term];
    $('detail-title').textContent = `Zoom 3 · ${term}`;
    $('definition').textContent = definition.meaning;
    const semanticOwner=node ? owner(node) : definition.owner;
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
    } else if (entity === 'system') {
      body.append(make('p', 'One selected chat request. No scheduler, network, cache, or hardware timing is modeled. One block and one head execute the complete prefix at each prediction.'));
      const computation=make('button','Follow this prediction’s computation'); computation.id='system-computation';
      computation.onclick=()=>chooseEntity('embedding');body.append(computation);
      body.append(declarationTable('InferenceSystem',accepted().declaration.system));
      body.append(make('h3','Bound model artifact'), declarationTable('ModelArtifactReference',accepted().declaration.model));

    } else if (entity === 'selection') {
      const s = current().selection;
      const logits=make('button',`Inspect executed logits at position ${current().selection_position}`); logits.id='selection-logits';
      logits.onclick=()=>{entity='projection';inspect({position:current().selection_position,observation_id:current().nodes.find(n=>n.operation.name==='logits').id});};body.append(logits);
      body.append(make('p', `${s.decoding}. selected #${s.selected_id} ${label(s.selected_id)}. These scores come from final input position ${current().selection_position}.`));
      body.append(make('p', accepted().decoding_contract.explanation));
      body.append(table(['ID / token', 'Raw logit', 'Full-vocabulary probability'], accepted().vocabulary.map(t => [ `#${t.id} ${label(t.id)}`, number(s.raw_logits[t.id]), number(s.probabilities[t.id]) ])));
    } else {
      const selection=make('button','Inspect the prediction that produced this output');selection.id='response-selection';
      selection.onclick=()=>chooseEntity('selection');body.append(selection);
      body.append(make('p', `Visible output through this pass: ${JSON.stringify(InspectionSession.publicationText(session.run,session.view.prediction))}`));
      body.append(make('p', 'TURN_END stops generation. Every other ID is retained and published. This is a token display: control/byte/hex markers are not decoded text, and no spaces are inserted between word tokens.'));
      body.append(json({selected_ids: accepted().output_ids.slice(0, session.view.prediction + 1), final_stop_reason: accepted().outcome.stop_reason, complete: accepted().outcome.complete}));
    }
  }
  function renderPass() {
    const p = current();
    renderExecutionPath();
    $('pass-caption').textContent = `${p.phase === 'prefill' ? 'Prefill: the whole prompt predicts the first output.' : 'Decode: the prompt plus previous outputs are run again.'} ${p.input_ids.length} positions computed. Final position p${p.selection_position} selects output p${p.output_position}.`;
    $('sequence-strip').replaceChildren(...p.input_ids.map(tokenButton));
    const id = p.selection.selected_id;
    $('selected-token').textContent = `#${id} ${label(id)} · output position ${p.output_position}`;
    $('response-preview').textContent = InspectionSession.publicationText(session.run,session.view.prediction) || '(control token only)';
    $('response-status').textContent = session.view.prediction === accepted().passes.length - 1 ? `Stop: ${accepted().outcome.stop_reason}${accepted().outcome.complete ? '' : ' · incomplete continuation'}` : `Output after prediction ${session.view.prediction + 1}`;
    $('pass-tabs').querySelectorAll('button').forEach((b, i) => { b.classList.toggle('active', i === session.view.prediction); b.setAttribute('aria-pressed', String(i === session.view.prediction)); });
    $('next-pass').disabled = session.view.prediction === accepted().passes.length - 1;
    renderDetail();
  }
  function declarationTable(name, value) {
    return table(['Setting','Bound value'], Object.entries(Declarations.schemas[name].properties).map(([key,field]) => [field.title || key, typeof value[key] === 'object' ? JSON.stringify(value[key]) : String(value[key])]));
  }
  function buildControls() {
    const fields = $('request-fields');
    const textField = Declarations.schemas.InferenceRequest.properties.text;
    const policy = Declarations.schemas.GenerationPolicy.properties.max_new_tokens;
    const label = make('label',textField.title); label.htmlFor='prompt';
    const input = make('textarea'); input.id='prompt'; input.rows=3; label.append(input);
    const budgetLabel = make('label',policy.title); budgetLabel.htmlFor='output-budget';
    const budget = make('select'); budget.id='output-budget';
    let ceiling = accepted().declaration;
    policy['x-maximum-from'].split('.').forEach(k=>{ceiling=ceiling[k];});
    for(let i=policy.minimum;i<=ceiling;i++) { const option=make('option',String(i)); option.value=i;budget.append(option); }
    budgetLabel.append(budget);
    fields.replaceChildren(label,budgetLabel,make('p',policy.description,'control-hint'));
    const edit = () => {
      session=InspectionSession.transition(session,{type:'EDIT',workload:{...session.draft,requests:[{...session.draft.requests[0],request:{...draftRequest(),text:input.value,generation:{...draftRequest().generation,max_new_tokens:Number(budget.value)}}}]}});
      renderStatus();
    };
    input.oninput=edit; budget.onchange=edit;
  }
  function renderStatus() {
    const phase=session.phase;
    const messages={offline:'Recorded run. Execution controls are locked. Run make serve-intro for live execution.',ready:'All views show the applied request.',dirty:'Unapplied request changes. All views below still show the previous applied request.',running:'Computing the submitted request. Views still show the previous run.',failed:'Request failed. Views still show the previous applied request.'};
    $('binding-status').textContent=messages[phase];
    $('binding-status').dataset.phase=phase;
    $('execution-mode').textContent=messages[phase];
    for(const id of ['prompt','output-budget','execute']) $(id).disabled=!session.live || phase==='running';
    $('run-error').hidden=!session.error;
    $('run-error').textContent=session.error || '';
  }
  function renderRun() {
    const run=accepted(), binding=run.declaration, outcome=run.outcome;
    entity='request';
    $('prompt').value=draftRequest().text; $('output-budget').value=draftRequest().generation.max_new_tokens;
    $('request-preview').textContent=binding.request.text || '(empty user turn)';
    $('system-summary').textContent=`${binding.model.architecture.width} channels · ${outcome.selected_tokens} executed predictions`;
    $('run-outcome').textContent=`${outcome.selected_tokens} / ${binding.request.generation.max_new_tokens} allowed selections · ${outcome.unused_budget} unused. Stop: ${outcome.stop_reason === 'turn_end' ? 'TURN_END selected' : 'request ceiling reached'}.`;
    $('submitted-request').textContent=`Applied input: ${JSON.stringify(binding.request.text)}. Each prediction selects one ID; the count includes stop controls. ${outcome.published_tokens} IDs were published to the output collector. Special IDs use diagnostic markers; no output grammar is applied.`;
    $('model-declaration').replaceChildren(declarationTable('ModelArtifactReference',binding.model),make('p','Preparation provenance'),json(run.checkpoint.provenance));
    $('system-declaration').replaceChildren(declarationTable('InferenceSystem',binding.system));
    $('pass-tabs').replaceChildren(...run.passes.map((p,i)=>{
      const b=make('button',`${i+1} · ${p.phase}`);
      b.onclick=()=>choosePass(i);return b;
    }));
    const arrival=session.run.declaration.workload.requests[0];
    $('workload-summary').textContent=`${arrival.request_id} · declared arrival ${arrival.arrival_us} µs · execution order only; no latency simulation`;
    $('event-stream').replaceChildren(...session.run.events.map(e=>make('li',`${e.sequence} · ${e.payload.kind}${e.payload.token_ids ? ' · '+e.payload.token_ids.map(label).join(' ') : ''}`)));
    $('run-identity').textContent=JSON.stringify({run_id:run.id,request_id:run.request_id,declaration:session.run.declaration,clock:session.run.clock,outcome,contract_sha256:run.contract_sha256,provenance:run.provenance,evidence:run.evidence},null,2);
    const selector=$('parameter-name');selector.replaceChildren(...Object.keys(run.checkpoint.parameters).map(name=>{const o=make('option',name);o.value=name;return o;}));
    selector.onchange=()=>{$('parameter-values').textContent=JSON.stringify(run.checkpoint.parameters[selector.value],null,2);};selector.onchange();
    renderPass();renderStatus();
  }
  buildControls();
  document.querySelectorAll('[data-entity]').forEach(b => b.onclick = () => { chooseEntity(b.dataset.entity); $('numerical-inspector').scrollIntoView({behavior: 'smooth', block: 'start'}); });
  $('selected-token').onclick=()=>chooseEntity('selection');
  $('next-pass').onclick=()=>{
    const index=session.view.prediction+1;
    if(index<accepted().passes.length) choosePass(index);
  };
  $('inference-form').onsubmit=async event=>{
    event.preventDefault();
    try {
      session=InspectionSession.transition(session,{type:'SUBMIT'});renderStatus();
      const response=await fetch(Declarations.routes.run,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(session.submitted.workload)});
      const source=await response.text(), result=JSON.parse(source);if(!response.ok) throw new Error(result.error);
      session=InspectionSession.transition(session,{type:'ACCEPT',run:result});
      serializedRun=source;renderRun();
    } catch(error) {
      session=InspectionSession.transition(session,{type:'FAIL',message:error.message});renderStatus();
    }
  };
  $('download-run').onclick=()=>{const a=make('a');const url=URL.createObjectURL(new Blob([serializedRun],{type:'application/json'}));a.href=url;a.download=`inference-${accepted().id.slice(0,12)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
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
