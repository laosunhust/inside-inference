/* Render ontology principles and their executed code. Equations and code are never authored here. */
globalThis.Principles=(()=>{
  const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
  const of=owner=>Declarations.meanings[owner]?.principles||[];
  const matches=(principle,architecture)=>Object.entries(principle.when).every(([k,v])=>architecture[k]===v);
  // The owner's principle whose variant matches this model and binds this operation.
  const applicable=(operation,architecture)=>of(Declarations.operationOwners[operation]).find(p=>matches(p,architecture)&&p.symbols.some(s=>s.binds.includes('operation:'+operation)))||null;
  const math=(tex,display)=>{const e=el(display?'div':'span');katex.render(tex,e,{displayMode:display,throwOnError:true});return e;};
  function dedent(code){
    const lines=code.split('\n'),indent=Math.min(...lines.filter(l=>l.trim()).map(l=>l.match(/^ */)[0].length));
    return lines.map(l=>l.slice(indent)).join('\n');
  }
  function render(principle) {
    const box=el('section',undefined,'principle');box.dataset.principle=principle.id;
    // Variant conditions use the architecture field titles declared in the data model.
    const field=key=>Declarations.schemas.ModelArchitecture.properties[key].title;
    const when=Object.entries(principle.when).map(([key,value])=>`${field(key)}: ${value}`);
    if(when.length)box.append(el('p',when.join(' · '),'principle-variant'));
    const equation=math(principle.equation,true);equation.className='principle-equation';box.append(equation);
    const symbols=el('details'),list=el('dl');symbols.append(el('summary','Symbols'),list);
    for(const symbol of principle.symbols){const term=el('dt');term.append(math(symbol.symbol,false));list.append(term,el('dd',symbol.meaning));}
    const span=PrincipleCode[principle.id];
    if(!span)throw Error('No executed code span for principle '+principle.id);
    const code=el('details'),pre=el('pre');code.className='principle-code';
    code.append(el('summary',`Code · ${span.path.replace('inside_inference/','')}:${span.start}${span.end>span.start?'–'+span.end:''}`),pre);
    pre.append(el('code',dedent(span.code)));
    box.append(symbols,code);
    return box;
  }
  return {of,applicable,render};
})();
