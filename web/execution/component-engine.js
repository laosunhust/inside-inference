/* Python lab orchestration calls the same decoder. It cannot execute a second transformer. */
import {Decoder,loadWeights} from './decoder.js';
import {observations} from './observations.js';
let installation;
export function installComponentEngine(){return installation??=install();}
async function install() {
  const module=await (await import('./llama/llama.mjs')).default();
  globalThis.componentForward=raw=>{
    const {checkpoint,ids,state,capture,identity,request_id,run_id,step,work_id}=JSON.parse(raw);
    const model={architecture:checkpoint.config,inspection:capture?'tensors':'logits'};
    loadWeights(module,model,null,checkpoint);
    const d=model.architecture.width,engine=new Decoder(module,model);
    if(state){
      engine.prefix=state.token_ids;
      for(let layer=0;layer<model.architecture.layers;layer++){
        module.HEAPF64.set(state.keys[layer].flat(),module._key_rows(layer)/8);
        module.HEAPF64.set(state.values[layer].flat(),module._value_rows(layer)/8);
      }
    }
    const prefix=state?.token_ids||[],all=[...prefix,...ids],result=engine.run(all,!!state,true);
    const nodes=observations(result.captured,all,result.work,module,model,step);
    const root=(work_id||`${run_id}/step-${step}`)+'/',old=`prediction-${step}/`;
    for(const node of nodes){node.id=node.id.replace(old,root);node.inputs=node.inputs.map(id=>id.replace(old,root));node.run_id=run_id;node.request_id=request_id;}
    const response={logits:result.logits_rows,nodes,matmul_flops:result.work.matmul_flops};
    if(state){
      const read=ptr=>Array.from({length:all.length},(_,i)=>Array.from(module.HEAPF64.subarray(ptr/8+i*d,ptr/8+(i+1)*d)));
      response.state={checkpoint_sha256:identity,tokenizer_sha256:checkpoint.manifest_sha256,precision:model.architecture.precision,token_ids:all,
        keys:Array.from({length:model.architecture.layers},(_,i)=>read(module._key_rows(i))),
        values:Array.from({length:model.architecture.layers},(_,i)=>read(module._value_rows(i)))};
    }
    return JSON.stringify(response);
  };
}
