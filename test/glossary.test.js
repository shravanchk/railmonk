const test = require('node:test');
const assert = require('node:assert/strict');
const { CATEGORIES, TERMS, getTerm, termsInCategory, relatedTerms } = require('../utils/glossary');
const { WL_TYPES } = require('../utils/engines/waitlistChances');
const { CLASS_RULES } = require('../utils/engines/irctcCancellation');

test('every term is well-formed and slugs are unique', () => {
  const slugs = new Set();
  const categoryIds = new Set(CATEGORIES.map((c) => c.id));
  for (const t of TERMS) {
    assert.match(t.slug, /^[a-z0-9-]+$/, `${t.term} slug`);
    assert.ok(!slugs.has(t.slug), `duplicate slug ${t.slug}`);
    slugs.add(t.slug);
    assert.ok(categoryIds.has(t.category), `${t.slug}: unknown category ${t.category}`);
    assert.ok(t.short.length > 40, `${t.slug}: short is too short`);
    assert.ok(Array.isArray(t.body) && t.body.length >= 2, `${t.slug}: needs at least two paragraphs`);
    assert.ok(t.body.every((p) => typeof p === 'string' && p.length > 60), `${t.slug}: thin paragraph`);
    assert.ok(t.tool?.href?.startsWith('/'), `${t.slug}: tool link`);
  }
});

test('every related slug resolves to a real term', () => {
  for (const t of TERMS) {
    for (const r of t.related) assert.ok(getTerm(r), `${t.slug} → ${r} does not exist`);
    assert.ok(!t.related.includes(t.slug), `${t.slug} relates to itself`);
    assert.equal(relatedTerms(t).length, t.related.length);
  }
});

test('every category has entries', () => {
  for (const c of CATEGORIES) assert.ok(termsInCategory(c.id).length > 0, `${c.id} is empty`);
});

test('waitlist entries are read from the waitlist engine, not restated', () => {
  for (const code of ['GNWL', 'RLWL', 'PQWL', 'RSWL', 'TQWL', 'RAC']) {
    const engine = WL_TYPES.find((w) => w.code === code);
    const term = getTerm(code.toLowerCase());
    assert.ok(term, `${code} missing`);
    assert.equal(term.fullForm, engine.name);
    assert.ok(term.body.includes(engine.meaning), `${code} body must carry the engine meaning`);
  }
});

test('class flat charges quoted in prose match the cancellation engine', () => {
  for (const [code, slug] of [['1A', '1a'], ['2A', '2a'], ['3A', '3a'], ['SL', 'sl'], ['2S', '2s']]) {
    const text = getTerm(slug).body.join(' ');
    assert.ok(text.includes(`₹${CLASS_RULES[code].flat}`), `${slug} should quote ₹${CLASS_RULES[code].flat}`);
  }
});
