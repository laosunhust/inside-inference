import assert from 'node:assert/strict';
export async function checkExecution({evaluate},model,input,prepared) {
  const prepare=async reuse=>{const value=structuredClone(input);value.execution.experiments.find(e=>e.control==='kv_reuse').value=reuse;return evaluate(`Execution.prepareGeneration(${JSON.stringify(value)})`);};
  const make=p=>({session_id:p.session_id,prefix_ids:p.prompt_ids,output_ids:[]});
  const run=request=>evaluate(`Execution.generateToken(${JSON.stringify(request)})`);
  const cachedSession=await prepare(true),request=make(cachedSession);
  const cold=await run(request);
  assert.equal(cold.work.processed_positions,prepared.prompt_ids.length);assert.equal(cold.work.reused_positions,0);
  if(model.stop_ids.includes(cold.selected_id))throw Error('The cache evaluation needs a nonterminal first selection');
  request.output_ids=[cold.selected_id];
  const cached=await run(request);
  assert.equal(cached.work.processed_positions,1);assert.equal(cached.work.reused_positions,prepared.prompt_ids.length);
  const branch={...make(cachedSession),prefix_ids:cachedSession.prompt_ids.slice(0,3)};
  const branched=await run(branch);assert.equal(branched.work.reused_positions,0);
  const recompute=await prepare(false),noReuse={...request,session_id:recompute.session_id};
  const uncached=await run(noReuse);
  assert.equal(uncached.work.processed_positions,prepared.prompt_ids.length+1);assert.equal(uncached.work.reused_positions,0);assert.ok(cached.work.matmul_flops<uncached.work.matmul_flops);
  assert.deepEqual(cached.logits,uncached.logits,'The same decoder must reproduce cached computation exactly');
  assert.equal(cached.selected_id,uncached.selected_id);assert.deepEqual(cached.sequence_ids,uncached.sequence_ids);
  assert.deepEqual(branched.logits,(await run({...branch,session_id:recompute.session_id})).logits);
  const stale=await evaluate(`(async()=>{try{await Execution.generateToken(${JSON.stringify(request)});return '';}catch(e){return String(e);}})()`);
  assert.match(stale,/Stale or missing/);
  const duplicate=structuredClone(input);duplicate.execution.experiments[1]=structuredClone(duplicate.execution.experiments[0]);
  const error=await evaluate(`(async()=>{try{await Execution.prepareGeneration(${JSON.stringify(duplicate)});return '';}catch(e){return String(e);}})()`);
  assert.match(error,/Conflicting execution control|contain.*valid|matching the given schema/);
  return {model:model.id,cached:cached.work,recomputed:uncached.work,identical_logits:true,branch_recomputed:true,stale_rejected:true};
}

export const requestFor=(prepared,ids)=>({session_id:prepared.session_id,prefix_ids:ids,output_ids:[]});
export const comparablePrediction=result=>{const value=structuredClone(result);delete value.session_id;delete value.decoder_ms;delete value.service_ms;return value;};
