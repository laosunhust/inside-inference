'use strict';
(() => {
  const $ = id => document.getElementById(id);
  if (!$('journey-data')) return;
  const scenarios = JSON.parse($('journey-data').textContent);
  const stepLabs = JSON.parse($('step-labs').textContent);
  const ontology = JSON.parse($('ontology-data').textContent);
  const names = {ingress:'Deliver & reserve', transfer:'Retrieve prefix', prefill:'Prefill input', decode:'Decode output', release:'Release worker state'};
  const available = Object.values(scenarios);
  const rates = [...new Set(available.map(s=>s.compute))].sort((a,b)=>a-b);
  const bandwidths = [...new Set(available.map(s=>s.bandwidth))].sort((a,b)=>a-b);
  const baseline = JSON.parse($('journey-baseline').textContent);
  let run=baseline, time=0, playing=false, last=null, selected='request', pinned=null;
  const source = () => document.querySelector('input[name="source"]:checked').value;
  const number = value => Number(value.toFixed(3));
  const svg = (tag, attrs, text) => {
    const node=document.createElementNS('http://www.w3.org/2000/svg',tag);
    for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);
    if(text!==undefined)node.textContent=text;
    return node;
  };
  const currentState = () => run.events.filter(e=>e.end<=time).at(-1)?.after || run.events[0].before;
  const currentEvent = () => run.events.find(e=>time>=e.start&&time<e.end) || run.events.at(-1);
  function pause() {playing=false;last=null;$('play').textContent=time>=run.end?'↺ Replay':'▶ Run';}
  function inspectEntity(state, active) {
    const target=document.querySelector(`[data-entity="${selected}"]`);
    const definition=ontology[target.dataset.term];
    $('entity-name').textContent=target.dataset.term;
    $('entity-definition').textContent=definition.meaning;
    $('entity-reference').href=`ontology.html#${definition.anchor}`;
    document.querySelectorAll('[data-entity]').forEach(n=>n.classList.toggle('selected-object',n===target));
    const numericalStages=['tokenizer','embedding','layers','projection','selection','detokenizer'];
    const fields=numericalStages.includes(selected)?{Status:'Numerical path implemented separately; not connected to this cost run.',Evidence:'This stage requires observations from actual execution. The current scene uses supplied token counts and aggregate costs only.'}:{
      request:{Identity:'R1',Caller:source(),Input:`${run.input_tokens} pre-tokenized positions`,Output:`${run.output_tokens} fixed abstract steps`,Scope:'Same invocation semantics for every caller; no agent loop.'},
      system:{Identity:'S1',Execution:'One modeled resource (W1); numerical GPT not connected',Phase:time>=run.end?'Complete':names[active.kind],Ready:`${state.ready} abstract state units`,Reserved:`${state.reserved} / ${run.worker_capacity} units`,Rule:'Reservation is capacity accounting; it is not usable cached state.'},
      cache:{Identity:'P1',Residency:run.reuse?'Remote, ready at start':'Not instantiated in this scenario',Size:`${run.remote_state} abstract units`,Compatibility:'Assumed for this model; not verified by a model computation.',Lifetime:'Retained remotely after request completion.'},
      link:{Identity:'L1',Rate:`${run.bandwidth} state units/tick`,Setup:`${run.assumptions.transfer_setup} ticks`,Status:active.kind==='transfer'&&time<run.end?'Transfer in progress':run.reuse?'Idle':'Unused',Rule:'Prefix becomes usable only at transfer completion. No contention in this scenario.'},
      output:{Delivered:`${state.emitted} / ${run.output_tokens} markers`,Trigger:'Each decode completion increments the count.',Delivery:run.assumptions.delivery,Meaning:'Markers are counted outputs, not computed text.'}
    }[selected];
    if(!fields)throw new Error(`Unsupported visual entity: ${selected}`);
    $('entity-state').replaceChildren();
    for(const [key,value] of Object.entries(fields)){
      const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=value;$('entity-state').append(dt,dd);
    }
  }
  function explain(event) {
    const index=run.events.indexOf(event);
    $('event-position').textContent=`EVENT ${index+1} / ${run.events.length} · ${number(event.start)} → ${number(event.end)} ticks`;
    $('event-title').textContent=names[event.kind]+(event.kind==='decode'?` ${event.after.emitted}`:'');
    $('event-rule').textContent=`${event.rule} = ${number(event.duration)} ticks`;
    $('event-meaning').textContent=event.explanation;
    $('dependency').textContent=event.depends_on?`Prerequisite: ${event.depends_on} must finish. Result recorded by ${event.id}.`:'Starts at tick 0. Input tokens are supplied, not tokenized here.';
    $('mechanism-links').replaceChildren();
    if(stepLabs[event.kind]){
      const title=document.createElement('h3');title.textContent='Zoom 3 · Mechanisms & configuration';
      const note=document.createElement('p');note.textContent='Explore labs related to this phase. These are separate experiments; they do not configure the current request. Live nano-GPT attention switching is planned.';
      $('mechanism-links').append(title,note);
      for(const lab of stepLabs[event.kind]){
        const link=document.createElement('a');link.href=`labs/${lab.id}.html`;link.className='lab-link';link.textContent=`${lab.name} · ${lab.status}`;$('mechanism-links').append(link);
      }
    }
    $('state-transition').replaceChildren();
    for(const [key,label] of [['ready','Ready state'],['reserved','Reserved capacity'],['emitted','Delivered outputs']]){
      const block=document.createElement('div');const title=document.createElement('span');const value=document.createElement('strong');title.textContent=label;value.textContent=`${event.before[key]} → ${event.after[key]}`;block.append(title,value);$('state-transition').append(block);
    }
    document.querySelectorAll('[data-event]').forEach(n=>{n.classList.toggle('selected-phase',n.dataset.event===event.id);n.setAttribute('aria-pressed',String(n.dataset.event===event.id));});
  }
  function render() {
    const state=currentState(),active=currentEvent();
    $('play').textContent=playing?'Ⅱ Pause':time>=run.end?'↺ Replay':'▶ Run';
    $('time').value=time;$('clock').textContent=`${number(time)} model ticks`;
    $('client-name').textContent=source();$('output-count').textContent=`${state.emitted} / ${run.output_tokens} delivered`;
    $('completed').textContent=`${state.emitted} / ${run.output_tokens} out`;
    $('worker-label').textContent=time>=run.end?'Released':active.kind==='ingress'?'Awaiting request':names[active.kind];
    const fraction=active.duration?Math.max(0,Math.min(1,(time-active.start)/active.duration)):0;
    $('worker-bar').setAttribute('width',active.kind==='prefill'||active.kind==='decode'?202*fraction:0);
    $('worker-state').textContent=`Ready: ${state.ready} abstract state units`;
    $('worker-reservation').textContent=`Reserved: ${state.reserved} / ${run.worker_capacity}`;
    $('link-status').textContent=active.kind==='transfer'&&time<run.end?'Copy in progress · not ready yet':run.reuse?`${run.bandwidth} units/tick · idle`:'No transfer requested';
    $('output-tokens').replaceChildren(...Array.from({length:run.output_tokens},(_,i)=>svg('rect',{x:16+i*38,y:76,width:29,height:18,rx:4,fill:i<state.emitted?'#147d69':'#e0e7de'})));
    $('moving-markers').replaceChildren();
    if(active.kind==='ingress'||active.kind==='transfer'){
      let x,y;
      if(active.kind==='ingress'){x=230+175*fraction;y=117;}
      else {const distance=200*fraction;x=distance<120?330+distance:450;y=distance<120?260:260-(distance-120);}
      const g=svg('g',{transform:`translate(${x} ${y})`});g.append(svg('circle',{r:13,fill:active.kind==='transfer'?'#b2823e':'#147d69'}),svg('text',{y:4,'text-anchor':'middle',fill:'white','font-size':10},active.kind==='transfer'?'P1':'R1'));$('moving-markers').append(g);
    }
    inspectEntity(state,active);explain(pinned||active);
  }
  function change() {
    pause();pinned=null;time=0;
    run=scenarios[`${Number($('reuse').checked)}-${rates[Number($('compute').value)]}-${$('bandwidth').value}`];
    $('time').max=run.end;$('compute-value').textContent=`${run.compute} units/tick`;
    $('finish-value').textContent=`${number(run.end)} ticks`;
    const delta=run.end-baseline.end;
    $('finish-delta').textContent=delta===0?'Same as no-reuse baseline':`${number(Math.abs(delta))} ticks ${delta<0?'earlier':'later'} than no-reuse, rate-${baseline.compute} baseline`;
    $('cache-label').textContent=run.reuse?`${run.prefix_tokens} units · warm by assumption`:'Not used in this run';
    $('cache-blocks').replaceChildren(...Array.from({length:run.prefix_tokens},(_,i)=>svg('rect',{x:16+i*31,y:38,width:23,height:13,rx:3,fill:run.reuse?'#b2823e':'#d4ddd2'})));
    $('input-tokens').replaceChildren(...Array.from({length:run.input_tokens},(_,i)=>svg('rect',{x:16+i*20,y:78,width:15,height:13,rx:2,fill:run.reuse&&i<run.prefix_tokens?'#b2823e':'#659c82'})));
    $('timeline').replaceChildren();
    for(const event of run.events){
      const button=document.createElement('button');button.dataset.event=event.id;button.className=`phase-button ${event.kind}`;
      const title=document.createElement('span'),duration=document.createElement('small');title.textContent=names[event.kind]+(event.kind==='decode'?` ${event.after.emitted}`:'');duration.textContent=`${number(event.duration)} ticks`;
      button.append(title,duration);button.addEventListener('click',()=>{pause();time=event.start;pinned=event;render();});$('timeline').append(button);
    }
    render();
  }
  document.querySelectorAll('[data-entity]').forEach(node=>{
    const select=()=>{selected=node.dataset.entity;if(selected==='system')$('system-details').open=true;render();};node.addEventListener('click',select);node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}});
  });
  document.querySelectorAll('input[name="source"]').forEach(node=>node.addEventListener('change',change));
  ['reuse','compute','bandwidth'].forEach(id=>$(id).addEventListener('input',change));
  $('play').addEventListener('click',()=>{pinned=null;if(playing)pause();else{if(time>=run.end)time=0;playing=true;last=null;$('play').textContent='Ⅱ Pause';}render();});
  $('reset').addEventListener('click',()=>{pause();time=0;pinned=null;render();});
  $('next-event').addEventListener('click',()=>{pause();pinned=null;time=Math.min(...run.events.map(e=>e.end).filter(t=>t>time+1e-8),run.end);render();});
  $('time').addEventListener('input',()=>{pause();pinned=null;time=Number($('time').value);render();});
  $('download-trace').addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify({...run,source:source(),source_semantics:'label only; no source-specific behavior'},null,2)],{type:'application/json'});
    const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='inside-inference-request.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
  });
  function frame(now){if(playing){if(last!==null)time=Math.min(run.end,time+Math.min(now-last,100)/1000);last=now;render();if(time>=run.end)pause();}requestAnimationFrame(frame);}
  function inspectHash() {
    const entity=location.hash.replace('#inspect-','');
    const node=Array.from(document.querySelectorAll('[data-entity]')).find(n=>n.dataset.entity===entity);
    if(node){selected=entity;if(entity==='system'||node.closest('#system-details'))$('system-details').open=true;render();}
  }
  window.addEventListener('hashchange',inspectHash);
  $('compute').max=rates.length-1;$('compute').value=rates.indexOf(baseline.compute);
  $('compute-min').textContent=`${rates[0]} work units/tick`;
  $('compute-max').textContent=`${rates.at(-1)} work units/tick`;
  for(const rate of bandwidths){const option=document.createElement('option');option.value=rate;option.textContent=`${rate} state units/tick`;$('bandwidth').append(option);}
  $('input-count').textContent=`${baseline.input_tokens} input · ${baseline.output_tokens} output steps`;
  $('prefix-assumption').textContent=`Assume ${baseline.prefix_tokens} compatible input positions`;
  $('bandwidth').value=baseline.bandwidth;change();inspectHash();requestAnimationFrame(frame);
})();
