import assert from 'node:assert/strict';

/* Recompute displayed 8K observations from their declared inputs, independently of the engine. */
export function recompute(nodes, parameters, architecture) {
  const byId=new Map(nodes.map(n=>[n.id,n])),d=architecture.width;
  const rowAt=(node,position)=>node.values[node.positions.indexOf(position)];
  const param=(name,layer)=>layer===null?parameters[name]:parameters[name][layer];
  const input=(node,i)=>byId.get(node.inputs[i]);
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
  let worst=0,checked=new Set();
  const compare=(node,position,expected)=>{
    const actual=rowAt(node,position);
    expected.forEach((v,i)=>{worst=Math.max(worst,Math.abs(v-actual[i]));});
    checked.add(node.operation.name);
  };
  for(const node of nodes){
    const name=node.operation.name,layer=node.layer;
    for(const p of node.positions){
      if(/^ln(1|2|_final)$/.test(name)){
        // y = (x - mean) / sqrt(variance + eps) * scale + bias, from the source row alone.
        const x=rowAt(input(node,0),p),mean=x.reduce((a,b)=>a+b,0)/d,variance=x.reduce((a,b)=>a+(b-mean)**2,0)/d;
        const scale=param(name+'_scale',layer),bias=param(name+'_bias',layer);
        compare(node,p,x.map((v,i)=>(v-mean)/Math.sqrt(variance+architecture.epsilon)*scale[i]+bias[i]));
      } else if(name==='scores') {
        const q=rowAt(input(node,0),p),keys=input(node,1);
        compare(node,p,Array.from({length:p+1},(_,j)=>dot(q,rowAt(keys,j))/Math.sqrt(d/architecture.heads)));
      } else if(name==='attention') {
        const s=rowAt(input(node,0),p),peak=Math.max(...s),e=s.map(v=>Math.exp(v-peak)),total=e.reduce((a,b)=>a+b,0);
        compare(node,p,e.map(v=>v/total));
      } else if(name==='weighted_values') {
        const weights=node.inputs.slice(0,-1).map(id=>byId.get(id)).find(n=>n.positions[0]===p).values[0],values=input(node,node.inputs.length-1);
        compare(node,p,Array.from({length:d},(_,c)=>weights.reduce((s,w,j)=>s+w*rowAt(values,j)[c],0)));
      } else if(name==='attention_residual'||name==='ff_residual') {
        const a=rowAt(input(node,0),p),b=rowAt(input(node,1),p);
        compare(node,p,a.map((v,i)=>v+b[i]));
      } else if(name==='logits') {
        const h=rowAt(input(node,0),p),w=parameters.lm_head,b=parameters.lm_bias;
        compare(node,p,b.map((bias,v)=>bias+h.reduce((s,x,i)=>s+x*w[i][v],0)));
      }
    }
  }
  return {max_error:worst,operations:[...checked].sort()};
}

export function checkRecomputation(nodes, parameters, architecture) {
  const recomputed=recompute(nodes,parameters,architecture);
  assert.deepEqual(recomputed.operations,['attention','attention_residual','ff_residual','ln1','ln2','ln_final','logits','scores','weighted_values']);
  assert.ok(recomputed.max_error<1e-12,`Hand recomputation differs by ${recomputed.max_error}`);
  return recomputed;
}
