// Generated; DO NOT EDIT.
import {executeModelOperation,handlesModelOperation} from './model-service.js';
import {loadPyodide} from './runtime/pyodide.mjs';
const ready=(async()=>{
  const py=await loadPyodide({indexURL:new URL('./runtime/',import.meta.url).href});
  await py.loadPackage('jsonschema');
  const response=await fetch(new URL('./engine.zip',import.meta.url));
  if(!response.ok)throw Error('Engine package unavailable');
  py.unpackArchive(await response.arrayBuffer(),'zip',{extractDir:'/project'});
  await py.runPythonAsync("import sys; sys.path.insert(0, '/project'); from inside_inference.delivery.service import execute_json; from inside_inference.delivery.store import MemoryStore; evidence_store=MemoryStore()");
  return py;
})();
let queue=Promise.resolve();
onmessage=({data,ports})=>{
  const port=ports[0];
  queue=queue.then(async()=>{
    try {
      const py=await ready;
      py.globals.set('operation_name',data.operation);
      py.globals.set('operation_input',data.input);
      let json;
      if(handlesModelOperation(data.operation)) {
        await py.runPythonAsync('from inside_inference.delivery.service import validate_operation_input; validate_operation_input(operation_name, operation_input)');
        json=JSON.stringify(await executeModelOperation(data.operation,JSON.parse(data.input),py));
        py.globals.set('operation_output',json);
        await py.runPythonAsync('from inside_inference.delivery.service import validate_operation_output; validate_operation_output(operation_name, operation_output)');
      } else json=await py.runPythonAsync('execute_json(operation_name, operation_input, evidence_store)');
      port.postMessage({json});
    } catch(error) {port.postMessage({error:String(error)});}
    finally {port.close();}
  });
};
