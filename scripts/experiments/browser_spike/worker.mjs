// Experiment instrumentation, not the production worker API. Executes fixed declared cases.
import {loadPyodide} from './runtime/pyodide.mjs';
const began=performance.now();
try {
  const py=await loadPyodide({indexURL:new URL('./runtime/',import.meta.url).href});
  await py.loadPackage('jsonschema');
  const packageBytes=await (await fetch('./engine.zip')).arrayBuffer();
  py.unpackArchive(packageBytes,'zip',{extractDir:'/project'});
  await py.runPythonAsync("import sys; sys.path.insert(0, '/project'); from spike_cases import execute, cases");
  postMessage({kind:'ready',milliseconds:performance.now()-began,cases:py.runPython('len(cases())'),memory:py._module.HEAP8.buffer.byteLength,python:py.runPython('sys.version')});
  onmessage=async({data})=>{
    try {
      // Only an integer case index reaches this research driver. Domain inputs live in cases.py.
      if(!Number.isInteger(data))throw new Error('Invalid case index');
      const start=performance.now();
      const result=await py.runPythonAsync(`execute(${data})`);
      postMessage({kind:'result',json:result,milliseconds:performance.now()-start,memory:py._module.HEAP8.buffer.byteLength});
    } catch(error) {postMessage({kind:'failure',error:String(error)});}
  };
} catch(error) {postMessage({kind:'failure',error:String(error)});}
