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
  let samples=[],observers=[],segment=0,gesture=null;
  const clear=()=>{samples=[];observers=[];segment=0;gesture=null;};
  function begin(mode,started,continuation) {
    if(!continuation)clear();
    gesture={mode,started_ms:started,segment:++segment};
  }
  function record(prediction,updated,publishes,dispatched,returned,execution) {
    if(!gesture)throw Error('Timing has no generation gesture');
    const sample={prediction_id:prediction.id,token_index:prediction.output_ids.length,
      ...gesture,dispatched_ms:dispatched,returned_ms:returned,execution:structuredClone(execution),updated_ms:updated,publishes_text:publishes,
      context_length:prediction.request.prefix_ids.length+prediction.request.output_ids.length,
      selected_id:prediction.selected_id,stop_reason:prediction.stop_reason,speculation:structuredClone(prediction.speculation),
      work:structuredClone(prediction.work),decoder_ms:prediction.decoder_ms,service_ms:prediction.service_ms};
    Declarations.assertShape('BrowserTokenTiming',sample);
    if(dispatched<sample.started_ms || returned<dispatched || updated<returned || (samples.length && (updated<samples.at(-1).updated_ms || sample.token_index!==samples.at(-1).token_index+1)))
      throw Error('Timing must follow accepted tokens on a monotonic clock');
    samples.push(sample);
  }
  function observe(started,finished) {
    const last=observers.at(-1)?.last_token??0,pending=samples.filter(s=>s.token_index>last);
    if(!pending.length)return;
    if(started<pending.at(-1).updated_ms || finished<started)throw Error('Observer timing must follow publication');
    const observation={first_token:pending[0].token_index,last_token:pending.at(-1).token_index,started_ms:started,finished_ms:finished};
    Declarations.assertShape('BrowserObserverBatch',observation);observers.push(observation);
  }
  return {clear,begin,record,observe,evidence:()=>({clock:'browser-monotonic-ms',samples:structuredClone(samples),observers:structuredClone(observers)})};
}

