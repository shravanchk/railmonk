// Per-class cancellation charge pages — the data behind
// /rail/cancellation-charges and /rail/cancellation-charges/<class>.
//
// Nothing here restates a rupee figure. Every charge, slab and worked example
// is computed by `utils/engines/irctcCancellation.js`, the same engine the
// refund calculator runs, so the page for "3AC cancellation charges" can never
// quote a number the calculator would disagree with.
//
// CommonJS, like the engines, so the tests and the sitemap check can require it.

const {
  CLASS_RULES,
  GST_RATE,
  CLERKAGE,
  flatChargePerPassenger,
  clerkagePerPassenger,
  computeCancellationRefund,
} = require('./engines/irctcCancellation');

/**
 * One page per charge class. `classCode` is the engine's key; `covers` lists
 * the booking classes that share that charge table, because the refund rules
 * group CC and 3E with 3A, and EC with 1A.
 */
const CLASS_PAGES = [
  {
    slug: 'sleeper-sl',
    classCode: 'SL',
    name: 'Sleeper (SL)',
    shortName: 'Sleeper',
    covers: ['SL'],
    aliases: ['sleeper class', 'SL', 'sleeper ticket', 'non-AC sleeper'],
    exampleFares: [400, 800, 1500],
  },
  {
    slug: 'ac-3-tier-3a',
    classCode: '3A',
    name: 'AC 3-Tier (3A / 3AC)',
    shortName: '3AC',
    covers: ['3A', 'CC', '3E'],
    aliases: ['3AC', '3A', 'AC 3 tier', 'third AC', 'AC chair car', 'CC', 'AC 3 economy', '3E'],
    exampleFares: [800, 1500, 2500],
  },
  {
    slug: 'ac-2-tier-2a',
    classCode: '2A',
    name: 'AC 2-Tier (2A / 2AC)',
    shortName: '2AC',
    covers: ['2A'],
    aliases: ['2AC', '2A', 'AC 2 tier', 'second AC'],
    exampleFares: [1500, 2500, 4000],
  },
  {
    slug: 'ac-first-1a',
    classCode: '1A',
    name: 'AC First Class (1A) & Executive Chair Car (EC)',
    shortName: '1AC',
    covers: ['1A', 'EC'],
    aliases: ['1AC', '1A', 'AC first class', 'first AC', 'executive chair car', 'EC', 'Vande Bharat executive'],
    exampleFares: [2500, 4000, 6000],
  },
  {
    slug: 'second-sitting-2s',
    classCode: '2S',
    name: 'Second Sitting (2S)',
    shortName: '2S',
    covers: ['2S'],
    aliases: ['2S', 'second sitting', 'sitting class', 'reserved seat non-AC'],
    exampleFares: [150, 300, 500],
  },
];

const PAGE_INDEX = Object.fromEntries(CLASS_PAGES.map((p) => [p.slug, p]));
const getClassPage = (slug) => PAGE_INDEX[slug] || null;

/**
 * The time slabs for a confirmed, non-Tatkal ticket. `hours` is a
 * representative cancellation time inside each slab, used for the examples.
 */
const SLABS = [
  { id: 'before-72-hours', label: 'More than 72 hours before departure', hours: 96, rule: 'flat' },
  { id: '72-to-24-hours', label: 'Between 72 and 24 hours before departure', hours: 48, rule: 'slab-25' },
  { id: '24-to-8-hours', label: 'Between 24 and 8 hours before departure', hours: 12, rule: 'slab-50' },
  { id: 'under-8-hours', label: 'Less than 8 hours before departure', hours: 4, rule: 'no-refund' },
];

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Everything the page renders for one class: the flat charge with and without
 * GST, the clerkage, and each slab's outcome at each example fare.
 */
const chargeTable = (page) => {
  const rule = CLASS_RULES[page.classCode];
  const flatWithGst = flatChargePerPassenger(page.classCode);
  const clerkage = clerkagePerPassenger();

  const slabs = SLABS.map((slab) => ({
    ...slab,
    examples: page.exampleFares.map((fare) => {
      const r = computeCancellationRefund({
        classCode: page.classCode,
        ticketType: 'confirmed',
        fare,
        hoursBeforeDeparture: slab.hours,
      });
      return { fare, deduction: r.deduction, refund: r.refund, minChargeApplied: r.minChargeApplied, rule: r.rule };
    }),
  }));

  const racWl = page.exampleFares.map((fare) => {
    const r = computeCancellationRefund({ classCode: page.classCode, ticketType: 'waitlisted', fare, hoursBeforeDeparture: 24 });
    return { fare, deduction: r.deduction, refund: r.refund };
  });

  // The fare at which the 25% slab stops being "just the flat charge": below
  // it the minimum applies, above it the percentage bites. Worth stating
  // because it is the number that decides whether cancelling early matters.
  const breakEven25 = round2(flatWithGst / 0.25);
  const breakEven50 = round2(flatWithGst / 0.5);

  return {
    classCode: page.classCode,
    label: rule.label,
    flat: rule.flat,
    gstApplies: rule.gst,
    gstRatePercent: GST_RATE * 100,
    flatWithGst,
    clerkageBase: CLERKAGE,
    clerkage,
    slabs,
    racWl,
    breakEven25,
    breakEven50,
  };
};

module.exports = { CLASS_PAGES, SLABS, getClassPage, chargeTable };
