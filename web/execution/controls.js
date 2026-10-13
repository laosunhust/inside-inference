/* Resolve one composition; list order never overrides another assignment. */
export function resolveExecution(spec) {
  const values={};
  for(const experiment of spec.experiments) {
    if(Object.hasOwn(values,experiment.control))throw Error(`Conflicting execution control: ${experiment.control}`);
    values[experiment.control]=experiment.value;
  }
  if(typeof values.model!=='string'||typeof values.kv_reuse!=='boolean'||Object.keys(values).some(k=>!['model','kv_reuse','kv_cache','scheduling','transfer','compute_service'].includes(k)))throw Error('Execution requires exactly one model and KV reuse control');
  const keys=['kv_cache','scheduling','transfer','compute_service'],count=keys.filter(k=>Object.hasOwn(values,k)).length;
  if(count&&count!==keys.length)throw Error('Resource simulation requires cache, scheduling, transfer and compute-service controls together');
  return {model_id:values.model,kv_reuse:values.kv_reuse,resources:count?Object.fromEntries(keys.map(k=>[k,values[k]])):null};
}
export function changeControl(spec,control,value) {
  if(!spec.experiments.some(item=>item.control===control))throw Error(`Undeclared execution control: ${control}`);
  return {...spec,experiments:spec.experiments.map(item=>item.control===control?{...item,value}:item)};
}
