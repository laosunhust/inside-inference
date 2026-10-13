import assert from 'node:assert/strict';
export async function checkExecution({evaluate},model,input,prepared) {
  const make=reuse=>{const execution=structuredClone(input.execution);execution.experiments.find(e=>e.control==='kv_reuse').value=reuse;return {execution,prefix_ids:prepared.prompt_ids,output_ids:[],generation:input.workload.requests[0].request.generation};};
  const run=request=>evaluate(`Execution.generateToken(${JSON.stringify(request)})`);
  const cold=await run(make(false));
  assert.equal(cold.work.processed_positions,prepared.prompt_ids.length);assert.equal(cold.work.reused_positions,0);
  if(model.stop_ids.includes(cold.selected_id))throw Error('The cache evaluation needs a nonterminal first selection');
  const request=make(true);request.output_ids=[cold.selected_id];
  const cached=await run(request);
  assert.equal(cached.work.processed_positions,1);assert.equal(cached.work.reused_positions,prepared.prompt_ids.length);
  const noReuse=structuredClone(request);noReuse.execution.experiments.find(e=>e.control==='kv_reuse').value=false;
  const uncached=await run(noReuse);
  assert.equal(uncached.work.processed_positions,prepared.prompt_ids.length+1);assert.equal(uncached.work.reused_positions,0);assert.ok(cached.work.matmul_flops<uncached.work.matmul_flops);
  assert.deepEqual(cached.logits,uncached.logits,'The same decoder must reproduce cached computation exactly');
  assert.equal(cached.selected_id,uncached.selected_id);
  assert.deepEqual(cached.sequence_ids,uncached.sequence_ids);
  const branch=make(true);branch.prefix_ids=prepared.prompt_ids.slice(0,3);
  const branched=await run(branch);assert.equal(branched.work.reused_positions,0);
  branch.execution.experiments.find(e=>e.control==='kv_reuse').value=false;
  assert.deepEqual(branched.logits,(await run(branch)).logits);
  const duplicate=make(false);duplicate.execution.experiments[1]=structuredClone(duplicate.execution.experiments[0]);
  const error=await evaluate(`(async()=>{try{await Execution.generateToken(${JSON.stringify(duplicate)});return '';}catch(e){return String(e);}})()`);
  assert.match(error,/Conflicting execution control|contain.*valid|matching the given schema/);
  return {model:model.id,cached:cached.work,recomputed:uncached.work,identical_logits:true,branch_recomputed:true};
}
