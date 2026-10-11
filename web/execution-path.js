/* Compact projection of recorded dependencies; no model computation or owner registry. */
globalThis.ExecutionPath = (() => {
  const svgNS='http://www.w3.org/2000/svg';
  function render(pass, runId, ontology, select) {
    const path=document.getElementById('computation-path');
    if(path.dataset.passId===pass.id && path.dataset.runId===runId) return;
    path.dataset.passId=pass.id;path.dataset.runId=runId;
    const stages=[], stageByNode=new Map();
    for(const node of pass.nodes) {
      const owner=Declarations.operationOwners[node.operation.name];
      let stage=stages.at(-1);
      if(!stage || stage.owner!==owner) stages.push(stage={owner,nodes:[]});
      stage.nodes.push(node);stageByNode.set(node.id,stages.length-1);
    }
    const labels=[...document.getElementById('operation-labels').content.querySelectorAll('[data-operation]')];
    stages.forEach((stage,index)=>{
      stage.inputs=[...new Set(stage.nodes.flatMap(n=>n.inputs).filter(id=>stageByNode.has(id) && stageByNode.get(id)!==index))];
      stage.sources=[...new Set(stage.inputs.map(id=>stageByNode.get(id)))];
      stage.rank=stage.sources.length ? 1+Math.max(...stage.sources.map(i=>stages[i].rank)) : 0;
    });
    // Place independent parameter lookups alongside the other input to their consumer.
    stages.forEach((stage,index)=>{
      const consumers=stages.filter(s=>s.sources.includes(index));
      if(!stage.sources.length && consumers.length) stage.rank=Math.min(...consumers.map(s=>s.rank))-1;
    });
    const width=(Math.max(...stages.map(s=>s.rank))+1)*96;
    const canvas=document.getElementById('execution-canvas');canvas.style.width=width+'px';
    const edges=document.getElementById('execution-edges');edges.setAttribute('viewBox',`0 0 ${width} 220`);
    edges.querySelectorAll('path').forEach(p=>p.remove());path.replaceChildren();
    stages.forEach((stage,index)=>{
      const peers=stages.filter(s=>s.rank===stage.rank), row=peers.indexOf(stage);
      stage.x=stage.rank*96+8;stage.y=peers.length>1 ? 76+row*78 : 114;
      const candidates=labels.filter(label=>stage.nodes.some(n=>n.operation.name===label.dataset.operation));
      if(candidates.length!==1) throw new Error(`Expected one display label for stage ${index+1}`);
      const button=candidates[0].cloneNode(true), node=stage.nodes.find(n=>n.operation.name===button.dataset.operation);
      if(ontology[button.dataset.term].owner!==stage.owner) throw new Error('Stage label has a different ontology owner');
      button.title=button.getAttribute('aria-label') || button.textContent;
      button.onclick=()=>select(button.dataset.entity,node);
      const item=document.createElement('li');
      item.dataset.configurationOwner=stage.owner;
      item.dataset.observations=JSON.stringify(stage.nodes.map(n=>n.id));item.dataset.inputs=JSON.stringify(stage.inputs);
      item.style.left=stage.x+'px';item.style.top=(stage.y-25)+'px';
      item.append(button);path.append(item);
    });
    let lane=0;
    stages.forEach(stage=>stage.sources.forEach(source=>{
      const from=stages[source], x1=from.x+80, x2=stage.x, y1=from.y, y2=stage.y;
      const edge=document.createElementNS(svgNS,'path');
      const skip=stage.rank-from.rank>1, top=22+(lane++%3)*17;
      edge.setAttribute('d',skip ? `M${x1-8},${y1-25} V${top} H${x2+8} V${y2-28}`
        : `M${x1},${y1} C${x1+10},${y1} ${x2-10},${y2} ${x2-3},${y2}`);
      edge.dataset.source=String(source);edge.dataset.target=String(stages.indexOf(stage));
      const title=document.createElementNS(svgNS,'title');
      title.textContent=from.nodes.at(-1).operation.name+' → '+stage.nodes[0].operation.name;
      edge.append(title);edges.append(edge);
    }));
  }
  // Timers only advance the shared inspection cursor; they never own selected evidence.
  function playback(changed) {
    let timer=null;
    const stop=()=>{if(timer!==null) clearTimeout(timer);timer=null;changed();};
    function start(views, inspect) {
      stop();
      let index=0;
      function advance() {
        if(index===views.length) return stop();
        timer=setTimeout(advance,650);
        inspect(views[index++]);
      }
      advance();changed();
    }
    return {start,stop,running:()=>timer!==null};
  }
  return {render,playback};
})();
