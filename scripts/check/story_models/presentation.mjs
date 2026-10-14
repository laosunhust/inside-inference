import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

export async function checkPresentation({send,evaluate,output,model,result}) {
  assert.equal(await evaluate("Number(document.getElementById('timing-count').textContent)"),result.output_ids.length);
  assert.equal(await evaluate("document.querySelectorAll('#latency-chart circle').length"),Math.max(0,result.output_ids.length-1));
  if(result.text)assert.match(await evaluate("document.getElementById('timing-ttft').textContent"),/\d.* ms$/);
  for(const [label,width,height] of [['desktop',1280,1000],['mobile',390,844]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
    assert.ok(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),'Horizontal overflow');
    if(result.output_ids.length>1)assert.ok(await evaluate("document.getElementById('latency-chart').getBoundingClientRect().height>100"),'Chart must actually render, not just contain points');
    const bounds=await evaluate("(()=>{const a=document.querySelector('.interaction-functional').getBoundingClientRect(),b=document.getElementById('interaction-performance').getBoundingClientRect();return {ratio:a.width/b.width,left:a.left,right:b.left,bottom:a.bottom,top:b.top};})()");
    if(width>800){assert.ok(bounds.right>bounds.left);assert.ok(Math.abs(bounds.ratio-2)<.03);}
    else assert.ok(bounds.top>=bounds.bottom,'Performance stacks after input/output');
    await evaluate("document.getElementById('system-map').scrollIntoView({block:'start'})");
    await writeFile(output+'/'+model.id+'-'+label+'.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
    if(model.id==='tinyllm-8k'){
      await evaluate("document.getElementById('data-plane').scrollIntoView({block:'start'})");
      await writeFile(output+'/interaction-'+label+'.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
    }
  }
}
export async function checkEmptyTiming(evaluate){
  assert.deepEqual(await evaluate("[document.getElementById('timing-count').textContent,document.getElementById('timing-ttft').textContent,document.querySelectorAll('#latency-chart circle').length]"),['0','—',0]);
}
export async function checkManualTiming(evaluate){
  assert.equal(await evaluate("document.getElementById('timing-step').hidden"),false);
  assert.equal(await evaluate("document.querySelectorAll('#latency-chart circle').length"),0);
}
export function checkTimingExport(evidence){
  Declarations.assertShape('GenerationEvidence',evidence);
  assert.equal(evidence.timing.samples.length,evidence.prediction.output_ids.length);
  assert.equal(evidence.timing.samples.at(-1).prediction_id,evidence.prediction.id);
}
