import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const [port,origin,home]=process.argv.slice(2);
const manifest=JSON.parse(await fs.readFile(home+'/manifest.json','utf8')),p=manifest.protocol;
const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
let id=0;const pending=new Map();
socket.addEventListener('message',event=>{
  const message=JSON.parse(event.data),waiter=pending.get(message.id);
  if(waiter){pending.delete(message.id);message.error?waiter.reject(Error(JSON.stringify(message.error))):waiter.resolve(message.result);}
});
const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});
async function evaluate(expression){const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;}
async function bounded(promise,ms){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Preregistered wall-time cap reached')),ms);})]);}finally{clearTimeout(timer);}}
async function retain(folder,mode,trial){
  await fs.mkdir(folder,{recursive:true});
  const rows=trial.logits;delete trial.logits;
  const raw=Buffer.alloc(rows.reduce((n,row)=>n+row.length,0)*4);let offset=0;
  for(const row of rows)for(const value of row){raw.writeFloatLE(value,offset);offset+=4;}
  trial.logits={file:mode+'-logits.bin',dtype:'little-endian-binary32',rows:rows.length,columns:rows[0]?.length??0,sha256:createHash('sha256').update(raw).digest('hex')};
  await fs.writeFile(folder+'/'+mode+'-logits.bin',raw);
  await fs.writeFile(folder+'/'+mode+'.json',JSON.stringify(trial,null,2)+'\n');
}
try{
  await send('Page.enable');await send('Runtime.enable');await send('Page.navigate',{url:origin+'/'});
  await bounded((async()=>{
    for(;;){const phase=await evaluate("document.getElementById('binding-status')?.dataset.phase");if(phase==='ready')break;if(phase==='failed')throw Error('Page initialization failed');await new Promise(r=>setTimeout(r,100));}
    await evaluate(`(async()=>{
      const root=new URL('.',document.querySelector('script[src$="declarations.generated.js"]').src);
      const {createDispatch}=await import(new URL('inspection/performance/dispatch.js',root));
      const {createTiming}=await import(new URL('inspection/performance/observations.js',root));
      window.pilot={dispatch:createDispatch(Execution),createTiming,initial:JSON.parse(document.getElementById('inference-data').textContent)};
      pilot.model=(await pilot.dispatch.invoke('loadModel',{model_id:${JSON.stringify(p.model)}})).model;
    })()`);
  })(),p.setup_wall_seconds*1000);
  const environment=await evaluate("({user_agent:navigator.userAgent,hardware_concurrency:navigator.hardwareConcurrency,visibility:document.visibilityState,model:pilot.model,contract_sha256:Declarations.hash})");
  if(environment.visibility!=='visible')throw Error('Pilot page is not visible to browser scheduling');
  await fs.writeFile(home+'/environment.json',JSON.stringify(environment,null,2)+'\n');
  for(const context of p.contexts){
    const started=performance.now(),deadline=started+p.context_wall_seconds*1000;
    for(let pair=0;pair<p.warmup_pairs+p.measured_pairs;pair++){
      const warmup=pair<p.warmup_pairs,index=warmup?pair:pair-p.warmup_pairs;
      const order=pair%2?['on','off']:['off','on'];
      const folder=`${home}/observations/context-${context}/${warmup?'warmup':'measured'}-${index}`;
      for(const mode of order){
        const options={context,reuse:mode==='on',text:p.source_text.repeat(p.source_repetitions),budget:p.max_new_tokens};
        let trial;
        try{
          trial=await bounded(evaluate(`(async()=>{
            const options=${JSON.stringify(options)},input=structuredClone(pilot.initial);
            input.execution.experiments=input.execution.experiments.filter(e=>['model','kv_reuse'].includes(e.control));
            input.execution.experiments.find(e=>e.control==='model').value=pilot.model.id;
            input.execution.experiments.find(e=>e.control==='kv_reuse').value=options.reuse;
            input.workload.requests[0].request.text=options.text;
            input.workload.requests[0].request.generation.max_new_tokens=options.budget;
            window.pilotPartial={status:'preparing',input,timing:{samples:[]},logits:[]};
            const prepared=await pilot.dispatch.invoke('prepareGeneration',input);
            if(prepared.prompt_ids.length<options.context)throw Error('Declared source has too few token IDs');
            const request={session_id:prepared.session_id,prefix_ids:prepared.prompt_ids.slice(0,options.context),output_ids:[]};
            const output=document.getElementById('response-preview');output.textContent='';
            const timing=pilot.createTiming();timing.begin('continuous',performance.now(),false);
            const trial=window.pilotPartial={status:'running',input,request:structuredClone(request),timing:timing.evidence(),logits:[],visibility:[],stop_reason:null};
            let previous='';
            try{
              for(let step=0;step<options.budget;step++){
                const {prediction,dispatched_ms,returned_ms,execution}=await pilot.dispatch.token(request,()=>true);
                output.textContent=prediction.text;const published=performance.now();
                timing.record(prediction,published,prediction.text!==previous&&prediction.text.length>0,dispatched_ms,returned_ms,execution);
                trial.timing=timing.evidence();trial.logits.push(prediction.logits);
                trial.visibility.push(document.visibilityState);trial.stop_reason=prediction.stop_reason;
                request.output_ids=prediction.output_ids;previous=prediction.text;
                if(prediction.stop_reason)break;
              }
              trial.status='completed';
            }catch(error){trial.status='failed';trial.error=String(error);}
            return trial;
          })()`),Math.max(1,deadline-performance.now()));
        }catch(error){
          trial=await evaluate('window.pilotPartial??({timing:{samples:[]},logits:[]})');trial.status='failed';trial.error=String(error);
          await retain(folder,mode,trial);throw error;
        }
        trial.pair_order=order;trial.context=context;trial.mode=mode;trial.warmup=warmup;
        await retain(folder,mode,trial);
        if(trial.status!=='completed')throw Error(trial.error);
      }
    }
    console.log(JSON.stringify({context,elapsed_seconds:(performance.now()-started)/1000,pairs:p.warmup_pairs+p.measured_pairs}));
  }
}finally{socket.close();}
