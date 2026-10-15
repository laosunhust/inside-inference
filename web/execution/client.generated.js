// Generated; DO NOT EDIT.
(() => {
  'use strict';
  const operations={"replayCache": {"request": "ExecutionReplayInput", "response": "CacheRun"}, "modelCatalog": {"request": null, "response": "ModelCatalog"}, "loadModel": {"request": "ModelSelection", "response": "ModelLoadResult"}, "prepareGeneration": {"request": "GenerationInput", "response": "GenerationPrepared"}, "generateToken": {"request": "GenerationAdvance", "response": "GenerationPrediction"}, "simulateResources": {"request": "GenerationInput", "response": "ResourceExecution"}};
  const workerURL=new URL('worker.generated.js',document.currentScript.src);
  function create(transport) {
    return Object.freeze(Object.fromEntries(Object.entries(operations).map(([name,spec]) =>
      [name,async(input,{raw=false,observe}={})=>{
        const started=performance.now(),timing={};
        if(spec.request) Declarations.assertShape(spec.request,input);
        else if(input!==undefined) throw new Error(name+': unexpected input');
        const validated=performance.now();
        const value=await transport(name,input,timing);
        const returned=performance.now();
        if(observe) {
          const observation={...timing,client_validation_ms:validated-started,
            round_trip_ms:returned-validated};
          Declarations.assertShape('BrowserExecutionTiming',observation);
          observe(observation);
        }
        return raw ? JSON.stringify(value) : value;
      }]
    )));
  }
  function restoreArrays(value) {
    if(value===undefined)return null; // Pyodide maps Python None to undefined.
    if(ArrayBuffer.isView(value))return Array.from(value);
    if(Array.isArray(value))return value.map(restoreArrays);
    if(value&&typeof value==='object')for(const key of Object.keys(value))value[key]=restoreArrays(value[key]);
    return value;
  }
  let worker, failure;
  const pending=new Set();
  function fail(error) {
    failure=error; for(const reject of pending)reject(error);pending.clear();
    if(worker)worker.terminate();
  }
  function transport(operation,input,timing) {
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
        else if(!data.value || typeof data.value!=='object')finish(new Error('Invalid worker response'));
        else {
          Object.assign(timing,{python:data.python,worker_wait_ms:data.worker_wait_ms,
            python_bridge_ms:data.python_bridge_ms,buffer_conversion_ms:data.buffer_conversion_ms,transferred_bytes:data.transferred_bytes});
          finish(null,restoreArrays(data.value));
        }
      };
      channel.port1.onmessageerror=()=>finish(new Error('Unreadable operation response'));
      worker.postMessage({operation,input:input??null},[channel.port2]);
    });
  }
  globalThis.ExecutionClient=Object.freeze({create});
  globalThis.Execution=create(transport);
})();
