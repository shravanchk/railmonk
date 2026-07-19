const test = require('node:test');
const assert = require('node:assert/strict');
const { CLASSES, estimateFare, slBaseFare } = require('../utils/engines/trainFare');

test('classes table covers the eight reserved classes', () => {
  assert.deepEqual(Object.keys(CLASSES).sort(), ['1A', '2A', '2S', '3A', '3E', 'CC', 'EC', 'SL'].sort());
});

test('base fare is telescopic: per-km rate falls with distance', () => {
  const short = slBaseFare(400) / 400;
  const long = slBaseFare(2000) / 2000;
  assert.ok(long < short);
});

test('fare ordering across classes holds at a fixed distance', () => {
  const at = (c) => estimateFare({ classCode: c, distanceKm: 800 }).totalPerPassenger;
  assert.ok(at('1A') > at('2A') && at('2A') > at('3A') && at('3A') > at('SL') && at('SL') > at('2S'));
});

test('sanity anchor: SL ~300 km superfast lands in the real-world band', () => {
  const r = estimateFare({ classCode: 'SL', distanceKm: 309, trainCategory: 'superfast' });
  assert.ok(r.totalPerPassenger >= 150 && r.totalPerPassenger <= 260, `got ₹${r.totalPerPassenger}`);
});

test('sanity anchor: 3A ~1400 km superfast lands in the real-world band', () => {
  const r = estimateFare({ classCode: '3A', distanceKm: 1384, trainCategory: 'superfast' });
  assert.ok(r.totalPerPassenger >= 1300 && r.totalPerPassenger <= 1800, `got ₹${r.totalPerPassenger}`);
});

test('express category drops the superfast charge', () => {
  const sf = estimateFare({ classCode: 'SL', distanceKm: 500, trainCategory: 'superfast' });
  const ex = estimateFare({ classCode: 'SL', distanceKm: 500, trainCategory: 'express' });
  assert.equal(sf.superfastCharge, 30);
  assert.equal(ex.superfastCharge, 0);
  assert.ok(ex.totalPerPassenger < sf.totalPerPassenger);
});

test('GST applies only to AC classes', () => {
  assert.equal(estimateFare({ classCode: 'SL', distanceKm: 500 }).gst, 0);
  assert.equal(estimateFare({ classCode: '2S', distanceKm: 500 }).gst, 0);
  assert.ok(estimateFare({ classCode: '3A', distanceKm: 500 }).gst > 0);
});

test('premium category returns a surge ceiling above the base total', () => {
  const r = estimateFare({ classCode: '3A', distanceKm: 1000, trainCategory: 'premium' });
  assert.ok(r.surgeTotalPerPassenger > r.totalPerPassenger);
  const plain = estimateFare({ classCode: '3A', distanceKm: 1000, trainCategory: 'superfast' });
  assert.equal(plain.surgeTotalPerPassenger, null);
});

test('totals multiply per passenger and round to ₹5', () => {
  const one = estimateFare({ classCode: '2A', distanceKm: 700, passengers: 1 });
  const three = estimateFare({ classCode: '2A', distanceKm: 700, passengers: 3 });
  assert.equal(three.total, one.totalPerPassenger * 3);
  assert.equal(one.totalPerPassenger % 5, 0);
});

test('invalid inputs return null', () => {
  assert.equal(estimateFare({ classCode: 'XX', distanceKm: 500 }), null);
  assert.equal(estimateFare({ classCode: 'SL', distanceKm: 0 }), null);
  assert.equal(estimateFare({ classCode: 'SL', distanceKm: -5 }), null);
});
