import fs from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import standalone from 'ajv/dist/standalone/index.js';
import {build} from 'esbuild';
const schema=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
// Domain annotations are checked by ontology admission; they do not replace JSON Schema.
const ajv=new Ajv2020({strict:true,strictNumbers:true,allErrors:true,code:{source:true},allowUnionTypes:true});
ajv.addVocabulary(['x-owner','x-maximum-from']);
const root={$id:'urn:inside-inference:contracts', $schema:schema.$schema, $defs:schema.$defs};
ajv.addSchema(root);
const names=Object.fromEntries(Object.keys(schema.$defs).map(name=>[name,`${root.$id}#/$defs/${name}`]));
const code=standalone(ajv,names);
const bundled=await build({stdin:{contents:code,resolveDir:process.cwd(),sourcefile:'contract-validators.cjs'},bundle:true,write:false,platform:'browser',format:'iife',globalName:'CompiledContracts',minify:false,legalComments:'inline'});
process.stdout.write('// Generated with Ajv and esbuild; DO NOT EDIT.\n'+bundled.outputFiles[0].text);
