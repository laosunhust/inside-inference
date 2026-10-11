// Headless research controller. No model algorithm or mock execution lives here.
let worker,pending,heartbeat=[],last;
function spawn(){
  worker=new Worker('./worker.mjs',{type:'module'});
  worker.onmessage=({data})=>{if(pending){const p=pending;pending=null;data.kind==='failure'?p.reject(Error(data.error)):p.resolve(data);}};
  worker.onerror=event=>{if(pending){pending.reject(Error(event.message));pending=null;}};
}
function receive(){return new Promise((resolve,reject)=>{pending={resolve,reject};});}
window.boot=()=>{spawn();return receive();};
window.executeCase=async index=>{
  heartbeat=[];last=performance.now();
  const timer=setInterval(()=>{const now=performance.now();heartbeat.push(now-last);last=now;},10);
  try{const reply=receive();worker.postMessage(index);const result=await reply;result.heartbeat_max_ms=Math.max(0,...heartbeat,performance.now()-last);return result;}
  finally{clearInterval(timer);}
};
window.cancel=()=>{worker.terminate();if(pending){pending.reject(Error('Worker terminated'));pending=null;}};
window.cancellationProbe=async()=>{
  const result=window.executeCase(0).then(()=>false,error=>error.message==='Worker terminated');
  await new Promise(resolve=>setTimeout(resolve,20));window.cancel();return result;
};
window.spikeReady=true;
