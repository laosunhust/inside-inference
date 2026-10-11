/* Lossless artifact transport. This reconstructs observations; it never runs a model. */
(() => {
  'use strict';
  const objects = new Map();
  const hash = async text => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
  function seed(bundle) {
    Declarations.assertShape('ExecutionBundle',bundle);
    for(const [key,value] of Object.entries(bundle.objects)) {
      if(key!==value.reference.sha256) throw new Error('Artifact bundle key differs');
      objects.set(key,Promise.resolve(value));
    }
    return bundle.receipt;
  }
  async function read(reference, raw=false) {
    Declarations.assertShape('ArtifactReference',reference);
    const key=reference.sha256;
    if(!objects.has(key)) objects.set(key,Execution.artifact(reference));
    let artifact;
    try { artifact=await objects.get(key); }
    catch(error) { objects.delete(key);throw error; }
    Declarations.assertShape('ArtifactResponse',artifact);
    if(artifact.reference.schema!==reference.schema || artifact.reference.sha256!==key || await hash(artifact.content)!==key) throw new Error('Artifact identity differs');
    const value=JSON.parse(artifact.content);
    Declarations.assertShape(reference.schema,value);
    if(!raw) return value;
    if(!JSON.rawJSON) throw new Error('Lossless export requires a browser supporting JSON.rawJSON');
    return JSON.parse(artifact.content,(_key,v,context)=>typeof v==='number' ? JSON.rawJSON(context.source) : v);
  }
  async function restore(receipt,raw=false) {
    Declarations.assertShape('ExecutionReceipt',receipt);
    if(receipt.archive.schema!=='ExecutionArchive') throw new Error('Expected execution archive');
    const archive=await read(receipt.archive,raw), record=archive.record;
    if(archive.tensors.schema!=='TensorTable') throw new Error('Expected tensor table');
    const isRun=Object.hasOwn(record,'traces'), traces=isRun ? record.traces : [record];
    const [table,...assets]=await Promise.all([read(archive.tensors,raw),...traces.map(async trace=>{
      if(trace.checkpoint.schema!=='ModelArtifact') throw new Error('Expected model artifact');
      if(isRun && trace.vocabulary.schema!=='VocabularyArtifact') throw new Error('Expected vocabulary');
      return Promise.all([read(trace.checkpoint,raw),isRun ? read(trace.vocabulary,raw) : null]);
    })]);
    const row=index=>{
      const i=raw ? Number(index.rawJSON) : index;
      if(!Number.isInteger(i) || i<0 || i>=table.rows.length) throw new Error('Missing tensor row');
      return table.rows[i];
    };
    traces.forEach((trace,i)=>{
      trace.checkpoint=assets[i][0];
      if(isRun) trace.vocabulary=assets[i][1].tokens;
      for(const pass of isRun ? trace.passes : [trace.computation]) {
        for(const node of pass.nodes) {
          const values=node.values.map(row);
          if(node.shape.length===1 && values.length!==1) throw new Error('Invalid vector row reference');
          node.values=node.shape.length===1 ? values[0] : values;
        }
        for(const name of ['raw_logits','probabilities']) pass.selection[name]=row(pass.selection[name]);
      }
    });
    if(record.id!==receipt.execution_id) throw new Error('Receipt execution differs');
    if(!raw) Declarations.assertShape(isRun?'RunRecord':'TokenStepResult',record);
    return record;
  }
  globalThis.EvidenceClient={seed,restore,export:async receipt=>JSON.stringify(await restore(receipt,true))};
})();
