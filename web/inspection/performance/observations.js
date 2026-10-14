/* Browser output updates are observations, never simulated service times. */
export function timingMetrics(trace) {
  const samples=trace.samples,first=samples[0],intervals=[];
  const visible=first?.token_index===1&&first.mode==='continuous'?samples.find(s=>s.segment===first.segment&&s.publishes_text):null;
  for(let i=1;i<samples.length;i++){
    const a=samples[i-1],b=samples[i];
    if(a.mode==='continuous'&&b.mode==='continuous'&&a.segment===b.segment)
      intervals.push({token:b.token_index,ms:b.updated_ms-a.updated_ms,segment:b.segment});
  }
  const last=samples.at(-1);
  return {ttft:visible?visible.updated_ms-first.started_ms:null,intervals,
    step:last?.mode==='manual'?last.updated_ms-last.started_ms:null};
}

export function createTiming() {
  let samples=[],segment=0,gesture=null;
  const clear=()=>{samples=[];segment=0;gesture=null;};
  function begin(mode,started,continuation) {
    if(!continuation)clear();
    gesture={mode,started_ms:started,segment:++segment};
  }
  function record(prediction,updated,publishes) {
    if(!gesture)throw Error('Timing has no generation gesture');
    const sample={prediction_id:prediction.id,token_index:prediction.output_ids.length,
      ...gesture,updated_ms:updated,publishes_text:publishes};
    Declarations.assertShape('BrowserTokenTiming',sample);
    if(updated<sample.started_ms || (samples.length && (updated<samples.at(-1).updated_ms || sample.token_index!==samples.at(-1).token_index+1)))
      throw Error('Timing must follow accepted tokens on a monotonic clock');
    samples.push(sample);
  }
  return {clear,begin,record,evidence:()=>({clock:'browser-monotonic-ms',samples:structuredClone(samples)})};
}

