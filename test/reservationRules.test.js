const test = require('node:test');
const assert = require('node:assert/strict');

const {
  VERIFIED,
  STALE_AFTER_DAYS,
  REGIONS,
  REQUIREMENTS,
  SERVICES,
  getService,
  servicesInRegion,
  requirementOf,
  compulsoryServices,
  acceptsPass,
  reservationCost,
  formatFee,
  verdict,
} = require('../utils/engines/reservationRules');

// --- Table integrity ---

test('every service resolves by id and sits in a declared region', () => {
  const regionIds = new Set(REGIONS.map((r) => r.id));
  SERVICES.forEach((s) => {
    assert.equal(getService(s.id), s, `${s.id} does not resolve`);
    assert.ok(regionIds.has(s.region), `${s.id} has unknown region ${s.region}`);
  });
});

test('service ids are unique', () => {
  const ids = SERVICES.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every service declares a known requirement level', () => {
  SERVICES.forEach((s) => {
    assert.ok(REQUIREMENTS[s.requirement], `${s.id} has unknown requirement ${s.requirement}`);
    assert.ok(requirementOf(s).severity >= 0);
  });
});

test('every service carries a note and a source', () => {
  SERVICES.forEach((s) => {
    assert.ok(s.note && s.note.length > 40, `${s.id} has no useful note`);
    assert.ok(s.source?.url?.startsWith('https://'), `${s.id} has no source url`);
  });
});

test('fee ranges are ordered and never negative', () => {
  SERVICES.forEach((s) => {
    [s.passFee, s.ticketFee].filter(Boolean).forEach((f) => {
      assert.ok(f.min >= 0, `${s.id} has a negative fee`);
      assert.ok(f.max >= f.min, `${s.id} has an inverted fee range`);
      assert.ok(f.currency, `${s.id} has a fee with no currency`);
    });
  });
});

test('a service with no reservation system carries no fee', () => {
  SERVICES.filter((s) => s.requirement === 'none').forEach((s) => {
    assert.equal(s.passFee, null, `${s.id} claims no reservations but prices one`);
    assert.equal(s.ticketFee, null, `${s.id} claims no reservations but prices one`);
  });
});

test('every region has at least one service', () => {
  REGIONS.forEach((r) => {
    assert.ok(servicesInRegion(r.id).length > 0, `region ${r.id} is empty`);
  });
});

// --- The facts the tool exists to get right ---

test('the French and Spanish high-speed services are compulsory and quota-limited', () => {
  ['tgv-inoui', 'renfe-ave', 'eurostar'].forEach((id) => {
    const s = getService(id);
    assert.equal(s.requirement, 'compulsory', `${id} should be compulsory`);
    assert.equal(s.quotaLimited, true, `${id} should be quota-limited`);
  });
});

test('German and Swiss domestic travel is not compulsory — the core pass-value fact', () => {
  assert.equal(getService('db-ice').requirement, 'recommended');
  assert.equal(getService('sbb-domestic').requirement, 'none');
  assert.equal(getService('db-regional').requirement, 'none');
});

test('Italo and OUIGO do not accept passes; everything else does', () => {
  assert.equal(acceptsPass(getService('italo')), false);
  assert.equal(acceptsPass(getService('ouigo-fr')), false);
  assert.equal(acceptsPass(getService('tgv-inoui')), true);
});

test('UK reservations are free rather than absent', () => {
  const uk = getService('uk-domestic');
  assert.equal(uk.requirement, 'optional');
  assert.equal(formatFee(uk.passFee), 'free');
});

test('compulsoryServices returns only compulsory entries, and there are several', () => {
  const list = compulsoryServices();
  assert.ok(list.length >= 5);
  list.forEach((s) => assert.equal(s.requirement, 'compulsory'));
});

// --- Cost arithmetic ---

test('euro fees sum into a range across several services', () => {
  const r = reservationCost({ serviceIds: ['tgv-inoui', 'frecciarossa'], passHolder: true });
  assert.equal(r.eur.min, 10 + 13);
  assert.equal(r.eur.max, 20 + 13);
});

test('currencies are kept apart rather than silently converted', () => {
  const r = reservationCost({ serviceIds: ['tgv-inoui', 'glacier-bernina', 'sj-highspeed'] });
  assert.deepEqual(Object.keys(r.byCurrency).sort(), ['CHF', 'EUR', 'SEK']);
  assert.equal(r.eur.min, 10);
  assert.equal(r.byCurrency.CHF.min, 24);
});

test('services with no reservation contribute nothing', () => {
  const r = reservationCost({ serviceIds: ['sbb-domestic', 'db-regional', 'ter'] });
  assert.deepEqual(r.byCurrency, {});
  assert.deepEqual(r.eur, { min: 0, max: 0 });
});

test('a pass-refusing operator is reported, not counted as free', () => {
  const r = reservationCost({ serviceIds: ['italo'], passHolder: true });
  assert.equal(r.notCovered.length, 1);
  assert.equal(r.notCovered[0].id, 'italo');
  assert.deepEqual(r.eur, { min: 0, max: 0 });
});

test('a compulsory service with the fee inside the fare is flagged as unpriced', () => {
  const r = reservationCost({ serviceIds: ['eurostar'], passHolder: false });
  assert.equal(r.unpriced.length, 1);
  assert.equal(r.unpriced[0].id, 'eurostar');
});

test('unknown service ids are ignored rather than throwing', () => {
  const r = reservationCost({ serviceIds: ['not-a-train', 'tgv-inoui'] });
  assert.equal(r.eur.min, 10);
});

test('an empty selection costs nothing', () => {
  const r = reservationCost({ serviceIds: [] });
  assert.deepEqual(r.eur, { min: 0, max: 0 });
  assert.deepEqual(r.unpriced, []);
});

// --- Formatting and verdicts ---

test('a single-value fee renders as one number and a range as two', () => {
  assert.equal(formatFee({ currency: 'EUR', min: 13, max: 13 }), '€13');
  assert.equal(formatFee({ currency: 'EUR', min: 15, max: 120 }), '€15–120');
  assert.equal(formatFee(null), null);
});

test('non-euro currencies keep their own symbol', () => {
  assert.equal(formatFee({ currency: 'CHF', min: 24, max: 79 }), 'CHF 24–79');
  assert.equal(formatFee({ currency: 'INR', min: 20, max: 20 }), '₹20');
});

test('verdicts distinguish compulsory from optional from absent', () => {
  assert.match(verdict('tgv-inoui'), /Compulsory/);
  assert.match(verdict('db-ice'), /Optional/);
  assert.match(verdict('sbb-domestic'), /No reservation exists/);
  assert.match(verdict('italo'), /does not accept rail passes/i);
  assert.equal(verdict('nope'), null);
});

test('a quota-limited compulsory service tells you to book early', () => {
  assert.match(verdict('eurostar'), /book early/);
  assert.doesNotMatch(verdict('cp-alfa'), /book early/);
});

// --- Freshness ---
//
// These are operator prices. They move at every timetable change, and a table
// that is quietly two years old is worse than no table at all. See the note at
// the top of the engine before touching VERIFIED.

test('VERIFIED is a real ISO date and not in the future', () => {
  assert.match(VERIFIED, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(new Date(VERIFIED).getTime() <= Date.now(), 'VERIFIED is in the future');
});

test('the reservation table has been checked within STALE_AFTER_DAYS', () => {
  const ageDays = (Date.now() - new Date(VERIFIED).getTime()) / 86400000;
  assert.ok(
    ageDays <= STALE_AFTER_DAYS,
    `Reservation rules last verified ${Math.round(ageDays)} days ago (limit ${STALE_AFTER_DAYS}). ` +
      'Re-check each service against its source, then move VERIFIED in utils/engines/reservationRules.js.'
  );
});
