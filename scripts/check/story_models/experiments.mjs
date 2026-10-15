import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

export async function checkExperiments({evaluate,ready,click,snapshot,send,output,until}) {
  const declared=await evaluate('Object.values(Declarations.experiments)'),kv=[];
  assert.equal(await evaluate("[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Apply')"),false);
  const invalid=await evaluate(`(()=>{
    const base=Object.values(Declarations.experiments).find(e=>e.variants.length),results=[];
    for(const mutate of [e=>e.variants[0].input.workload.requests[0].request.generation.max_new_tokens=0,e=>e.variants[0].input.execution.experiments.push(structuredClone(e.variants[0].input.execution.experiments[0])),e=>e.variants=[],e=>e.missing_controls=['future_control']]){
      const changed=structuredClone(base);mutate(changed);try{Declarations.assertShape('ExperimentDesign',changed);results.push(false);}catch{results.push(true);}
    }return results;
  })()`);assert.deepEqual(invalid,[true,true,true,true]);
  for(const experiment of declared){
    const selector=`#experiments [data-experiment="${experiment.id}"]`;
    assert.equal(await evaluate(`document.querySelectorAll('${selector} [data-configure-experiment]').length`),experiment.variants.length);
    for(const [index,variant] of experiment.variants.entries()){
      await click('open-system');
      await evaluate(`document.querySelector('${selector}').open=true`);
      if(experiment.id==='kv-browser-timing'&&index===0){
        for(const [label,width,height] of [['desktop',1280,1000],['narrow',390,844]]){
          await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
          await evaluate(`document.querySelector('${selector}').scrollIntoView({block:'start'})`);
          await writeFile(`${output}/experiment-controls-${label}.png`,Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
        }
        await send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
      }
      await evaluate(`document.querySelector('${selector} [data-variant="${index}"]').click()`);await ready();
      assert.equal(await evaluate("document.getElementById('system-dialog').open"),false);
      assert.equal(await evaluate("document.activeElement.id"),'interaction-title');
      const input=variant.input,controls=input.execution.experiments,simulation=controls.some(c=>c.control==='kv_cache');
      assert.equal(await evaluate("document.getElementById('response-preview').textContent"),'','Configuration must not generate');
      assert.equal(await evaluate("document.getElementById('download-run').disabled"),true,'No retained evidence from previous setup');
      assert.equal(await evaluate("document.getElementById('run-identity').textContent"),'');
      assert.equal(await evaluate("document.getElementById('resource-explanation').dataset.execution??null"),null);
      assert.equal(await evaluate("document.getElementById('prompt').value"),input.workload.requests[0].request.text);
      assert.equal(await evaluate("Number(document.getElementById('output-budget').value)"),input.workload.requests[0].request.generation.max_new_tokens);
      const summary=await evaluate("document.getElementById('interaction-configuration').textContent");
      assert.ok(summary.includes('KV reuse '+(controls.find(c=>c.control==='kv_reuse').value?'ON':'OFF')));
      assert.equal(await evaluate("document.getElementById('interaction-settings-values').textContent"),await evaluate(`Experiments.settings(${JSON.stringify(input)}).textContent`));
      if(simulation){
        await click('continue-tokens');await ready();
        const evidence=await evaluate("JSON.parse(document.getElementById('resource-explanation').dataset.execution)");assert.deepEqual(evidence.input,input);
        assert.match(await evaluate("document.getElementById('timing-simulation').textContent"),/Virtual duration: .*computed positions/);
      }else{
        assert.equal(await evaluate("document.getElementById('timing-count').textContent"),'0');
        const steps=[];
        for(let step=1;step<=2;step++){
          await click('next-token');await ready();await until(`document.getElementById('timing-count').textContent==='${step}'`);
          const prediction=await snapshot();steps.push(prediction);
          assert.deepEqual(prediction.request.execution,input.execution);
          assert.deepEqual(prediction.request.generation,input.workload.requests[0].request.generation);
          assert.match(await evaluate("document.getElementById('timing-work').textContent"),new RegExp(`${prediction.work.processed_positions} computed · ${prediction.work.reused_positions} reused`));
        }
        assert.equal(steps[0].work.reused_positions,0);
        if(experiment.id==='kv-browser-timing')kv.push(steps);
      }
      for(const [label,width,height] of [['desktop',1280,1000],['narrow',390,844]]){
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
        await evaluate("document.getElementById('data-plane').scrollIntoView({block:'start'})");
        assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
        await writeFile(`${output}/configured-${experiment.id}-${index}-${label}.png`,Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
      }
      await send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
    }
  }
  assert.deepEqual(kv[0].map(p=>p.selected_id),kv[1].map(p=>p.selected_id));
  assert.equal(kv[0][1].work.reused_positions,0);assert.equal(kv[1][1].work.processed_positions,1);
  assert.ok(kv[1][1].work.reused_positions>0);
  assert.ok(kv[0][1].work.processed_positions>kv[1][1].work.processed_positions);
  return declared.map(e=>({id:e.id,variants:e.variants.length}));
}
