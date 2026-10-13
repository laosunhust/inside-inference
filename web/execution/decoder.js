/* Artifact readers feed one numerical engine. No model-specific generation loop. */
export function loadWeights(module,model,raw,checkpoint=null) {
  const a=model.architecture,wide=a.precision==='binary64';
  module._configure(a.width,a.ffn,a.layers,a.heads,a.vocabulary,a.context,Number(wide),Number(a.position==='learned-absolute')|2*Number(a.normalization==='pre-layernorm')|4*Number(a.activation==='gelu-tanh'),a.epsilon,Number(model.inspection==='tensors'));
  const put=(slot,values)=>{const ptr=module._allocate_weight(slot,values.length);(wide?module.HEAPF64:module.HEAPF32).set(values,ptr/(wide?8:4));};
  if(checkpoint) {
    if(JSON.stringify(checkpoint.config)!==JSON.stringify(a)) {
      if(Object.keys(a).some(k=>checkpoint.config[k]!==a[k]))throw Error('Model architecture differs from catalog');
    }
    const p=checkpoint.parameters,transpose=m=>m[0].flatMap((_,j)=>m.map(row=>row[j]));
    const names=['token_embedding','position_embedding','ln1_scale','ln1_bias','query','query_bias','key','key_bias','value','value_bias','attention_output','attention_output_bias','ln2_scale','ln2_bias','ff_up','ff_up_bias','ff_down','ff_down_bias',null,'ln_final_scale','ln_final_bias','lm_head','lm_bias'];
    const matrices=new Set(['query','key','value','attention_output','ff_up','ff_down']);
    names.forEach((name,slot)=>{if(name){let value=p[name];if(matrices.has(name))value=value.map(transpose);else if(name==='lm_head')value=transpose(value);put(slot,value.flat(Infinity));}});
    return p;
  }
  const header=new Int32Array(raw.buffer,raw.byteOffset,7);
  if(JSON.stringify(Array.from(header))!==JSON.stringify([a.width,a.ffn,a.layers,a.heads,a.heads,a.vocabulary,a.context]))throw Error('Model header differs from declaration');
  let offset=28;const read=(slot,n)=>{const values=new Float32Array(raw.buffer,raw.byteOffset+offset,n);put(slot,values);offset+=n*4;};
  const d=a.width,l=a.layers,f=a.ffn;
  read(0,a.vocabulary*d);read(2,l*d);read(4,l*d*d);read(6,l*d*d);read(8,l*d*d);read(10,l*d*d);read(12,l*d);read(14,l*f*d);read(16,l*d*f);read(18,l*f*d);read(19,d);
  module._tie_head();
  if(raw.length!==offset+4*a.context*(d/a.heads))throw Error('Weight payload length differs from architecture');
  return null;
}
export class Decoder {
  constructor(module,model){this.module=module;this.model=model;this.prefix=[];}
  run(ids,reuse,allLogits=false) {
    const m=this.module,a=this.model.architecture,wide=a.precision==='binary64';
    let same=0;while(same<ids.length&&same<this.prefix.length&&ids[same]===this.prefix[same])same++;
    if(!reuse||same!==this.prefix.length||same===ids.length)same=0;
    const captured=[],logits_rows=[];let pointer,matmul_flops=0;
    for(let position=same;position<ids.length;position++) {
      pointer=m._step(ids[position],position);matmul_flops+=m._step_flops();
      if(allLogits){const heap=wide?m.HEAPF64:m.HEAPF32;logits_rows.push(Array.from(heap.subarray(pointer/(wide?8:4),pointer/(wide?8:4)+a.vocabulary)));}
      for(let i=0;i<m._trace_count();i++) {
        const ptr=m._trace_data(i),length=m._trace_length(i);
        captured.push({name:m.UTF8ToString(m._trace_name(i)),layer:m._trace_layer(i),position,values:Array.from(m.HEAPF64.subarray(ptr/8,ptr/8+length))});
      }
    }
    this.prefix=[...ids];
    const heap=wide?m.HEAPF64:m.HEAPF32,size=wide?8:4;
    return {logits:Array.from(heap.subarray(pointer/size,pointer/size+a.vocabulary)),captured,logits_rows,work:{matmul_flops,processed_positions:ids.length-same,reused_positions:same}};
  }
}

export function finishSelection(input,selected,model) {
  const output=[...input.output_ids,selected],sequence=[...input.prefix_ids,...output];
  const stop=model.stop_ids.includes(selected)?'end_token':output.length>=input.generation.max_new_tokens?'output_budget':sequence.length>model.architecture.context?'context_capacity':null;
  return {output,sequence,stop,visible:model.stop_ids.includes(selected)?output.slice(0,-1):output};
}
