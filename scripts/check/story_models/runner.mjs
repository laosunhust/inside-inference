import {checkModels} from './check.mjs';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const [port,base,output,site,assetBase]=process.argv.slice(2);
for(const name of ['contract-validators.generated.js','contract-runtime.js','declarations.generated.js'])vm.runInThisContext(readFileSync(site+'/'+name,'utf8'));
const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
let counter=0;const pending=new Map();
socket.addEventListener('message',event=>{const data=JSON.parse(event.data);if(pending.has(data.id)){const {resolve,reject}=pending.get(data.id);pending.delete(data.id);data.error?reject(Error(JSON.stringify(data.error))):resolve(data.result);}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++counter;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
async function evaluate(expression){const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;}
async function until(expression){for(let i=0;i<200;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw Error('Timed out: '+expression+'\n'+await evaluate('document.body.innerText'));}
try {
 await send('Page.enable');await send('Runtime.enable');
 console.log(await checkModels({send,evaluate,until,base,output,site,assetBase}));
}finally{socket.close();}
