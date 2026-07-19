const test = require('node:test');
const assert = require('node:assert/strict');
const { RAKE_TYPES, locateCoach, normalizeCode, zoneOf } = require('../utils/engines/coachPosition');

test('rake types all carry id, label, note, and a coach list', () => {
  assert.equal(RAKE_TYPES.length, 4);
  RAKE_TYPES.forEach((r) => {
    assert.ok(r.id && r.label && r.note);
    assert.ok(Array.isArray(r.coaches) && r.coaches.length >= 8);
  });
});

test('exact coach match returns its slot and zone', () => {
  const r = locateCoach({ rakeTypeId: 'mail-express', coachCode: 'S1' });
  assert.equal(r.exact, true);
  assert.equal(r.code, 'S1');
  assert.equal(r.zone, 'front');
  const h = locateCoach({ rakeTypeId: 'mail-express', coachCode: 'H1' });
  assert.equal(h.zone, 'rear');
});

test('input is normalized (case, spaces, hyphens)', () => {
  const r = locateCoach({ rakeTypeId: 'rajdhani', coachCode: ' b-4 ' });
  assert.equal(r.code, 'B4');
  assert.equal(r.exact, true);
  assert.equal(normalizeCode('s 12'), 'S12');
});

test('beyond-rake coach falls back to the end of its block with a note', () => {
  const r = locateCoach({ rakeTypeId: 'mail-express', coachCode: 'S11' });
  assert.equal(r.exact, false);
  assert.ok(r.note.includes('S11'));
  const s8 = locateCoach({ rakeTypeId: 'mail-express', coachCode: 'S8' });
  assert.equal(r.index, s8.index);
});

test('unknown prefix or rake type returns null', () => {
  assert.equal(locateCoach({ rakeTypeId: 'mail-express', coachCode: 'X9' }), null);
  assert.equal(locateCoach({ rakeTypeId: 'nope', coachCode: 'S1' }), null);
  assert.equal(locateCoach({ rakeTypeId: 'mail-express', coachCode: '' }), null);
});

test('zoneOf splits the rake into thirds', () => {
  assert.equal(zoneOf(0, 15), 'front');
  assert.equal(zoneOf(7, 15), 'middle');
  assert.equal(zoneOf(14, 15), 'rear');
});

test('vande bharat has no loco and positions C-coaches directly', () => {
  const r = locateCoach({ rakeTypeId: 'vande-bharat', coachCode: 'C8' });
  assert.equal(r.exact, true);
  assert.equal(r.zone, 'rear');
  assert.equal(r.percentFromFront, 100);
});
