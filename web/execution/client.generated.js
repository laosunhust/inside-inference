// Generated; DO NOT EDIT.
(() => {
  'use strict';
  const operations={"capabilities": {"request": null, "response": "Capabilities"}, "run": {"request": "Workload", "response": "ExecutionReceipt"}, "cacheRun": {"request": "KVExperimentInput", "response": "CacheRun"}, "cacheCapabilities": {"request": null, "response": "CacheCapabilities"}, "tokenStep": {"request": "TokenStepRequest", "response": "ExecutionReceipt"}, "artifact": {"request": "ArtifactReference", "response": "ArtifactResponse"}, "prepareInput": {"request": "Workload", "response": "PreparedInput"}, "replayTokenStep": {"request": "ExecutionReplayInput", "response": "TokenStepResult"}, "replayCache": {"request": "ExecutionReplayInput", "response": "CacheRun"}, "modelCatalog": {"request": null, "response": "ModelCatalog"}, "loadModel": {"request": "ModelSelection", "response": "ModelLoadResult"}, "prepareGeneration": {"request": "GenerationInput", "response": "GenerationPrepared"}, "generateToken": {"request": "GenerationStep", "response": "GenerationPrediction"}};
  const workerURL=new URL('worker.generated.js',document.currentScript.src);
  function create(transport) {
    return Object.freeze(Object.fromEntries(Object.entries(operations).map(([name,spec]) =>
      [name,async(input,{raw=false}={})=>{
        if(spec.request) Declarations.assertShape(spec.request,input);
        else if(input!==undefined) throw new Error(name+': unexpected input');
        const text=await transport(name,input);
        const value=JSON.parse(text);
        Declarations.assertShape(spec.response,value);
        return raw ? text : value;
      }]
    )));
  }
  let worker, failure;
  const pending=new Set();
  function fail(error) {
    failure=error; for(const reject of pending)reject(error);pending.clear();
    if(worker)worker.terminate();
  }
  function transport(operation,input) {
    if(failure)return Promise.reject(failure);
    if(!worker) {
      worker=new Worker(workerURL,{type:'module'});
      worker.onerror=event=>fail(new Error(event.message||'Execution worker failed'));
      worker.onmessageerror=()=>fail(new Error('Unreadable worker response'));
    }
    return new Promise((resolve,reject)=>{
      const channel=new MessageChannel();
      const finish=(error,text)=>{pending.delete(abort);channel.port1.close();error?reject(error):resolve(text);};
      const abort=error=>finish(error);
      pending.add(abort);
      channel.port1.onmessage=({data})=>{
        if(data.error)finish(new Error(data.error));
        else if(typeof data.json!=='string')finish(new Error('Invalid worker response'));
        else finish(null,data.json);
      };
      channel.port1.onmessageerror=()=>finish(new Error('Unreadable operation response'));
      worker.postMessage({operation,input:JSON.stringify(input??null)},[channel.port2]);
    });
  }
  globalThis.ExecutionClient=Object.freeze({create});
  globalThis.Execution=create(transport);
})();
