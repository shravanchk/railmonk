const test = require('node:test');
const assert = require('node:assert/strict');

const {
  VERIFIED,
  STALE_AFTER_DAYS,
  SCHEMES,
  getScheme,
  computeDelayCompensation,
  bandFor,
  formatDelay,
  formatMoney,
} = require('../utils/engines/delayCompensation');

// --- EU / EEA: Regulation (EU) 2021/782 ---

test('EU: under an hour is not compensated', () => {
  const r = computeDelayCompensation({ schemeId: 'eu', delayMinutes: 59, ticketPrice: 100 });
  assert.equal(r.qualifies, false);
  assert.equal(r.amount, null);
  assert.equal(r.shortfallMinutes, 1);
});

test('EU: exactly 60 minutes qualifies at 25% (band boundary is inclusive)', () => {
  const r = computeDelayCompensation({ schemeId: 'eu', delayMinutes: 60, ticketPrice: 100 });
  assert.equal(r.qualifies, true);
  assert.equal(r.percent, 25);
  assert.equal(r.amount, 25);
});

test('EU: 119 minutes is still the 25% band', () => {
  const r = computeDelayCompensation({ schemeId: 'eu', delayMinutes: 119, ticketPrice: 80 });
  assert.equal(r.percent, 25);
  assert.equal(r.amount, 20);
});

test('EU: 120 minutes crosses into the 50% band', () => {
  const r = computeDelayCompensation({ schemeId: 'eu', delayMinutes: 120, ticketPrice: 80 });
  assert.equal(r.percent, 50);
  assert.equal(r.amount, 40);
});

test('EU: a return fare is compensated on the delayed leg only', () => {
  const r = computeDelayCompensation({ schemeId: 'eu', delayMinutes: 130, ticketPrice: 200, ticketType: 'return' });
  assert.equal(r.basisAmount, 100);
  assert.equal(r.amount, 50);
});

test('EU: payouts under the EUR 4 threshold are flagged, not promised', () => {
  const r = computeDelayCompensation({ schemeId: 'eu', delayMinutes: 65, ticketPrice: 12 });
  assert.equal(r.amount, 3);
  assert.equal(r.belowMinimum, true);
});

test('EU: a payout at the threshold itself is payable', () => {
  const r = computeDelayCompensation({ schemeId: 'eu', delayMinutes: 65, ticketPrice: 16 });
  assert.equal(r.amount, 4);
  assert.equal(r.belowMinimum, false);
});

test('EU: the next band is reported so the page can show how close it is', () => {
  const r = computeDelayCompensation({ schemeId: 'eu', delayMinutes: 100, ticketPrice: 100 });
  assert.equal(r.nextBand.percent, 50);
  assert.equal(r.minutesToNextBand, 20);
});

test('EU: nothing is owed at zero delay, and the shortfall is the full hour', () => {
  const r = computeDelayCompensation({ schemeId: 'eu', delayMinutes: 0, ticketPrice: 100 });
  assert.equal(r.qualifies, false);
  assert.equal(r.shortfallMinutes, 60);
});

// --- Great Britain: Delay Repay ---

test('DR15: 15 minutes pays 25% of the single fare', () => {
  const r = computeDelayCompensation({ schemeId: 'uk-dr15', delayMinutes: 15, ticketPrice: 40 });
  assert.equal(r.percent, 25);
  assert.equal(r.amount, 10);
});

test('DR15: 30–59 minutes pays 50%', () => {
  const r = computeDelayCompensation({ schemeId: 'uk-dr15', delayMinutes: 45, ticketPrice: 40 });
  assert.equal(r.percent, 50);
  assert.equal(r.amount, 20);
});

test('DR15: an hour pays the whole single fare', () => {
  const r = computeDelayCompensation({ schemeId: 'uk-dr15', delayMinutes: 60, ticketPrice: 40 });
  assert.equal(r.percent, 100);
  assert.equal(r.amount, 40);
});

test('DR15: at two hours a return ticket pays out on the full fare, not the leg', () => {
  const r = computeDelayCompensation({ schemeId: 'uk-dr15', delayMinutes: 120, ticketPrice: 90, ticketType: 'return' });
  assert.equal(r.band.basis, 'ticket');
  assert.equal(r.basisAmount, 90);
  assert.equal(r.amount, 90);
});

test('DR15: below two hours a return ticket is halved to the delayed leg', () => {
  const r = computeDelayCompensation({ schemeId: 'uk-dr15', delayMinutes: 65, ticketPrice: 90, ticketType: 'return' });
  assert.equal(r.basisAmount, 45);
  assert.equal(r.amount, 45);
});

test('DR30: a 20-minute delay pays nothing, and the shortfall points at the threshold', () => {
  const r = computeDelayCompensation({ schemeId: 'uk-dr30', delayMinutes: 20, ticketPrice: 40 });
  assert.equal(r.qualifies, false);
  assert.equal(r.shortfallMinutes, 10);
});

test('DR30: the same 20-minute delay would have paid under DR15', () => {
  const r = computeDelayCompensation({ schemeId: 'uk-dr15', delayMinutes: 20, ticketPrice: 40 });
  assert.equal(r.qualifies, true);
  assert.equal(r.amount, 10);
});

// --- Eurostar: cash or a larger voucher ---

test('Eurostar: 60–119 minutes offers 25% cash or a 30% voucher', () => {
  const r = computeDelayCompensation({ schemeId: 'eurostar', delayMinutes: 90, ticketPrice: 200 });
  assert.equal(r.amount, 50);
  assert.equal(r.voucherAmount, 60);
});

test('Eurostar: three hours raises the voucher to 75% but leaves cash at 50%', () => {
  const r = computeDelayCompensation({ schemeId: 'eurostar', delayMinutes: 200, ticketPrice: 200 });
  assert.equal(r.amount, 100);
  assert.equal(r.voucherAmount, 150);
});

// --- Switzerland ---

test('Switzerland: 25% at an hour, with a CHF 5 floor below which nothing is paid', () => {
  const r = computeDelayCompensation({ schemeId: 'ch', delayMinutes: 75, ticketPrice: 16 });
  assert.equal(r.amount, 4);
  assert.equal(r.belowMinimum, true);
});

test('Switzerland: 50% at two hours', () => {
  const r = computeDelayCompensation({ schemeId: 'ch', delayMinutes: 121, ticketPrice: 60 });
  assert.equal(r.amount, 30);
  assert.equal(r.belowMinimum, false);
});

// --- Discretionary schemes must never invent a number ---

test('US: no statutory band, so no amount is produced however long the delay', () => {
  const r = computeDelayCompensation({ schemeId: 'us', delayMinutes: 300, ticketPrice: 200 });
  assert.equal(r.kind, 'discretionary');
  assert.equal(r.qualifies, false);
  assert.equal(r.amount, null);
  assert.equal(r.percent, null);
});

test('Australia: likewise returns guidance rather than an entitlement', () => {
  const r = computeDelayCompensation({ schemeId: 'au', delayMinutes: 180, ticketPrice: 150 });
  assert.equal(r.kind, 'discretionary');
  assert.equal(r.amount, null);
});

test('discretionary schemes carry what to ask for and what to keep', () => {
  ['us', 'au'].forEach((id) => {
    const scheme = getScheme(id);
    assert.ok(scheme.asks.length > 0, `${id} should list what to ask for`);
    assert.ok(scheme.evidence.length > 0, `${id} should list supporting evidence`);
  });
});

// --- Input handling ---

test('an unknown scheme returns null rather than a default', () => {
  assert.equal(computeDelayCompensation({ schemeId: 'nope', delayMinutes: 90, ticketPrice: 10 }), null);
});

test('a missing or negative delay returns null', () => {
  assert.equal(computeDelayCompensation({ schemeId: 'eu', delayMinutes: '', ticketPrice: 10 }), null);
  assert.equal(computeDelayCompensation({ schemeId: 'eu', delayMinutes: -5, ticketPrice: 10 }), null);
});

test('the band is still resolved when no ticket price has been entered', () => {
  const r = computeDelayCompensation({ schemeId: 'eu', delayMinutes: 150 });
  assert.equal(r.qualifies, true);
  assert.equal(r.percent, 50);
  assert.equal(r.amount, null);
});

test('money is rounded to the cent, not left with a floating-point tail', () => {
  const r = computeDelayCompensation({ schemeId: 'eu', delayMinutes: 60, ticketPrice: 33.33 });
  assert.equal(r.amount, 8.33);
});

// --- Scheme data integrity ---

test('every scheme carries a source and a coverage statement', () => {
  SCHEMES.forEach((scheme) => {
    assert.ok(scheme.sources.length > 0, `${scheme.id} has no source`);
    scheme.sources.forEach((s) => assert.match(s.url, /^https:\/\//, `${scheme.id} source must be https`));
    assert.ok(scheme.coverage, `${scheme.id} has no coverage statement`);
  });
});

test('bands within a scheme are contiguous and ascending', () => {
  SCHEMES.filter((s) => s.bands.length).forEach((scheme) => {
    scheme.bands.forEach((band, i) => {
      if (i === 0) return;
      assert.equal(band.from, scheme.bands[i - 1].to, `${scheme.id} has a gap or overlap at band ${i}`);
    });
    assert.equal(scheme.bands[scheme.bands.length - 1].to, null, `${scheme.id} must have an open-ended top band`);
  });
});

test('every minute from zero to five hours resolves to at most one band', () => {
  SCHEMES.filter((s) => s.bands.length).forEach((scheme) => {
    for (let m = 0; m <= 300; m += 1) {
      const matches = scheme.bands.filter((b) => m >= b.from && (b.to === null || m < b.to));
      assert.ok(matches.length <= 1, `${scheme.id} has overlapping bands at ${m} minutes`);
      assert.equal(bandFor(scheme, m), matches[0] || null);
    }
  });
});

// --- Formatting ---

test('delays read as hours and minutes', () => {
  assert.equal(formatDelay(45), '45 min');
  assert.equal(formatDelay(60), '1 h');
  assert.equal(formatDelay(135), '2 h 15 min');
});

test('money drops the decimals when there are none to show', () => {
  assert.equal(formatMoney(25, '€'), '€25');
  assert.equal(formatMoney(8.33, '€'), '€8.33');
  assert.equal(formatMoney(null, '€'), null);
});

// --- Freshness ---

test('the compensation rules have been re-checked within the last year', () => {
  // These percentages and deadlines decide what someone is told they are owed.
  // Going quietly stale is the failure mode that matters, so it fails the build
  // instead. Re-check each scheme's sources, then move VERIFIED.
  const ageDays = Math.floor((Date.now() - Date.parse(VERIFIED)) / (24 * 60 * 60 * 1000));
  assert.ok(
    ageDays <= STALE_AFTER_DAYS,
    `delay-compensation rules were last verified ${ageDays} days ago (limit ${STALE_AFTER_DAYS}). ` +
      'Re-check each scheme against its sources, then update VERIFIED in utils/engines/delayCompensation.js.'
  );
});

test('the verified date is a real past date, not a placeholder', () => {
  assert.match(VERIFIED, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(Date.parse(VERIFIED) <= Date.now(), 'VERIFIED cannot be in the future');
});
