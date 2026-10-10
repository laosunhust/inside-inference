'use strict';
const search = document.querySelector('#search');
if (search) {
  const cards = [...document.querySelectorAll('[data-search]')];
  const update = () => {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    for (const card of cards) {
      card.hidden = !card.textContent.toLowerCase().includes(query);
      document.querySelector(`nav a[href="#${card.id}"]`).hidden = card.hidden;
      if (!card.hidden) visible++;
    }
    document.querySelector('#result-count').textContent = `${visible} of ${cards.length} areas`;
    document.querySelector('#no-results').hidden = visible !== 0;
  };
  search.addEventListener('input', update);
  update();
}
const traceData = document.querySelector('#trace-data');
if (traceData) {
  const data = JSON.parse(traceData.textContent);
  const scenario = document.querySelector('#scenario');
  const step = document.querySelector('#step');
  const labels = {before: 'State before', key: 'Key k', value: 'Value v', query: 'Query q',
    alpha: 'Decay alpha', beta: 'Write strength beta', decayed: 'Decayed state D',
    prediction: 'Read at key', error: 'Correction error', delta: 'Write delta',
    after: 'State after', output: 'Read at query'};
  const format = value => Array.isArray(value)
    ? '[' + value.map(format).join(Array.isArray(value[0]) ? ',\n ' : ', ') + ']'
    : Number(value.toFixed(5)).toString();
  const update = () => {
    const events = data[scenario.value];
    step.max = events.length - 1;
    if(Number(step.value) >= events.length) step.value = events.length - 1;
    document.querySelector('#step-count').textContent = events.length;
    const event = events[Number(step.value)];
    document.querySelector('#step-number').textContent = Number(step.value) + 1;
    const trace = document.querySelector('#trace');
    trace.replaceChildren();
    for (const [key, label] of Object.entries(labels)) {
      const card = document.createElement('div');
      const heading = document.createElement('h3');
      const values = document.createElement('pre');
      heading.textContent = label;
      values.textContent = format(event[key]);
      card.append(heading, values);
      trace.append(card);
    }
  };
  scenario.addEventListener('change', update);
  step.addEventListener('input', update);
  update();
}
