// Generated; DO NOT EDIT.
import {loadPyodide} from './runtime/pyodide.mjs';
const ready=(async()=>{
  const py=await loadPyodide({indexURL:new URL('./runtime/',import.meta.url).href});
  await py.loadPackage(['jsonschema','numpy']);
  const response=await fetch(new URL('./engine.zip',import.meta.url));
  if(!response.ok)throw Error('Engine package unavailable');
  py.unpackArchive(await response.arrayBuffer(),'zip',{extractDir:'/project'});
  await py.runPythonAsync("import sys; sys.path.insert(0, '/project'); from inside_inference.delivery.service import execute_json");
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
      const json=await py.runPythonAsync('await execute_json(operation_name, operation_input)');
      port.postMessage({json});
    } catch(error) {port.postMessage({error:String(error)});}
    finally {port.close();}
  });
};
