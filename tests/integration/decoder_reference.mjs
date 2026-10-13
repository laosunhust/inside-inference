/* Independent scalar fixtures qualify the actual release WASM, not a second web engine. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const [site,fixture]=process.argv.slice(2),root=pathToFileURL(site+'/');
const create=(await import(new URL('execution/llama/llama.mjs',root))).default;
const {Decoder,loadWeights}=await import(new URL('execution/decoder.js',root));
const {observations}=await import(new URL('execution/observations.js',root));
const module=await create();
for(const test of JSON.parse(readFileSync(fixture,'utf8'))){
 const model={architecture:test.checkpoint.config,inspection:'tensors'};
 loadWeights(module,model,null,test.checkpoint);const engine=new Decoder(module,model);
 const result=engine.run(test.ids,false,true);
 const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-11,`${a} != ${b}`);
 result.logits_rows.forEach((row,i)=>row.forEach((value,j)=>close(value,test.logits[i][j])));
 const trace=observations(result.captured,test.ids,result.work,module,model,0);
 const expected=new Map(test.nodes.map(n=>[`${n.layer}/${n.operation.name}`,n]));
 for(const node of trace){
  if(['retained_keys','retained_values'].includes(node.operation.name))continue;
  const original=expected.get(`${node.layer}/${node.operation.name}`);assert.ok(original,node.operation.name);
  if(node.operation.name==='input_ids'){assert.deepEqual(node.values,test.ids);continue;}
  node.values.forEach((row,i)=>row.forEach((value,j)=>close(value,original.values[node.positions[i]][j])));
 }
 const a=model.architecture,n=test.ids.length;
 assert.equal(result.work.matmul_flops,2*n*(a.layers*(4*a.width*a.width+2*a.width*a.ffn)+a.width*a.vocabulary)+4*a.layers*a.width*n*(n+1)/2);
 engine.prefix=[];
 let last;
 for(let i=1;i<=test.ids.length;i++){last=engine.run(test.ids.slice(0,i),true);assert.equal(last.work.processed_positions,1);assert.equal(last.work.reused_positions,i-1);last.logits.forEach((v,j)=>close(v,test.logits[i-1][j]));}
 assert.deepEqual(last.logits,result.logits);
 // A branch cannot read stale K/V from the discarded suffix.
 const branch=engine.run(test.ids.slice(0,2),true);assert.equal(branch.work.reused_positions,0);branch.logits.forEach((v,j)=>close(v,test.logits[1][j]));
}
console.log('Release decoder: all captured values, causal FLOPs, reuse and branches match independent fixtures.');
