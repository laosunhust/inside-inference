import assert from 'node:assert/strict';

/* Declared experiments apply through the Inference system configuration; planned ones cannot. */
export async function checkExperiments({evaluate,ready,click,snapshot}) {
  // Experiments apply declared ExperimentSpec settings; planned ones name what they lack and cannot apply.
  const declared=await evaluate("Object.values(Declarations.experiments)");
  for(const experiment of declared){
    const card=await evaluate(`(()=>{const c=document.querySelector('#experiments [data-experiment="${experiment.id}"]');return c&&{apply:!!c.querySelector('[data-apply-experiment]'),missing:c.querySelector('.experiment-missing')?.textContent||''};})()`);
    assert.ok(card,'Experiment listed: '+experiment.id);
    assert.equal(card.apply,experiment.missing_controls.length===0,experiment.id);
    for(const control of experiment.missing_controls)assert.ok(card.missing.includes(control.replaceAll('_',' ')),control);
  }
  await evaluate(`document.querySelector('[data-apply-experiment="kv-residency"]').click()`);await ready();
  assert.equal(await evaluate("document.getElementById('resource-enabled').checked && document.getElementById('kv-reuse').checked"),true,'Residency settings applied');
  await evaluate(`document.querySelector('[data-apply-experiment="reference-execution"]').click()`);await ready();
  assert.equal(await evaluate("document.getElementById('resource-enabled').checked || document.getElementById('kv-reuse').checked"),false,'Reference settings replace residency settings');
  await click('next-token');await ready();
  assert.deepEqual((await snapshot()).request.execution.experiments,declared.find(e=>e.id==='reference-execution').settings);
  return declared.map(e=>({id:e.id,executable:e.missing_controls.length===0}));
}
