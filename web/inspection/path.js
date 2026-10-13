/* One declared conceptual graph, independent of capture availability. */
globalThis.ExecutionPath = (() => {
  const svgNS='http://www.w3.org/2000/svg';
  function draw(stages,path) {
    stages.forEach(stage=>{stage.rank=stage.sources.length?1+Math.max(...stage.sources.map(i=>stages[i].rank)):0;});
    stages.forEach((stage,index)=>{
      const consumers=stages.filter(s=>s.sources.includes(index));
      if(!stage.sources.length&&consumers.length)stage.rank=Math.min(...consumers.map(s=>s.rank))-1;
    });
    const width=(Math.max(...stages.map(s=>s.rank))+1)*96;
    document.getElementById('execution-canvas').style.width=width+'px';
    const edges=document.getElementById('execution-edges');edges.setAttribute('viewBox',`0 0 ${width} 220`);
    edges.querySelectorAll('path').forEach(p=>p.remove());path.replaceChildren();
    stages.forEach(stage=>{
      const peers=stages.filter(s=>s.rank===stage.rank),row=peers.indexOf(stage);
      stage.x=stage.rank*96+8;stage.y=peers.length>1?76+row*78:114;
      const item=document.createElement('li');item.dataset.configurationOwner=stage.owner;
      Object.assign(item.dataset,stage.data);
      item.style.left=stage.x+'px';item.style.top=(stage.y-25)+'px';item.append(stage.button);path.append(item);
    });
    let lane=0;
    stages.forEach(stage=>stage.sources.forEach(source=>{
      const from=stages[source],x1=from.x+80,x2=stage.x,y1=from.y,y2=stage.y;
      const edge=document.createElementNS(svgNS,'path'),skip=stage.rank-from.rank>1,top=22+(lane++%3)*17;
      edge.setAttribute('d',skip?`M${x1-8},${y1-25} V${top} H${x2+8} V${y2-28}`:`M${x1},${y1} C${x1+10},${y1} ${x2-10},${y2} ${x2-3},${y2}`);
      edge.dataset.source=String(source);edge.dataset.target=String(stages.indexOf(stage));edges.append(edge);
    }));
  }
  function architecture(all,modelId,select,layer=0) {
    const path=document.getElementById('computation-path');
    if(path.dataset.runId===modelId&&path.dataset.passId==='architecture'&&path.dataset.layer===String(layer))return;
    path.dataset.runId=modelId;path.dataset.passId='architecture';path.dataset.layer=String(layer);
    // One schematic of a repeated block, not a flattened trace of every layer.
    const stages=all.map((s,index)=>({...s,index})).filter(s=>s.layer===null||s.layer===layer).map(s=>{
      const button=document.createElement('button');button.textContent=s.label;button.title=s.detail;
      button.onclick=()=>select(s.index);
      return {...s,button,sources:s.inputs,data:{architectureStep:s.index}};
    });
    draw(stages,path);
  }
  // Timers advance the shared cursor, never computation or simulated time.
  function playback(changed) {
    let timer=null;
    const stop=()=>{if(timer!==null)clearTimeout(timer);timer=null;changed();};
    function start(views,inspect) {
      stop();let index=0;
      function advance(){if(index===views.length)return stop();timer=setTimeout(advance,650);inspect(views[index++]);}
      advance();changed();
    }
    return {start,stop,running:()=>timer!==null};
  }
  return {architecture,playback};
})();
