/* Interaction transitions over generated declarations. No model computation. */
(() => {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const equal = (a,b) => {
    if (a === b) return true;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
    const keys = Object.keys(a).sort();
    return JSON.stringify(keys) === JSON.stringify(Object.keys(b).sort()) && keys.every(k => equal(a[k], b[k]));
  };
  function validateTrace(run) {
    if (run.contract_sha256 !== Declarations.hash) throw new Error('Run contract differs from this page');
    Declarations.assertBound('RequestBinding', run.declaration, run.declaration);
    Declarations.assertShape('RunOutcome', run.outcome);
    const outcome = run.outcome, request = run.declaration.request;
    if (!run.passes.length || outcome.selected_tokens !== run.passes.length || outcome.selected_tokens !== run.output_ids.length || outcome.unused_budget !== request.generation.max_new_tokens - run.output_ids.length) throw new Error('Run outcome does not match its request and trace');
    const terminal = run.vocabulary.find(t => t.kind === 'control' && t.piece === 'TURN_END').id;
    if (outcome.delivered_tokens !== run.output_ids.filter(id => id !== terminal).length || outcome.complete !== (outcome.stop_reason === 'turn_end')) throw new Error('Run termination counts disagree');
    if (outcome.stop_reason === 'turn_end' && run.output_ids.at(-1) !== terminal) throw new Error('Missing terminal selection');
    if (outcome.stop_reason !== 'turn_end' && run.output_ids.includes(terminal)) throw new Error('Terminal selection requires turn_end');
    if (outcome.stop_reason === 'output_budget' && outcome.unused_budget !== 0) throw new Error('Budget was not exhausted');
    const prefix = [...run.tokenizer.ids];
    run.passes.forEach((p,i) => {
      if (p.run_id !== run.id || p.step !== i || !equal(p.input_ids,prefix) || p.selection.selected_id !== run.output_ids[i]) throw new Error('Trace is not bound to this run');
      const logits=p.selection.raw_logits;
      const winner=logits.reduce((best,x,i)=>x>logits[best]?i:best,0);
      if(p.selection.selected_id!==winner) throw new Error('Selection differs from raw-logit argmax');
      if(i>0 && run.output_ids[i-1]===terminal) throw new Error('Generation continued after TURN_END');
      prefix.push(p.selection.selected_id);
    });
    if (!equal(prefix,run.sequence_ids)) throw new Error('Run sequence differs');
  }
  function validateRun(run) {
    Declarations.assertShape('RunRecord',run);
    Declarations.assertBound('RunBinding',run.declaration,run.declaration);
    if (run.contract_sha256 !== Declarations.hash) throw new Error('Run contract differs');
    if (run.traces.length !== 1 || run.declaration.workload.requests.length !== 1) throw new Error('Unsupported workload');
    const trace = run.traces[0], arrival = run.declaration.workload.requests[0];
    validateTrace(trace);
    if (arrival.arrival_us !== 0 || trace.id !== run.id || trace.request_id !== arrival.request_id ||
        !equal(trace.declaration,{model:run.declaration.model,system:run.declaration.system,request:arrival.request})) throw new Error('Trace differs from workload binding');
    const committed = [], delivered = [];
    run.events.forEach((event,i) => {
      if (event.sequence !== i || event.run_id !== run.id || event.request_id !== arrival.request_id ||
          event.event_id !== `${run.id}/event-${i}` || event.causes.some(id=>!run.events.slice(0,i).some(prior=>prior.event_id===id))) throw new Error('Invalid event identity or order');
      const p = event.payload;
      if (p.kind === 'token-committed') {
        if (p.output_start !== committed.length) throw new Error('Invalid commitment offset');
        committed.push(...p.token_ids);
      }
      if (p.kind === 'token-delivered') {
        if (p.output_start !== delivered.length || !equal(p.token_ids,committed.slice(delivered.length,delivered.length+p.token_ids.length))) throw new Error('Delivery without commitment');
        delivered.push(...p.token_ids);
      }
    });
    const terminal=trace.vocabulary.find(t=>t.kind==='control' && t.piece==='TURN_END').id;
    const output=trace.output_ids.filter(id=>id!==terminal);
    if (!equal(committed,output) || !equal(delivered,output)) throw new Error('Delivered IDs differ from selected output');
    if (delivered.length !== trace.outcome.delivered_tokens || deliveryText(run) !== trace.output_display) throw new Error('Delivered output differs');
  }
  const deliveryText = (run,prediction=Infinity) => {
    const workIds = new Set(run.traces[0].passes.filter(p=>p.step<=prediction).map(p=>p.id));
    return run.events.filter(e=>e.payload.kind==='token-delivered' && workIds.has(e.payload.work_id)).map(e=>e.payload.display_delta).join('');
  };
  const cursor = run => ({run_id:run.id,prediction:0,position:run.traces[0].passes[0].selection_position});
  function create(run) {
    validateRun(run);
    return {run, draft:copy(run.declaration.workload), submitted:null, view:cursor(run), phase:'offline', live:false, error:null};
  }
  function transition(state, event) {
    switch (event.type) {
      case 'CONNECT': return {...state, live:true, phase:equal(state.draft,state.run.declaration.workload)?'ready':'dirty'};
      case 'EDIT':
        if (!state.live || state.phase === 'running') throw new Error('Request is not editable in this state');
        Declarations.assertShape('Workload',event.workload);
        return {...state,draft:copy(event.workload),phase:equal(event.workload,state.run.declaration.workload)?'ready':'dirty',error:null};
      case 'SUBMIT': {
        if (!state.live || state.phase === 'running') throw new Error('Execution is unavailable');
        const submitted = {...state.run.declaration,workload:copy(state.draft)};
        Declarations.assertBound('RunBinding',submitted,submitted);
        return {...state,submitted,phase:'running',error:null};
      }
      case 'ACCEPT':
        if (state.phase !== 'running' || !equal(event.run.declaration,state.submitted)) throw new Error('Response does not match the submitted declarations');
        validateRun(event.run);
        return {...state,run:event.run,draft:copy(event.run.declaration.workload),submitted:null,view:cursor(event.run),phase:'ready',error:null};
      case 'FAIL': return {...state,submitted:null,phase:'failed',error:event.message};
      case 'INSPECT': {
        const view = {...state.view,...event.view};
        Declarations.assertShape('InspectionState',view);
        if (view.run_id !== state.run.id || !state.run.traces[0].passes[view.prediction] || view.position >= state.run.traces[0].passes[view.prediction].input_ids.length) throw new Error('Inspection cursor is outside this run');
        return {...state,view};
      }
      default: throw new Error('Unknown inspection transition');
    }
  }
  globalThis.InspectionSession = {create,transition,validateRun,deliveryText};
})();
