import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const guide = readFileSync(new URL('dist/guide.js', root), 'utf8').replace(/export /g, '');
const app = readFileSync(new URL('dist/app.js', root), 'utf8')
  .replace(/^import[^\n]+\n/, '')
  .replace(/render\(\);refresh\(\);\s*$/, '');
function harness() {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      value: id === 'habitat' ? 'all' : id === 'view' ? 'seasonal' : '',
      addEventListener() {}, querySelectorAll() { return []; }, showModal() {},
      replaceChildren() {}, append() {}, hidden: false, textContent: '', innerHTML: ''
    });
    return elements.get(id);
  };
  const context = vm.createContext({
    URL, URLSearchParams, Intl, Date, AbortSignal,
    localStorage: { getItem() { return null; }, setItem() {} },
    navigator: {}, window: { addEventListener() {} },
    document: { getElementById: element, querySelectorAll() { return []; } },
    fetch: async () => { throw new Error('Network not available in fixture'); }
  });
  vm.runInContext(guide + '\n' + app, context);
  return { context, element, run: code => vm.runInContext(code, context) };
}
test('guide has 90 distinct species; absent weather is not scored as favourable', () => {
  const h = harness();
  assert.equal(h.run('species.length'), 90);
  assert.equal(h.run('new Set(species.map(s=>s.latin)).size'), 90);
  assert.equal(h.run('assessment(species[0]).label'), 'Weather unavailable');
});
test('an unlisted local species appears with evidence, photo and no invented habitat score', async () => {
  const h = harness();
  h.context.fetch = async () => ({ ok: true, json: async () => ({ total_results: 2, results: [
    { count: 40, taxon: { id: 123, rank: 'species', name: 'Testus localis', preferred_common_name: 'Fixture fungus', default_photo: { id: 5, medium_url: 'https://static.inaturalist.org/example.jpg', attribution: 'Fixture CC BY' } } },
    { count: 60, taxon: { id: 124, rank: 'genus', name: 'Testus' } }
  ] }) });
  const result = await h.run('observations(state.location)');
  assert.equal(Object.keys(result.counts).length, 1);
  h.context.records = result.counts;
  h.run('state.observations=records;state.observationsAt=new Date().toISOString();render()');
  assert.match(h.element('species-grid').innerHTML, /Fixture fungus/);
  assert.equal(h.run('selectedCandidates()[0].latin'), 'Testus localis');
  assert.equal(h.run('assessCandidate(selectedCandidates()[0]).score'), 0);
  assert.equal(h.run('selectedCandidates()[0].habitat'), 'unknown');
  h.run('showDetails("local-123")');
  assert.match(h.element('detail-content').innerHTML, /No documented UK season/);
});
test('records beyond the first page survive; synonyms map to existing guide entries', async () => {
  const h = harness(); const pages = [];
  h.context.fetch = async url => {
    const page = Number(new URL(url).searchParams.get('page')); pages.push(page);
    return { ok: true, json: async () => ({ total_results: 501, results: page === 1
      ? Array.from({ length: 500 }, (_, i) => ({ count: 1, taxon: { id: 1000 + i, rank: 'species', name: `Fixture species${i}` } }))
      : [{ count: 8, taxon: { id: 20, rank: 'species', name: 'Lepista nuda' } }] }) };
  };
  const result = await h.run('observations(state.location)');
  assert.deepEqual(pages, [1, 2]);
  assert.equal(Object.keys(result.counts).length, 501);
  assert.equal(result.counts['Collybia nuda'].count, 8);
  assert.equal(result.coverage.truncated, false);
});
test('habitat and search filters retain sulphur tuft; all-guide view exposes all entries', () => {
  const h = harness(); h.element('view').value = 'all';
  assert.equal(h.run('selectedCandidates().length'), 90);
  h.element('species-search').value = 'Hypholoma';
  assert.equal(h.run('selectedCandidates().length'), 3);
  h.element('species-search').value = 'sulphur tuft'; h.element('habitat').value = 'wood';
  assert.equal(h.run('selectedCandidates().length'), 1);
  h.element('habitat').value = 'grass';
  assert.equal(h.run('selectedCandidates().length'), 0);
});
