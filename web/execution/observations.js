/* Captured engine values, projected into declared observations. No forward computation. */
export function observations(captured,ids,work,module,model,step) {
  if(!captured.length)return [];
  const prefix=`prediction-${step}/`,nodes=[],seen=new Map(),groups=new Map(),d=model.architecture.width;
  const key=(layer,name)=>`${layer}/${name}`;
  for(const row of captured){const k=key(row.layer,row.name);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(row);}
  function add(name,layer,values,positions,inputs,formula,axes=['position','channel'],dtype='binary64',suffix='') {
    const id=prefix+key(layer,name)+suffix,shape=Array.isArray(values[0])?[values.length,values[0].length]:[values.length];
    const node={id,operation:{name},layer:layer<0?null:layer,request_id:'request-0',run_id:prefix,step,positions,shape,dtype,inputs:inputs.map(source=>/^(parameter|state):/.test(source)?source:seen.get(source)),formula,axes,values};
    if(node.inputs.some(x=>!x))throw Error('Unresolved captured tensor dependency: '+name);
    nodes.push(node);seen.set(key(layer,name),id);if(suffix)seen.set(key(layer,name)+suffix,id);return node;
  }
  const positions=Array.from({length:work.processed_positions},(_,i)=>work.reused_positions+i);
  add('input_ids',-1,ids.slice(work.reused_positions),positions,[],'IDs executed in this pass',['position'],'int');
  for(const rows0 of groups.values()) {
    const {name,layer}=rows0[0];let rows=rows0,inputs=[],formula='';
    const p=n=>'parameter:'+n,local=n=>key(layer,n),prev=layer===0?key(-1,'embedding'):key(layer-1,'ff_residual');
    if(name==='token_embedding'){inputs=[key(-1,'input_ids'),p(name)];formula='E[token_id]';}
    else if(name==='position_embedding'){inputs=[p(name)];formula='P[absolute_position]';}
    else if(name==='embedding'){inputs=[key(-1,'token_embedding'),key(-1,'position_embedding')];formula='token embedding + position embedding';}
    else if(name.startsWith('ln')){
      const base=name.replace(/_(mean|variance)$/,''),source=base==='ln1'?prev:base==='ln2'?local('attention_residual'):key(model.architecture.layers-1,'ff_residual');
      if(name.endsWith('_mean')){inputs=[source];formula='mean(X, channels)';}
      else if(name.endsWith('_variance')){inputs=[source,local(base+'_mean')];formula='mean((X - mean)^2, channels)';}
      else{inputs=[source,local(base+'_mean'),local(base+'_variance'),p(base+'_scale'),p(base+'_bias')];formula='(X - mean) / sqrt(variance + epsilon) * scale + bias';}
    } else if(['query','key','value','attention_output','ff_up','ff_down'].includes(name)) {
      const source={query:'ln1',key:'ln1',value:'ln1',attention_output:'weighted_values',ff_up:'ln2',ff_down:'gelu'}[name];
      inputs=[local(source),p(name),p(name+'_bias')];formula='X @ W + bias';
    } else if(name==='scores') {
      for(const [which,operation,source] of [['key','retained_keys','key'],['value','retained_values','value']]) {
        const ptr=which==='key'?module._key_rows(layer):module._value_rows(layer),flat=module.HEAPF64.subarray(ptr/8,ptr/8+ids.length*d);
        const values=Array.from({length:ids.length},(_,i)=>Array.from(flat.subarray(i*d,(i+1)*d)));
        add(operation,layer,values,ids.map((_,i)=>i),[local(source),...(work.reused_positions?['state:retained-prefix']:[])],'KV state after this pass; earlier rows retained only when reuse is enabled');
      }
      inputs=[local('query'),local('retained_keys')];formula='Q @ K^T / sqrt(head width); causal prefix';
    } else if(name==='attention'){inputs=[local('scores')];formula='softmax(causally visible scores)';}
    else if(name==='weighted_values'){inputs=[...groups.get(key(layer,'attention')).map(r=>local('attention')+'/p'+r.position),local('retained_values')];formula='attention @ V';}
    else if(name==='attention_residual'){inputs=[prev,local('attention_output')];formula='X + attention output';}
    else if(name==='gelu'){inputs=[local('ff_up')];formula='0.5*x*(1+tanh(sqrt(2/pi)*(x+0.044715*x^3)))';}
    else if(name==='ff_residual'){inputs=[local('attention_residual'),local('ff_down')];formula='residual + feed-forward output';}
    else if(name==='logits'){inputs=[key(-1,'ln_final'),p('lm_head'),p('lm_bias')];formula='final hidden @ output weights + bias';}
    const axes=['scores','attention'].includes(name)?['query position','key position']:name==='logits'?['position','vocabulary ID']:['position','channel'];
    if(['scores','attention'].includes(name)){for(const r of rows)add(name,layer,[r.values],[r.position],name==='attention'?[local('scores')+'/p'+r.position]:inputs,formula,axes,'binary64','/p'+r.position);}
    else add(name,layer,rows.map(r=>r.values),rows.map(r=>r.position),inputs,formula,axes);
  }
  return nodes;
}
