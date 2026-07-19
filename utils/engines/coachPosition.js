// Coach position finder: where a coach typically stands in the rake, front
// (engine end) to rear. Indian Railways does not run one fixed composition —
// every train's rake order is set by its operating zone and can differ by day.
// These are REPRESENTATIVE compositions of the common rake families, and the
// UI must present positions as "typical", pointing to the station's coach
// position display / NTES for the authoritative order on the day.

const RAKE_TYPES = [
  {
    id: 'mail-express',
    label: 'Mail / Express (ICF & LHB mixed)',
    note: 'The classic long-distance rake: general coaches at both ends, sleeper block behind them, AC block together past the pantry. Zones shuffle the AC block between middle and rear, so treat the zone, not the exact slot, as the answer.',
    // Front (engine) → rear.
    coaches: ['SLR', 'GEN', 'GEN', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'PC', 'M1', 'M2', 'B3', 'B2', 'B1', 'A2', 'A1', 'H1', 'GEN', 'SLR']
  },
  {
    id: 'rajdhani',
    label: 'Rajdhani / Duronto (all-AC LHB)',
    note: 'All-AC rakes bracketed by generator/luggage (EOG) cars. First AC sits nearest one EOG, then 2A, pantry, and the long 3A block.',
    coaches: ['EOG', 'H1', 'A1', 'A2', 'A3', 'PC', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'EOG']
  },
  {
    id: 'shatabdi',
    label: 'Shatabdi / Jan Shatabdi (chair car)',
    note: 'Day trains: Executive chair cars (E) near one end, the AC chair-car block (C) filling the rest, EOG cars at both ends.',
    coaches: ['EOG', 'E1', 'E2', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'EOG']
  },
  {
    id: 'vande-bharat',
    label: 'Vande Bharat (8-car)',
    note: 'A self-propelled trainset — no separate locomotive. Coaches run C1 to C8 with driving cabs at both ends; the executive coaches are mid-rake. The 16-car version extends the same numbering to C16.',
    coaches: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8']
  }
];

const COACH_CODE_MEANINGS = {
  S: 'Sleeper (SL)',
  B: 'AC 3-Tier (3A)',
  M: 'AC 3-Tier Economy (3E)',
  A: 'AC 2-Tier (2A)',
  H: 'AC First (1A)',
  E: 'Executive Chair Car (EC)',
  C: 'AC Chair Car (CC)',
  D: 'Second Sitting reserved (2S)',
  GEN: 'General / unreserved',
  SLR: 'Seating-cum-luggage & guard',
  EOG: 'Generator / luggage car',
  PC: 'Pantry car'
};

const getRakeType = (id) => RAKE_TYPES.find((r) => r.id === id) || null;

const normalizeCode = (raw) => String(raw || '').toUpperCase().replace(/[\s-]+/g, '');

const zoneOf = (index, total) => {
  const frac = index / (total - 1 || 1);
  if (frac <= 1 / 3) return 'front';
  if (frac <= 2 / 3) return 'middle';
  return 'rear';
};

const ZONE_TEXT = {
  front: 'Front third of the platform — walk toward the engine end.',
  middle: 'Middle of the platform — stand near the central footbridge/stairs.',
  rear: 'Rear third of the platform — away from the engine end.'
};

/**
 * locateCoach({ rakeTypeId, coachCode }) →
 *   { code, index (0-based), total, zone, zoneText, percentFromFront, exact, note } | null
 * Falls back to the same-prefix block when the exact number is not in the
 * representative rake (e.g. S11 on a longer sleeper block).
 */
const locateCoach = ({ rakeTypeId, coachCode }) => {
  const rake = getRakeType(rakeTypeId);
  const code = normalizeCode(coachCode);
  if (!rake || !code) return null;

  const total = rake.coaches.length;
  const exactIdx = rake.coaches.indexOf(code);
  if (exactIdx !== -1) {
    return {
      code,
      index: exactIdx,
      total,
      zone: zoneOf(exactIdx, total),
      zoneText: ZONE_TEXT[zoneOf(exactIdx, total)],
      percentFromFront: Math.round((exactIdx / (total - 1)) * 100),
      exact: true,
      note: null
    };
  }

  // Same-prefix fallback: S11 lands at the rear edge of the S block.
  const prefix = code.match(/^[A-Z]+/)?.[0];
  if (!prefix) return null;
  const blockIdxs = rake.coaches
    .map((c, i) => (c.match(/^[A-Z]+/)?.[0] === prefix && /\d/.test(c) ? i : -1))
    .filter((i) => i !== -1);
  if (!blockIdxs.length) return null;

  const idx = blockIdxs[blockIdxs.length - 1];
  return {
    code,
    index: idx,
    total,
    zone: zoneOf(idx, total),
    zoneText: ZONE_TEXT[zoneOf(idx, total)],
    percentFromFront: Math.round((idx / (total - 1)) * 100),
    exact: false,
    note: `${code} is beyond this representative rake's ${COACH_CODE_MEANINGS[prefix] || prefix} block — on longer rakes it continues in the same block, so expect it around this zone.`
  };
};

module.exports = { RAKE_TYPES, COACH_CODE_MEANINGS, getRakeType, locateCoach, normalizeCode, zoneOf };
