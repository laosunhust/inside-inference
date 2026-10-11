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
  function validatePrepared(prepared) {
    Declarations.assertShape('PreparedInput',prepared);
    Declarations.assertBound('RunBinding',prepared.declaration,prepared.declaration);
    if(prepared.contract_sha256!==Declarations.hash) throw new Error('Preparation contract differs');
    if(prepared.declaration.workload.requests.length!==1 || !prepared.tokenizer.ids.length) throw new Error('Unsupported prepared workload');
    if(!equal(prepared.declaration.ontology_binding,Declarations.labs.find(l=>l.id==='naive-gpt').ontology_binding)) throw new Error('Preparation experiment differs');
  }
  const cursor = prepared => ({run_id:null,position:prepared.tokenizer.ids.length-1,observation_id:null,surface:'request'});
  function create(prepared) {
    validatePrepared(prepared);
    return {prepared,draft:copy(prepared.declaration.workload),submitted:null,view:cursor(prepared),step:null,submitted_step:null,phase:'offline',live:false,error:null};
  }
  function transition(state,event) {
    switch(event.type) {
      case 'CONNECT': return {...state,live:true,phase:equal(state.draft,state.prepared.declaration.workload)?'ready':'dirty'};
      case 'EDIT':
        if(!state.live || state.phase==='running') throw new Error('Request is not editable in this state');
        Declarations.assertShape('Workload',event.workload);
        return {...state,draft:copy(event.workload),phase:equal(event.workload,state.prepared.declaration.workload)?'ready':'dirty',error:null};
      case 'SUBMIT': {
        if(!state.live || state.phase==='running') throw new Error('Preparation unavailable');
        const submitted={...state.prepared.declaration,workload:copy(state.draft)};
        Declarations.assertBound('RunBinding',submitted,submitted);
        return {...state,submitted,step:null,view:cursor(state.prepared),phase:'running',error:null};
      }
      case 'ACCEPT':
        if(state.phase!=='running' || !equal(event.prepared.declaration,state.submitted)) throw new Error('Preparation differs from submitted declarations');
        validatePrepared(event.prepared);
        return {...state,prepared:event.prepared,draft:copy(event.prepared.declaration.workload),submitted:null,view:cursor(event.prepared),step:null,submitted_step:null,phase:'ready',error:null};
      case 'RESET':
        if(state.phase==='running') throw new Error('Wait for the pending operation before reset');
        return {...state,step:null,submitted:null,submitted_step:null,view:cursor(state.prepared),error:null,phase:!state.live?'offline':equal(state.draft,state.prepared.declaration.workload)?'ready':'dirty'};
      case 'FAIL': return {...state,submitted:null,submitted_step:null,phase:'failed',error:event.message};
      case 'STEP_SUBMIT': {
        if(!state.live || !['ready','failed'].includes(state.phase) || !equal(state.draft,state.prepared.declaration.workload)) throw new Error('Apply edited input before token execution');
        const submitted_step=nextRequest(state);
        return {...state,submitted_step,phase:'running',error:null};
      }
      case 'STEP_ACCEPT':
        if(state.phase!=='running' || !state.submitted_step || !equal(event.result.request,state.submitted_step)) throw new Error('Step differs from submitted prefix');
        validateStep(event.result,state.prepared);
        return {...state,step:event.result,submitted_step:null,phase:'ready',error:null,
          view:{run_id:event.result.id,position:event.result.sequence_ids.length-1,observation_id:null,surface:'selection'}};
      case 'INSPECT': {
        if(state.phase==='running') throw new Error('Inspection is locked during execution');
        const view={...state.view,...event.view};
        Declarations.assertShape('InspectionState',view);
        if(view.run_id!==(state.step?.id || null) || view.position>=sequence(state).length) throw new Error('Inspection cursor is outside current execution');
        if(view.observation_id!==null && !state.step?.computation.nodes.some(n=>n.id===view.observation_id)) throw new Error('Observation is outside current computation');
        if(view.surface==='selection' && !state.step) throw new Error('No token selection has executed');
        return {...state,view};
      }
      default: throw new Error('Unknown inspection transition');
    }
  }
  const output = state => state.step?.computation.display_so_far || '';
  const sequence = state => state.step?.sequence_ids || state.prepared.tokenizer.ids;
  const computation = state => state.phase==='running' ? null : state.step?.computation || null;
  function journey(state) {
    const pass=computation(state);
    if(!pass) throw new Error('No computation to replay');
    return [{surface:'request',observation_id:null},{surface:'system',observation_id:null},
      ...pass.nodes.map(node=>({surface:'model',observation_id:node.id})),
      {surface:'selection',observation_id:null},{surface:'response',observation_id:null}];
  }
  function nextRequest(state) {
    const trace=state.prepared, ids=sequence(state), position=state.view.position;
    const root=state.step?.request.prefix_ids || trace.tokenizer.ids;
    const prefix_ids=position<root.length ? ids.slice(0,position+1) : [...root];
    const output_ids=position<root.length ? [] : ids.slice(root.length,position+1);
    const spec={checkpoint_sha256:trace.declaration.model.checkpoint_sha256,prefix_ids,output_ids,
      generation:copy(trace.declaration.workload.requests[0].request.generation),ontology_binding:copy(trace.declaration.ontology_binding)};
    Declarations.assertShape('TokenStepRequest',spec);
    const end=trace.vocabulary.find(t=>t.kind==='control' && t.piece==='TURN_END').id;
    if(output_ids.includes(end)) throw new Error('TURN_END selected; reset or select an earlier prefix');
    if(output_ids.length>=spec.generation.max_new_tokens) throw new Error('Output budget exhausted; reset or select an earlier prefix');
    if(prefix_ids.length+output_ids.length>trace.checkpoint.config.context) throw new Error('Selected prefix exceeds context capacity');
    return spec;
  }
  function validateStep(result,prepared) {
    Declarations.assertShape('TokenStepResult',result);
    const trace=prepared, spec=result.request, p=result.computation;
    if(result.contract_sha256!==Declarations.hash || spec.checkpoint_sha256!==trace.declaration.model.checkpoint_sha256 || !equal(result.checkpoint,trace.checkpoint)) throw new Error('Step checkpoint or contract differs');
    const prefix=[...spec.prefix_ids,...spec.output_ids], selected=p.selection.selected_id;
    const output=[...spec.output_ids,selected], end=trace.vocabulary.find(t=>t.kind==='control' && t.piece==='TURN_END').id;
    const remaining=spec.generation.max_new_tokens-output.length;
    const stop=selected===end ? 'turn_end' : remaining===0 ? 'output_budget' : null;
    const logits=p.selection.raw_logits, winner=logits.reduce((best,x,i)=>x>logits[best]?i:best,0);
    if(p.run_id!==result.id || !equal(p.input_ids,prefix) || p.selection_position!==prefix.length-1 || p.output_position!==prefix.length || p.step!==spec.output_ids.length || winner!==selected ||
       !equal(result.output_ids,output) || !equal(result.sequence_ids,[...prefix,selected]) || result.remaining_tokens!==remaining || result.stop_reason!==stop) throw new Error('Step evidence differs from its exact prefix and selection');
  }
  globalThis.InspectionSession={create,transition,sequence,computation,nextRequest,validateStep,output,journey};
})();
