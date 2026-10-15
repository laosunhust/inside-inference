/* One operation queue for measured browser execution, also usable headlessly. */
export function createDispatch(execution,now=()=>performance.now()) {
  let settled=Promise.resolve();
  function enqueue(action) {
    const result=settled.then(action);
    settled=result.then(()=>undefined,()=>undefined);
    return result;
  }
  return {
    invoke:(operation,input)=>enqueue(()=>execution[operation](input)),
    token:(request,current)=>enqueue(async()=>{
      if(!current())throw Error('Generation canceled before dispatch');
      const dispatched_ms=now();
      return {prediction:await execution.generateToken(request),dispatched_ms};
    })
  };
}
