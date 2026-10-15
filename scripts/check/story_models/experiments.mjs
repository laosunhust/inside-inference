import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

export async function checkExperiments({evaluate,ready,click,snapshot,send,output,until}) {
  const declared=await evaluate('Object.values(Declarations.experiments)'),kv=[],residency=[],speculative=[],headlessRuns=[];
  assert.equal(await evaluate("[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Apply')"),false);
  const invalid=await evaluate(`(()=>{
    const base=Object.values(Declarations.experiments).find(e=>e.id==='kv-browser-timing'),results=[];
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
        const evidence=await evaluate("JSON.parse(document.getElementById('resource-explanation').dataset.execution)");assert.deepEqual(evidence.input,input);residency.push(evidence);
        assert.match(await evaluate("document.getElementById('timing-simulation').textContent"),/Virtual duration: .*computed positions/);
      }else{
        assert.equal(await evaluate("document.getElementById('timing-count').textContent"),'0');
        const steps=[];
        for(let step=1;step<=2;step++){
          await click('next-token');await ready();await until(`document.getElementById('timing-count').textContent==='${step}'`);
          const prediction=await snapshot();steps.push(prediction);
          assert.deepEqual(prediction.request.execution,input.execution);
          assert.deepEqual(prediction.request.generation,input.workload.requests[0].request.generation);
          if(prediction.speculation?.buffered)assert.match(await evaluate("document.getElementById('timing-work').textContent"),/already-verified/);
          else assert.match(await evaluate("document.getElementById('timing-work').textContent"),new RegExp(`${prediction.work.processed_positions} computed · ${prediction.work.reused_positions} reused`));
        }
        if(!steps[0].speculation)assert.equal(steps[0].work.reused_positions,0);
        if(experiment.id==='kv-browser-timing')kv.push(steps);
        if(experiment.id==='speculative-decoding'){
          await click('continue-tokens');await ready();await until("JSON.parse(document.getElementById('run-identity').textContent||'{}').stop_reason!=null");
          speculative.push(await snapshot());
          const headless=await evaluate(`(async()=>{
            const input=${JSON.stringify(input)},prepared=await Execution.prepareGeneration(input);let output=[],rounds=[];
            for(let i=0;i<input.workload.requests[0].request.generation.max_new_tokens;i++){
              const prediction=await Execution.generateToken({session_id:prepared.session_id,prefix_ids:prepared.prompt_ids,output_ids:output});
              Declarations.assertShape('GenerationPrediction',prediction);output=prediction.output_ids;
              if(prediction.speculation?.round)rounds.push(prediction.speculation.round);
              if(prediction.stop_reason)break;
            }return {output,rounds};
          })()`);
          headlessRuns.push(headless);
          assert.deepEqual(headless.output,speculative.at(-1).output_ids,'Headless and interactive decoding agree');
          if(index===1){assert.ok(headless.rounds.length);assert.equal(headless.rounds[0].target_work.reused_positions,0);}

          if(index===1)assert.equal(await evaluate("document.getElementById('speculation-performance').hidden"),false);
        }
      }
      for(const [label,width,height] of [['desktop',1280,1000],['narrow',390,844]]){
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
        await evaluate("document.getElementById('data-plane').scrollIntoView({block:'start'})");
        assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
        await writeFile(`${output}/configured-${experiment.id}-${index}-${label}.png`,Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
        if(simulation||(experiment.id==='speculative-decoding'&&index===1)){
          await evaluate("document.getElementById('control-plane').scrollIntoView({block:'start'})");
          await writeFile(`${output}/mode-controls-${experiment.id}-${index}-${label}.png`,Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
        }
        if(experiment.id==='speculative-decoding'&&index===1){
          await evaluate("document.querySelector('#speculation-performance details').open=true;document.getElementById('speculation-performance').scrollIntoView({block:'start'})");
          assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
          await writeFile(`${output}/speculation-rounds-${label}.png`,Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
          await evaluate("document.querySelector('#speculation-performance details').open=false");
        }
      }
      await send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
      if(experiment.id==='speculative-decoding'&&index===1){
        assert.equal(await evaluate("document.getElementById('resource-enabled').disabled&&document.getElementById('kv-reuse').disabled"),true);
        await click('open-system');
        await evaluate("const input=document.getElementById('speculation-proposal_tokens');input.value=1;input.dispatchEvent(new Event('change'))");await ready();
        await evaluate("document.getElementById('system-dialog').close()");
        assert.equal(await evaluate("document.getElementById('response-preview').textContent"),'');
        await click('next-token');await ready();await until("document.getElementById('timing-count').textContent==='1'");
        assert.equal((await snapshot()).speculation.round.proposed_ids.length,1,'Configured proposal length controls real drafting');
        const exported=await evaluate(`(async()=>{const original=URL.createObjectURL;let data;URL.createObjectURL=blob=>{data=blob.text();return original(blob);};try{document.getElementById('download-run').click();return JSON.parse(await data);}finally{URL.createObjectURL=original;}})()`);
        Declarations.assertShape('GenerationEvidence',exported);
        assert.deepEqual(exported.timing.samples[0].speculation,exported.prediction.speculation);
        assert.equal(await evaluate("document.querySelectorAll('#speculation-rounds section').length"),exported.timing.samples.filter(s=>s.speculation?.round).length);
        await click('reset');await click('next-token');await ready();await until("document.getElementById('timing-count').textContent==='1'");
        assert.equal((await snapshot()).speculation.round.target_work.reused_positions,0,'Reset starts a cold round');
        await click('disable-speculation');await ready();
        assert.equal(await evaluate("document.getElementById('disable-speculation').hidden"),true);
        assert.equal(await evaluate("document.getElementById('prompt').value"),input.workload.requests[0].request.text);
        assert.equal(await evaluate("document.getElementById('model-choice').disabled"),false);
      }
      if(simulation){
        assert.equal(await evaluate("document.getElementById('kv-reuse').disabled"),true);
        assert.equal(await evaluate("[...document.getElementById('model-choice').options].find(o=>o.value==='tinyllm-4m').disabled"),true);
        await click('disable-resource-mode');await ready();
        assert.equal(await evaluate("document.getElementById('resource-enabled').checked"),false);
        assert.equal(await evaluate("document.getElementById('prompt').value"),input.workload.requests[0].request.text);
        await evaluate("document.getElementById('model-choice').value='tinyllm-4m';document.getElementById('model-choice').dispatchEvent(new Event('change'))");await ready();
        await click('next-token');await ready();assert.equal((await snapshot()).model_id,'tinyllm-4m');
      }
    }
  }
  assert.deepEqual(speculative[0].output_ids,speculative[1].output_ids,'Speculative generation must preserve target greedy output');
  assert.equal(declared.some(e=>e.id==='reference-execution'),false);
  const lookups=r=>r.run.events.filter(e=>['miss','local-hit','remote-hit'].includes(e.kind)).map(e=>e.kind);
  assert.deepEqual(lookups(residency[0]),['miss','miss','miss']);
  assert.deepEqual(lookups(residency[1]),['miss','miss','remote-hit']);
  assert.deepEqual(residency[0].outputs,residency[1].outputs);
  assert.ok(residency[1].run.computations.reduce((n,c)=>n+c.input_ids.length,0)<residency[0].run.computations.reduce((n,c)=>n+c.input_ids.length,0));
  assert.deepEqual(kv[0].map(p=>p.selected_id),kv[1].map(p=>p.selected_id));
  assert.equal(kv[0][1].work.reused_positions,0);assert.equal(kv[1][1].work.processed_positions,1);
  assert.ok(kv[1][1].work.reused_positions>0);
  assert.ok(kv[0][1].work.processed_positions>kv[1][1].work.processed_positions);
  return {catalog:declared.map(e=>({id:e.id,variants:e.variants.length})),speculative:headlessRuns};
}
