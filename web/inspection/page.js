import {resourceExperiment} from './resources.js';
import './session.js';
import {createTiming} from './performance/observations.js';
import {mountTiming} from './performance/panel.js';
/* The selected experiment and its accepted request own every projection on this page. */
(async()=>{
  const $=id=>document.getElementById(id), S=InspectionSession;
  let resources;
  const timing=createTiming(),performancePanel=mountTiming($('interaction-performance'));
  const renderPerformance=()=>performancePanel(timing.evidence(),state.step?.output_ids.length||0,!!S.controls(state).resources);
  let state=S.create(JSON.parse($('inference-data').textContent)),catalog=null;
  let epoch=0,loadEpoch=0,loading=false,pending=false,running=false,error='',configuration;
  const playback=ExecutionPath.playback(()=>status());
  const systemMap=SystemMap.mount($('system-map'),document.querySelector('.execution-endpoint'));
  const selected=()=>catalog?.models.find(m=>m.id===S.controls(state).model_id);
  const compact=n=>n.toLocaleString('en-US',{notation:'compact',maximumFractionDigits:0});
  const label=id=>(state.loaded?.token_pieces[id] || '').replaceAll(' ','␠');
  const setError=e=>{error=e.message.trim().split('\n').at(-1);console.error(e);};
  const stop=()=>{timing.clear();epoch++;pending=false;running=false;playback.stop();error='';};
  function inspect(view,automatic=false) {
    if(!automatic)playback.stop();
    state=S.inspect(state,view);
    const owner=view.surface==='model'?Declarations.operationOwners[S.computation(state).nodes.find(n=>n.id===view.observation_id).operation.name]:view.surface==='architecture'?S.architecture(state)[view.architecture_step].owner:null;
    if(owner)systemMap.reveal(owner);
    render();
    const stage=$('computation-path').querySelector('.selected-object')?.parentElement;
    if(stage){const scroll=document.querySelector('.execution-scroll');if(stage.offsetLeft<scroll.scrollLeft||stage.offsetLeft+stage.offsetWidth>scroll.scrollLeft+scroll.clientWidth)scroll.scrollLeft=stage.offsetLeft-(scroll.clientWidth-stage.offsetWidth)/2;}
  }
  function status() {
    let unavailable='';try{S.nextRequest(state);}catch(e){unavailable=e.message;}
    const disabled=loading||pending||!state.prepared||!!error||!!unavailable;
    $('next-token').disabled=disabled||!!S.controls(state).resources;$('continue-tokens').disabled=S.controls(state).resources?(loading||pending||!state.loaded||!!error):disabled;
    $('next-token').title=S.controls(state).resources?'Generate executes the scheduled workload':unavailable;
    $('stop-tokens').hidden=!running;
    $('execute').disabled=!state.loaded||pending||loading;
    $('reset').disabled=!state.step&&!state.resource&&!pending;
    $('download-run').disabled=(!state.step&&!state.resource)||pending;
    $('token-journey').disabled=(!state.prepared&&!state.resource)||pending||loading;
    $('token-journey').textContent=playback.running()?'Pause Journey':'Token Journey';
    $('token-journey').setAttribute('aria-pressed',String(playback.running()));
    $('binding-status').textContent=error || (loading?'Loading model…':pending?'Computing…':(!state.prepared&&state.loaded&&!S.controls(state).resources?'Apply input to prepare the request':''));
    $('binding-status').hidden=!$('binding-status').textContent;
    $('binding-status').dataset.phase=error?'failed':loading?'loading':pending?'running':(state.prepared||S.controls(state).resources)?'ready':'loading';
    $('run-error').hidden=!error;$('run-error').textContent=error;
    $('retry-model').hidden=loading||!!state.loaded||!catalog;
    $('model-loading').textContent=loading?'Downloading and verifying…':state.loaded?'Ready':error?'Load failed':'';
  }
  function renderSetup() {
    const model=selected();if(!model){$('active-model-summary').textContent='Loading model…';return;}
    const a=model.architecture;
    $('active-model-summary').textContent=`${compact(model.parameters)} params · ${a.layers} ${a.layers===1?'layer':'layers'}${S.controls(state).resources?' · resource simulation':''}`;
    $('active-model-details').replaceChildren(InspectionDetails.table(['Attribute','Value'],[
      ['Parameters',model.parameters.toLocaleString('en-US')],['Channels',a.width],['Attention heads',a.heads],['Vocabulary',`${a.vocabulary} IDs`],['Context',`${a.context} positions`],['Position',a.position],['Precision',a.precision],['Inspection',model.inspection]
    ]));
    $('model-choice').value=model.id;
    $('inspection-unavailable').hidden=model.inspection==='tensors';
    if($('numerics').dataset.modelId!==model.id){$('numerics').open=model.inspection==='tensors';$('numerics').dataset.modelId=model.id;}
    const inspection=catalog.models.find(m=>m.inspection==='tensors');
    $('switch-inspection').textContent=`Switch to ${compact(inspection.parameters)} for tensors`;
  }
  function renderPath() {
    const pass=S.computation(state),visible=!!state.loaded&&(!!state.prepared||!!S.controls(state).resources)&&!pending,layer=S.layer(state);
    $('layer-control').hidden=!visible || state.loaded.model.architecture.layers===1;
    if(visible){const count=state.loaded.model.architecture.layers;$('explanation-layer').replaceChildren(...Array.from({length:count},(_,i)=>new Option(`Layer ${i+1} of ${count}`,String(i))));$('explanation-layer').value=String(layer);}
    document.querySelector('.execution-endpoint').hidden=!visible;
    const path=$('computation-path');
    if(!visible){path.replaceChildren();delete path.dataset.passId;delete path.dataset.runId;$('execution-edges').querySelectorAll('path').forEach(p=>p.remove());}
    else ExecutionPath.architecture(S.architecture(state),state.loaded.model.id,index=>inspect({surface:'architecture',architecture_step:index,observation_id:null}),layer);
    const stages=S.architecture(state),observation=pass?.nodes.find(n=>n.id===state.view.observation_id);
    const selectedStage=state.view.surface==='architecture'?state.view.architecture_step:observation?stages.findIndex(s=>s.layer===observation.layer&&s.operations.includes(observation.operation.name)):-1;
    document.querySelectorAll('[data-architecture-step]').forEach(item=>item.querySelector('button').classList.toggle('selected-object',Number(item.dataset.architectureStep)===selectedStage));
    $('computation-caption').textContent=pass&&!pending?`${state.resource?pass.request_id+' · '+pass.phase:pass.request.output_ids.length?'Decode':'Prefill'} · ${S.work(state).processed_positions} computed${S.work(state).reused_positions?` · ${S.work(state).reused_positions} retained`:''}`:'';
  }
  function render() {
    $('request-preview').textContent=state.input.workload.requests.map(r=>(state.input.workload.requests.length>1?r.request_id+': ':'')+(r.request.text||'(empty input)')).join(' · ');
    $('response-preview').textContent=state.resource?Object.entries(state.resource.outputs).map(([id,text])=>`${id}: ${text}`).join(' · '):S.output(state);
    $('client-boundary').classList.toggle('has-output',!!state.step||!!state.resource);
    const ids=S.sequence(state);
    $('pass-caption').textContent=`Input + output · ${ids.length} positions`;
    $('sequence-strip').replaceChildren(...ids.map((id,position)=>{
      const b=document.createElement('button');b.className='token-chip'+(position===state.view.position?' active':'');
      const small=document.createElement('small'),strong=document.createElement('strong');small.textContent=`p${position} · #${id}`;strong.textContent=label(id);b.append(small,strong);
      b.disabled=pending;b.setAttribute('aria-pressed',String(position===state.view.position));b.onclick=()=>inspect({position,surface:state.step?'selection':'request',observation_id:null});return b;
    }));
    $('run-identity').textContent=state.step&&!pending?JSON.stringify(state.step):'';
    $('generation-note').textContent=state.resource?Object.entries(state.resource.decoding_notes).map(([id,note])=>id+': '+note).join(' · '):state.step?.decoding_note || ({end_token:state.step?.text?'End token':'Model ended without text',output_budget:'Token budget reached',context_capacity:'Context full'})[state.step?.stop_reason] || '';
    renderSetup();renderPath();status();renderPerformance();
    $('numerical-inspector').hidden=(!state.prepared&&!S.controls(state).resources)||pending;
    if((state.prepared||S.controls(state).resources)&&!pending)InspectionDetails.render(state,inspect);else {$('detail-body').replaceChildren();$('concept-body').replaceChildren();$('inspection-context').textContent='';}
    configuration?.refresh();systemMap.refresh(state.input.execution);resources?.render(state.resource,state.view);
  }
  function clearPanels() {
    $('sequence-details').hidden=true;$('output-details').setAttribute('aria-expanded','false');
  }
  async function prepare() {
    if(!state.loaded||S.controls(state).resources)return;
    const ticket=epoch,input=structuredClone(state.input);timing.clear();pending=true;render();
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
    const started=performance.now();
    if(pending||loading)return;
    if(S.controls(state).resources){
      stop();const ticket=epoch;pending=true;state=S.reset(state);render();
      try{const resource=await Execution.simulateResources(state.input);if(ticket===epoch){state={...state,resource,view:{...state.view,run_id:resource.run.id,computation_index:0,position:0,surface:'system',observation_id:null}};}}
      catch(e){if(ticket===epoch)setError(e);}
      finally{if(ticket===epoch){pending=false;render();}}return;
    }
    if(!state.prepared)return;
    playback.stop();const ticket=epoch;running=all;let first=true;
    try {
      do {
        const request=S.nextRequest(state);
        if(first){
          const previous=state.step,continuation=!!previous&&JSON.stringify(request.prefix_ids)===JSON.stringify(previous.request.prefix_ids)&&JSON.stringify(request.output_ids)===JSON.stringify(previous.output_ids);
          timing.begin(all?'continuous':'manual',started,continuation);first=false;
        }
        pending=true;render();
        const result=await Execution.generateToken(request);if(ticket!==epoch)return;
        const before=S.output(state);
        state=S.accept(state,result,request);pending=false;render();
        timing.record(result,performance.now(),S.output(state)!==before&&S.output(state).length>0);renderPerformance();
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
    await prepare();if((state.prepared||S.controls(state).resources)&&!error){$('inference-form').hidden=true;$('edit-input').setAttribute('aria-expanded','false');$('edit-input').focus();}
  };
  $('model-choice').onchange=()=>changeModel($('model-choice').value);
  $('retry-model').onclick=()=>changeModel(S.controls(state).model_id);
  $('switch-inspection').onclick=()=>changeModel(catalog.models.find(m=>m.inspection==='tensors').id);
  $('next-token').onclick=()=>generate();$('continue-tokens').onclick=()=>generate(true);
  $('stop-tokens').onclick=()=>{running=false;status();};
  $('reset').onclick=()=>{stop();state=S.reset(state);clearPanels();render();};
  $('output-details').onclick=()=>{const panel=$('sequence-details');panel.hidden=!panel.hidden;$('output-details').setAttribute('aria-expanded',String(!panel.hidden));if(state.prepared||state.resource)inspect({surface:state.step?'selection':'request',observation_id:null});if(!panel.hidden)$('explanation').scrollIntoView({block:'start'});};
  $('explanation-layer').onchange=()=>inspect(S.chooseLayer(state,Number($('explanation-layer').value)));
  $('token-journey').onclick=()=>{if(playback.running())return playback.stop();playback.start(S.journey(state),view=>inspect(view,true));};
  $('download-run').onclick=()=>{if(!state.step&&!state.resource)return;const evidence=state.resource||{input:state.input,model:state.loaded.model,prediction:state.step,timing:timing.evidence()};Declarations.assertShape(state.resource?'ResourceExecution':'GenerationEvidence',evidence);const url=URL.createObjectURL(new Blob([JSON.stringify(evidence)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='inference-run.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  configuration=ExecutionConfiguration.mount(()=>state.input.execution,async(control,value)=>{
    stop();state=S.configure(state,control,value);clearPanels();await prepare();
  });
  async function applyExperiment(experiment) {
    // An experiment replaces the whole ExecutionSpec; prior evidence is invalidated like any change.
    stop();const execution={experiments:structuredClone(experiment.settings)};
    Declarations.assertShape('ExecutionSpec',execution);
    const model=execution.experiments.find(e=>e.control==='model').value,same=state.loaded?.model.id===model;
    state=S.reset({...state,input:{...state.input,execution},prepared:null,loaded:same?state.loaded:null});
    $('model-choice').value=model;clearPanels();
    if(same){render();await prepare();}else await changeModel(model);
  }
  Experiments.mount($('experiments'),applyExperiment);
  resources=resourceExperiment(()=>state.input,async input=>{
    stop();state=S.reset({...state,input,prepared:null});$('prompt').value=input.workload.requests[0].request.text;$('output-budget').value=input.workload.requests[0].request.generation.max_new_tokens;clearPanels();render();await prepare();
  },view=>inspect(view),configuration);
  render();
  try {
    catalog=await Execution.modelCatalog();
    if(!selected())throw Error('Initial model is absent from the catalog');
    $('model-choice').replaceChildren(...catalog.models.map(m=>new Option(m.label,m.id)));$('model-choice').disabled=false;
    await changeModel(S.controls(state).model_id);
    if(location.hash==='#system-dialog')$('open-system').click();
  }catch(e){setError(e);render();}
})();
