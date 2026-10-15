import {timingMetrics} from './observations.js';

export function mountTiming(root) {
  const $=id=>root.querySelector('#'+id),format=ms=>ms===null?'—':ms.toLocaleString('en-US',{maximumFractionDigits:1})+' ms';
  const svg=(tag,attributes={},text)=>{
    const node=document.createElementNS('http://www.w3.org/2000/svg',tag);
    for(const [key,value] of Object.entries(attributes))node.setAttribute(key,value);
    if(text!==undefined)node.textContent=text;return node;
  };
  function plot(points) {
    const chart=$('latency-chart');chart.replaceChildren();chart.toggleAttribute('hidden',!points.length);
    if(!points.length)return;
    const first=points[0].token,last=points.at(-1).token,ceiling=Math.max(1,...points.map(p=>p.ms))*1.15;
    const x=n=>first===last?172:42+(n-first)/(last-first)*260,y=n=>120-n/ceiling*100;
    chart.append(svg('title',{},'Inter-token latency in chronological token order'),svg('desc',{},'Milliseconds between consecutive token updates during uninterrupted generation. Gaps separate generation gestures.'));
    for(const value of [0,ceiling/2,ceiling])chart.append(svg('line',{x1:42,x2:302,y1:y(value),y2:y(value),class:'latency-grid'}),svg('text',{x:36,y:y(value)+4,'text-anchor':'end'},value.toFixed(value<10?1:0)));
    chart.append(svg('text',{x:6,y:11},'ms'),svg('text',{x:172,y:155,'text-anchor':'middle'},'Generated token'));
    for(const token of new Set([first,last]))chart.append(svg('text',{x:x(token),y:138,'text-anchor':'middle'},String(token)));
    let group=[];
    function line(){if(group.length>1)chart.append(svg('polyline',{points:group.map(p=>`${x(p.token)},${y(p.ms)}`).join(' '),class:'latency-line'}));}
    for(const point of points){if(group.length&&group.at(-1).segment!==point.segment){line();group=[];}group.push(point);}line();
    for(const point of points){
      const label=`Token ${point.token}: ${format(point.ms)}`,dot=svg('circle',{cx:x(point.token),cy:y(point.ms),r:3.5,tabindex:0,role:'img','aria-label':label,class:'latency-point'});
      dot.append(svg('title',{},label));chart.append(dot);
    }
  }
  return function render(trace,count,simulated) {
    $('timing-measurements').hidden=simulated;$('timing-simulation').hidden=!simulated;
    if(simulated)return;
    const metrics=timingMetrics(trace);
    $('timing-ttft').textContent=format(metrics.ttft);$('timing-count').textContent=String(count);
    $('timing-step').hidden=metrics.step===null;$('timing-step').textContent='Last step · '+format(metrics.step);
    $('latency-empty').hidden=!!metrics.intervals.length;
    $('latency-empty').textContent=trace.samples.some(s=>s.mode==='continuous')?'No inter-token interval yet.':'Use Generate to measure token spacing.';
    plot(metrics.intervals);
    const rows=$('timing-samples');rows.replaceChildren();
    for(const sample of trace.samples){const row=document.createElement('tr');for(const text of [sample.token_index,sample.context_length,sample.work.processed_positions,sample.work.reused_positions,format(sample.decoder_ms),format(sample.service_ms),format(metrics.intervals.find(point=>point.token===sample.token_index)?.ms??null)]){const cell=document.createElement('td');cell.textContent=text;row.append(cell);}rows.append(row);}
    $('timing-values').hidden=!trace.samples.length;
    const first=trace.samples[0],observer=trace.observers.at(-1);
    const publication=observer?trace.samples.find(s=>s.token_index===observer.last_token):null;
    $('timing-boundaries').textContent=(first?`Before first dispatch: ${format(first.dispatched_ms-first.started_ms)} (included in first-token latency). `:'')+(observer?`Last inspection/chart update: ${format(observer.finished_ms-observer.started_ms)}; completion lag from its last token: ${format(observer.finished_ms-publication.updated_ms)}. This excludes deferred layout and paint.`:'No completed inspection/chart update recorded yet.');
  };
}
