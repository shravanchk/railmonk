const test = require('node:test');
const assert = require('node:assert/strict');

const { encodeFields, decodeFields, buildShareUrl } = require('../utils/shareLinks');

test('only values that differ from the defaults are written', () => {
  const defaults = { class: 'SL', km: '500', pax: '1' };
  assert.equal(encodeFields({ class: 'SL', km: '500', pax: '1' }, defaults), '');
  assert.equal(encodeFields({ class: '2A', km: '500', pax: '1' }, defaults), 'class=2A');
  assert.equal(encodeFields({ class: '2A', km: '1400', pax: '3' }, defaults), 'class=2A&km=1400&pax=3');
});

test('empty and nullish values are omitted rather than written as blanks', () => {
  const encoded = encodeFields({ date: '', time: null, mode: undefined, code: 'GNWL' }, {});
  assert.equal(encoded, 'code=GNWL');
});

test('values are URL-encoded', () => {
  // Times carry a colon; labels can carry spaces and ampersands.
  assert.equal(encodeFields({ at: '2026-08-10T06:30' }, {}), 'at=2026-08-10T06%3A30');
  assert.equal(encodeFields({ label: 'Delhi & Agra' }, {}), 'label=Delhi+%26+Agra');
});

test('numbers and booleans survive the round trip as the caller projects them', () => {
  // The hook's contract is strings in, strings out — callers project and parse.
  const fields = { days: String(12), peak: true ? '1' : '' };
  assert.equal(encodeFields(fields, { days: '12', peak: '' }), 'peak=1');
  assert.equal(decodeFields({ peak: '1' }, ['days', 'peak']).peak, '1');
});

test('decodeFields keeps only recognised, non-empty string keys', () => {
  const query = { class: '2A', km: '', utm_source: 'whatsapp', pax: ['3', '4'] };
  assert.deepEqual(decodeFields(query, ['class', 'km', 'pax']), { class: '2A' });
});

test('decodeFields tolerates a missing query object', () => {
  assert.deepEqual(decodeFields(undefined, ['class']), {});
  assert.deepEqual(decodeFields({}, []), {});
});

test('an unrecognised param cannot inject state', () => {
  // A link with junk on it still opens the calculator on its defaults.
  const found = decodeFields({ evil: 'x', class: '3A' }, ['class']);
  assert.deepEqual(found, { class: '3A' });
});

test('buildShareUrl omits the question mark when nothing has changed', () => {
  const defaults = { class: 'SL', km: '500' };
  assert.equal(
    buildShareUrl('https://railmonk.com', '/rail/train-fare-calculator', { class: 'SL', km: '500' }, defaults),
    'https://railmonk.com/rail/train-fare-calculator',
  );
});

test('buildShareUrl produces an absolute, reopenable link', () => {
  assert.equal(
    buildShareUrl('https://railmonk.com', '/rail/train-fare-calculator', { class: '2A', km: '1400' }, { class: 'SL', km: '500' }),
    'https://railmonk.com/rail/train-fare-calculator?class=2A&km=1400',
  );
});

test('round trip: encode then decode returns the changed fields', () => {
  const defaults = { code: 'GNWL', n: '12', days: '12', peak: '' };
  const fields = { code: 'RLWL', n: '45', days: '12', peak: '1' };
  const query = Object.fromEntries(new URLSearchParams(encodeFields(fields, defaults)));
  assert.deepEqual(decodeFields(query, Object.keys(defaults)), { code: 'RLWL', n: '45', peak: '1' });
});
