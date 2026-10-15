// Generated; DO NOT EDIT.
import {loadPyodide} from './runtime/pyodide.mjs';
const ready=(async()=>{
  const py=await loadPyodide({indexURL:new URL('./runtime/',import.meta.url).href});
  await py.loadPackage(['jsonschema','numpy']);
  const response=await fetch(new URL('./engine.zip',import.meta.url));
  if(!response.ok)throw Error('Engine package unavailable');
  py.unpackArchive(await response.arrayBuffer(),'zip',{extractDir:'/project'});
  await py.runPythonAsync("import sys; sys.path.insert(0, '/project'); from inside_inference.delivery.service import execute_browser");
  return {py,execute:py.globals.get('execute_browser')};
})();
let queue=Promise.resolve();
onmessage=({data,ports})=>{
  const port=ports[0],received=performance.now();
  queue=queue.then(async()=>{
    try {
      const {py,execute}=await ready;
      const input=py.toPy(data.input),entered=performance.now();
      let result,call;
      try {
        call=execute(data.operation,input);
        result=await call;
        const completed=performance.now(),[value,python]=result.toJs({dict_converter:Object.fromEntries});
        const buffers=new Set();
        function collect(item) {
          if(ArrayBuffer.isView(item)){buffers.add(item.buffer);return;}
          if(item&&typeof item==='object')for(const child of Object.values(item))collect(child);
        }
        collect(value);
        const converted=performance.now(),transferred_bytes=[...buffers].reduce((n,b)=>n+b.byteLength,0);
        port.postMessage({value,python,worker_wait_ms:entered-received,python_bridge_ms:completed-entered,
          buffer_conversion_ms:converted-completed,transferred_bytes},[...buffers]);
      } finally {result?.destroy();call?.destroy();input?.destroy?.();}
    } catch(error) {port.postMessage({error:String(error)});}
    finally {port.close();}
  });
};
