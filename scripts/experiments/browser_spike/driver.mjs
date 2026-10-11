import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {createInterface} from 'node:readline';
const [port,base,output]=process.argv.slice(2);
const acks=createInterface({input:process.stdin})[Symbol.asyncIterator]();
let phaseName='startup';const network=[];
async function phase(name){phaseName=name;console.log(name);await acks.next();}
const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
let id=0;const pending=new Map();
socket.addEventListener('message',async event=>{const data=JSON.parse(event.data);
  if(data.method==='Network.requestWillBeSent')network.push({url:data.params.request.url,method:data.params.request.method,phase:phaseName,worker:!!data.sessionId});
  if(data.method==='Target.attachedToTarget'){const session=data.params.sessionId;await send('Network.enable',{},session);await send('Runtime.runIfWaitingForDebugger',{},session);}
  if(pending.has(data.id)){const p=pending.get(data.id);pending.delete(data.id);data.error?p.reject(Error(JSON.stringify(data.error))):p.resolve(data.result);}});
function send(method,params={},sessionId){const n=++id;return new Promise((resolve,reject)=>{pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params,sessionId}));});}
async function evaluate(expression){const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;}
async function bounded(expression,ms){return evaluate(`Promise.race([(${expression}),new Promise((_,reject)=>setTimeout(()=>reject(Error('Spike deadline exceeded')),${ms}))])`);}
const report={passed:false,cases:[]};
try{
  await send('Runtime.enable');await send('Page.enable');await send('Network.enable');
  await send('Target.setAutoAttach',{autoAttach:true,waitForDebuggerOnStart:true,flatten:true});
  await send('Page.navigate',{url:base+'/index.html'});
  for(let n=0;n<100;n++){if(await evaluate('window.spikeReady===true'))break;await new Promise(r=>setTimeout(r,50));}
  report.cold=await bounded('window.boot()',20000);
  assert.equal(report.cold.kind,'ready');assert.ok(report.cold.milliseconds<20000);
  await phase('offline');
  await mkdir(output+'/browser',{recursive:true});
  for(let n=0;n<report.cold.cases;n++){
    const response=await bounded(`window.executeCase(${n})`,30000);
    const record=JSON.parse(response.json);await writeFile(output+'/browser/'+record.name+'.json',response.json);
    const {json,...metrics}=response;report.cases.push({name:record.name,...metrics});
    assert.ok(metrics.milliseconds<30000);assert.ok(metrics.memory<512*1024*1024);assert.ok(metrics.heartbeat_max_ms<250);
  }
  report.cancelled=await bounded('window.cancellationProbe()',5000);assert.equal(report.cancelled,true);
  await phase('online');report.repeat=await bounded('window.boot()',20000);
  await phase('offline');const restarted=await bounded('window.executeCase(1)',30000);
  await writeFile(output+'/browser/restarted-step.json',restarted.json);
  await evaluate('window.cancel()');
  await phase('online');
  report.missingAssetRejected=await bounded("new Promise(resolve=>{const w=new Worker('./missing-worker.mjs',{type:'module'});w.onerror=()=>{w.terminate();resolve(true);};w.onmessage=()=>{w.terminate();resolve(false);};})",5000);
  assert.equal(report.missingAssetRejected,true);
  report.browser=await send('Browser.getVersion');
  report.network=network;
  assert.ok(network.some(r=>r.worker));
  assert.ok(network.every(r=>r.method==='GET' && r.url.startsWith(base+'/') && r.phase!=='offline'));
  report.passed=true;
}catch(error){report.error=String(error);throw error;}
finally{await writeFile(output+'/browser-metrics.json',JSON.stringify(report,null,2));socket.close();process.stdin.destroy();}
