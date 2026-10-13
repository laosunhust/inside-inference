/* The selected experiment and its accepted request own every projection on this page. */
(async()=>{
  const $=id=>document.getElementById(id), S=InspectionSession;
  let state=S.create(JSON.parse($('inference-data').textContent)),catalog=null;
  let epoch=0,loadEpoch=0,loading=false,pending=false,running=false,error='',configuration;
  const ontology=JSON.parse($('ontology-data').textContent);
  const playback=ExecutionPath.playback(()=>status());
  const selected=()=>catalog?.models.find(m=>m.id===state.input.experiment.model_id);
  const compact=n=>n.toLocaleString('en-US',{notation:'compact',maximumFractionDigits:0});
  const label=id=>(state.loaded?.token_pieces[id] || '').replaceAll(' ','␠');
  const setError=e=>{error=e.message.trim().split('\n').at(-1);console.error(e);};
  const stop=()=>{epoch++;pending=false;running=false;playback.stop();error='';};
  function inspect(view,automatic=false) {
    if(!automatic)playback.stop();
    state=S.inspect(state,view);render();
    const stage=$('computation-path').querySelector('.selected-object')?.parentElement;
    if(stage){const scroll=document.querySelector('.execution-scroll');if(stage.offsetLeft<scroll.scrollLeft||stage.offsetLeft+stage.offsetWidth>scroll.scrollLeft+scroll.clientWidth)scroll.scrollLeft=stage.offsetLeft-(scroll.clientWidth-stage.offsetWidth)/2;}
  }
  function status() {
    let unavailable='';try{S.nextRequest(state);}catch(e){unavailable=e.message;}
    const disabled=loading||pending||!state.prepared||!!error||!!unavailable||!configuration?.executable();
    $('next-token').disabled=disabled;$('continue-tokens').disabled=disabled;
    $('next-token').title=unavailable;
    $('stop-tokens').hidden=!running;
    $('execute').disabled=!state.loaded||pending||loading;
    $('reset').disabled=!state.step&&!pending;
    $('download-run').disabled=!state.step||pending;
    $('token-journey').disabled=!state.prepared||pending||loading||!configuration?.executable();
    $('token-journey').textContent=playback.running()?'Pause Journey':'Token Journey';
    $('token-journey').setAttribute('aria-pressed',String(playback.running()));
    $('binding-status').textContent=error || (loading?'Loading model…':pending?'Computing…':(!state.prepared&&state.loaded?'Apply input to prepare the request':''));
    $('binding-status').hidden=!$('binding-status').textContent;
    $('binding-status').dataset.phase=error?'failed':loading?'loading':pending?'running':state.prepared?'ready':'loading';
    $('run-error').hidden=!error;$('run-error').textContent=error;
    $('retry-model').hidden=loading||!!state.loaded||!catalog;
    $('model-loading').textContent=loading?'Downloading and verifying…':state.loaded?'Ready':error?'Load failed':'';
  }
  function renderSetup() {
    const model=selected();if(!model){$('active-model-summary').textContent='Loading model…';return;}
    const a=model.architecture;
    $('active-model-summary').textContent=`${compact(model.parameters)} params · ${a.layers} ${a.layers===1?'layer':'layers'}`;
    $('active-model-details').replaceChildren(InspectionDetails.table(['Attribute','Value'],[
      ['Parameters',model.parameters.toLocaleString('en-US')],['Channels',a.width],['Attention heads',a.heads],['Vocabulary',`${a.vocabulary} IDs`],['Context',`${a.context} positions`],['Position',a.position],['Precision',a.precision],['Runtime',model.runtime],['Inspection',model.inspection]
    ]));
    $('model-choice').value=model.id;
    $('inspection-unavailable').hidden=model.inspection==='tensors';
    const inspection=catalog.models.find(m=>m.inspection==='tensors');
    $('switch-inspection').textContent=`Switch to ${compact(inspection.parameters)} for inspection`;
  }
  function renderPath() {
    const pass=state.step,visible=!!state.prepared&&!pending,layer=S.layer(state);
    $('layer-control').hidden=!visible || state.loaded.model.architecture.layers===1;
    if(visible){const count=state.loaded.model.architecture.layers;$('explanation-layer').replaceChildren(...Array.from({length:count},(_,i)=>new Option(`Layer ${i+1} of ${count}`,String(i))));$('explanation-layer').value=String(layer);}
    document.querySelector('.execution-endpoint').hidden=!visible;
    document.querySelector('.system-route').hidden=!visible;
    const path=$('computation-path');
    if(!visible){path.replaceChildren();delete path.dataset.passId;delete path.dataset.runId;$('execution-edges').querySelectorAll('path').forEach(p=>p.remove());}
    else if(pass?.nodes.length)ExecutionPath.render(pass,pass.id,ontology,(_,node)=>inspect({surface:'model',observation_id:node.id}));
    else ExecutionPath.architecture(S.architecture(state),state.loaded.model.id,index=>inspect({surface:'architecture',architecture_step:index,observation_id:null}),layer);
    document.querySelectorAll('[data-architecture-step]').forEach(item=>item.querySelector('button').classList.toggle('selected-object',state.view.surface==='architecture'&&Number(item.dataset.architectureStep)===state.view.architecture_step));
    $('dispatch-label').textContent=Declarations.schemas.InferenceSystem.properties.dispatch.title;
    $('computation-caption').textContent=pass&&!pending?`Prediction ${pass.output_ids.length}`:'';
    document.querySelectorAll('[data-observations]').forEach(item=>item.querySelector('button').classList.toggle('selected-object',state.view.surface==='model'&&JSON.parse(item.dataset.observations).includes(state.view.observation_id)));
  }
  function render() {
    $('request-preview').textContent=state.input.workload.requests[0].request.text || '(empty input)';
    $('response-preview').textContent=S.output(state);
    $('client-boundary').classList.toggle('has-output',!!state.step);
    const ids=S.sequence(state);
    $('pass-caption').textContent=`Input + output · ${ids.length} positions`;
    $('sequence-strip').replaceChildren(...ids.map((id,position)=>{
      const b=document.createElement('button');b.className='token-chip'+(position===state.view.position?' active':'');
      const small=document.createElement('small'),strong=document.createElement('strong');small.textContent=`p${position} · #${id}`;strong.textContent=label(id);b.append(small,strong);
      b.disabled=pending;b.setAttribute('aria-pressed',String(position===state.view.position));b.onclick=()=>inspect({position,surface:state.step?'selection':'request',observation_id:null});return b;
    }));
    $('run-identity').textContent=state.step&&!pending?JSON.stringify(state.step):'';
    $('generation-note').textContent=state.step?.decoding_note || ({end_token:state.step?.text?'End token':'Model ended without text',output_budget:'Token budget reached',context_capacity:'Context full'})[state.step?.stop_reason] || '';
    renderSetup();renderPath();status();
    $('numerical-inspector').hidden=!state.prepared||pending;
    if(state.prepared&&!pending)InspectionDetails.render(state,inspect,ontology);else {$('detail-body').replaceChildren();$('inspection-context').textContent='';}
    configuration?.refresh();
  }
  function clearPanels() {
    $('sequence-details').hidden=true;$('output-details').setAttribute('aria-expanded','false');
    $('configuration-detail').replaceChildren();$('configuration-detail').hidden=true;
  }
  async function prepare() {
    if(!state.loaded)return;
    const ticket=epoch,input=structuredClone(state.input);pending=true;render();
    try {
      const prepared=await Execution.prepareGeneration(input);if(ticket!==epoch)return;
      state=S.prepare(state,prepared);
    }catch(e){if(ticket===epoch)setError(e);}
    finally{if(ticket===epoch){pending=false;render();}}
  }
  async function changeModel(id) {
    stop();const ticket=++loadEpoch;state=S.select(state,id);loading=true;clearPanels();render();
    try {
      const loaded=await Execution.loadModel({model_id:id});if(ticket!==loadEpoch)return;
      if(JSON.stringify(loaded.model)!==JSON.stringify(selected()))throw Error('Loaded model differs from catalog');
      state=S.admitModel(state,loaded);loading=false;await prepare();
    }catch(e){if(ticket===loadEpoch){loading=false;setError(e);render();}}
  }
  async function generate(all=false) {
    if(pending||loading||!state.prepared)return;
    playback.stop();const ticket=epoch;running=all;
    try {
      do {
        const request=S.nextRequest(state);pending=true;render();
        const result=await Execution.generateToken(request);if(ticket!==epoch)return;
        state=S.accept(state,result,request);pending=false;render();
      }while(running&&!state.step.stop_reason);
    }catch(e){if(ticket===epoch)setError(e);}
    finally{if(ticket===epoch){pending=false;running=false;render();}}
  }
  const policy=Declarations.schemas.GenerationPolicy.properties.max_new_tokens;
  Object.assign($('output-budget'),{min:policy.minimum,max:policy.maximum,value:state.input.workload.requests[0].request.generation.max_new_tokens});
  $('prompt').value=state.input.workload.requests[0].request.text;
  function edit() {
    stop();const workload=structuredClone(state.input.workload);
    workload.requests[0].request.text=$('prompt').value;
    workload.requests[0].request.generation.max_new_tokens=Number($('output-budget').value);
    try {state=S.edit(state,workload);}catch(e){state=S.reset({...state,input:{...state.input,workload},prepared:null});setError(e);}
    clearPanels();render();
  }
  $('prompt').oninput=edit;$('output-budget').onchange=edit;
  $('edit-input').onclick=()=>{const form=$('inference-form');form.hidden=!form.hidden;$('edit-input').setAttribute('aria-expanded',String(!form.hidden));if(!form.hidden)$('prompt').focus();};
  $('inference-form').onsubmit=async event=>{
    event.preventDefault();if(error||!$('inference-form').reportValidity())return;
    await prepare();if(state.prepared&&!error){$('inference-form').hidden=true;$('edit-input').setAttribute('aria-expanded','false');$('edit-input').focus();}
  };
  $('model-choice').onchange=()=>changeModel($('model-choice').value);
  $('retry-model').onclick=()=>changeModel(state.input.experiment.model_id);
  $('switch-inspection').onclick=()=>changeModel(catalog.models.find(m=>m.inspection==='tensors').id);
  $('next-token').onclick=()=>generate();$('continue-tokens').onclick=()=>generate(true);
  $('stop-tokens').onclick=()=>{running=false;status();};
  $('reset').onclick=()=>{stop();state=S.reset(state);clearPanels();render();};
  $('output-details').onclick=()=>{const panel=$('sequence-details');panel.hidden=!panel.hidden;$('output-details').setAttribute('aria-expanded',String(!panel.hidden));if(state.prepared)inspect({surface:state.step?'selection':'request',observation_id:null});if(!panel.hidden)$('explanation').scrollIntoView({block:'start'});};
  $('explanation-layer').onchange=()=>inspect(S.chooseLayer(state,Number($('explanation-layer').value)));
  $('token-journey').onclick=()=>{if(playback.running())return playback.stop();playback.start(S.journey(state),view=>inspect(view,true));};
  $('download-run').onclick=()=>{if(!state.step)return;const evidence={input:state.input,model:state.loaded.model,prediction:state.step};Declarations.assertShape('GenerationEvidence',evidence);const url=URL.createObjectURL(new Blob([JSON.stringify(evidence)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='inference-run.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  for(const [id,surface] of [['journey-request','request'],['journey-dispatch','system']])$(id).onclick=()=>inspect({surface,observation_id:null});
  $('workload-boundary').dataset.configurationOwner=Declarations.schemas.WorkloadTransformationPreview['x-owner'];
  $('client-boundary').dataset.configurationOwner=Declarations.schemas.ClientConfigurationPreview['x-owner'];
  configuration=ConfigurationPreview.mount(owner=>{
    if(!state.prepared)return;
    const node=state.step?.nodes.find(n=>Declarations.operationOwners[n.operation.name]===owner);
    inspect({surface:node?'model':owner===Declarations.schemas.WorkloadTransformationPreview['x-owner']?'workload':owner===Declarations.schemas.ClientConfigurationPreview['x-owner']?'client':'system',observation_id:node?.id || null});
  },()=>{running=false;playback.stop();render();},[...new Set(Object.values(Declarations.operationOwners)),Declarations.schemas.TokenSelection['x-owner']]);
  render();
  try {
    catalog=await Execution.modelCatalog();
    if(!selected())throw Error('Initial model is absent from the catalog');
    $('model-choice').replaceChildren(...catalog.models.map(m=>new Option(m.label,m.id)));$('model-choice').disabled=false;
    await changeModel(state.input.experiment.model_id);
  }catch(e){setError(e);render();}
})();
