import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import { AlertTriangle, Ban, Briefcase, CheckCircle2, Dog, PackageCheck, Ruler } from 'lucide-react';
import EEATPanel from '../calculator/EEATPanel';
import { editorialProfiles } from '../../utils/editorialProfiles';
import SearchLandingSections from '../calculator/SearchLandingSections';
import { buildSoftwareApplicationSchema } from '../../utils/schema';
import { CalcLayout } from '../calculator/CalcLayout';
import HowToSection from '../calculator/HowToSection';
import Card from '../ui/Card';
import Breadcrumbs from '../ui/Breadcrumbs';
import RelatedContent from '../rail/RelatedContent';
import NextStep from '../rail/NextStep';
import ShareResult from '../rail/ShareResult';
import UpdatedStamp from '../rail/UpdatedStamp';
import useShareableInputs from '../rail/useShareableInputs';
import { getTool } from '../../utils/catalog';
import { cn } from '../ui/cn';

const HREF = '/rail/luggage-allowance';

const {
  CLASSES,
  UNDECLARED_MULTIPLIER,
  MARGINAL_MULTIPLIER,
  FREE_ITEMS,
  PROHIBITED_ITEMS,
  DANGEROUS_GOODS,
  PETS,
  assessLuggage,
} = require('../../utils/engines/luggageAllowance');

const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

const DISTANCE_PRESETS = [
  { label: 'Delhi – Jaipur', km: 309 },
  { label: 'Mumbai – Pune', km: 192 },
  { label: 'Delhi – Mumbai', km: 1384 },
  { label: 'Delhi – Chennai', km: 2180 },
];

// Tone per band, kept in one place so the headline card, the badge and the
// icon cannot end up disagreeing about how bad the news is.
const BAND_TONE = {
  free: {
    label: 'Within your free allowance',
    Icon: CheckCircle2,
    card: 'border-emerald-300 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white dark:border-emerald-800',
  },
  marginal: {
    label: 'Payable, but it can stay with you',
    Icon: PackageCheck,
    card: 'border-amber-300 bg-gradient-to-br from-amber-500 to-amber-600 text-white dark:border-amber-800',
  },
  book: {
    label: 'Must be booked into the brake van',
    Icon: AlertTriangle,
    card: 'border-orange-300 bg-gradient-to-br from-orange-500 to-orange-600 text-white dark:border-orange-800',
  },
  'over-max': {
    label: 'Above the maximum this class permits',
    Icon: Ban,
    card: 'border-rose-300 bg-gradient-to-br from-rose-600 to-rose-700 text-white dark:border-rose-900',
  },
};

const LuggageAllowanceCalculator = () => {
  const [classCode, setClassCode] = useState('SL');
  const [weightKg, setWeightKg] = useState('45');
  const [distanceKm, setDistanceKm] = useState('1000');
  const [ageYears, setAgeYears] = useState('');
  const [checkSize, setCheckSize] = useState(false);
  const [dims, setDims] = useState({ l: '', w: '', h: '' });

  const shareUrl = useShareableInputs(
    { class: classCode, kg: weightKg, km: distanceKm, age: ageYears },
    (params) => {
      if (params.class) setClassCode(params.class);
      if (params.kg) setWeightKg(params.kg);
      if (params.km) setDistanceKm(params.km);
      if (params.age) setAgeYears(params.age);
    }
  );

  const pieceCm = useMemo(() => {
    if (!checkSize) return null;
    const values = [dims.l, dims.w, dims.h].map((d) => parseFloat(d));
    return values.every((v) => Number.isFinite(v) && v > 0) ? values : null;
  }, [checkSize, dims]);

  const result = useMemo(
    () =>
      assessLuggage({
        classCode,
        weightKg: parseFloat(weightKg),
        distanceKm: parseFloat(distanceKm) || 0,
        ageYears: ageYears === '' ? null : parseInt(ageYears, 10),
        pieceCm,
      }),
    [classCode, weightKg, distanceKm, ageYears, pieceCm]
  );

  const tone = result ? BAND_TONE[result.band] : null;

  const seoFaqItems = [
    {
      question: 'How much luggage is allowed in a train in India?',
      answer:
        'It depends on the class, and there are three separate numbers rather than one. Sleeper gives a 40 kg free allowance, a 10 kg marginal band above it, and an 80 kg ceiling. AC 3-Tier and Chair Car give 40 kg free with a 40 kg ceiling — no headroom at all. AC 2-Tier is 50 kg free and 100 kg maximum; AC First is 70 kg free and 150 kg maximum; Second Sitting is 35 kg free and 70 kg maximum. Anything over the free allowance has to be declared and paid for.',
    },
    {
      question: 'What happens if I carry more luggage than allowed?',
      answer:
        `If you declare it and book it, you pay the ordinary luggage rate — ${MARGINAL_MULTIPLIER}× that rate if you want to keep it in the compartment within the marginal band. If a ticket checker finds unbooked excess during the journey, it is charged at ${UNDECLARED_MULTIPLIER} times the luggage rate. That gap is the whole point of booking it at the parcel office beforehand: the same bag can cost six times as much simply for not having been declared.`,
    },
    {
      question: 'Is there a size limit as well as a weight limit?',
      answer:
        'Yes, and it catches people out because it is independent of weight. A single piece carried inside the coach may not exceed 100 × 60 × 25 cm in most classes, and only 55 × 45 × 22.5 cm in AC 3-Tier and AC Chair Car. A large but light box fails this test and has to go in the brake van even though the weight is well within your allowance.',
    },
    {
      question: 'Do children get a luggage allowance?',
      answer:
        'Children aged 5 to 11 get half the adult free allowance, capped at 50 kg. Children under 5 travel without any allowance of their own, so their belongings count against the accompanying adult’s limit.',
    },
    {
      question: 'What can I not carry on an Indian train at all?',
      answer:
        'Inflammable and explosive goods — petrol, kerosene, LPG cylinders, fireworks — along with acids, corrosives, compressed gases and offensive articles. These are dangerous goods under Section 164 of the Railways Act, not a luggage matter: carrying them can mean up to three years’ imprisonment, a fine, or both, plus liability for any damage caused. It applies whether or not you declared them.',
    },
    {
      question: 'Can I take my dog on the train?',
      answer:
        'Only in an AC First coupé or cabin, booked and charged as luggage, and generally only if you have taken the whole coupé — fellow passengers can object, and the dog is then moved. Otherwise dogs travel in the brake van dog box, booked in advance at the parcel office. Dogs are not permitted in AC 2-Tier, AC 3-Tier, Chair Car or Sleeper, and taking one there is treated as unbooked luggage.',
    },
    {
      question: 'Which items do not count towards the allowance?',
      answer:
        'Small personal effects kept with you — a handbag or briefcase, a tiffin carrier, a water bottle, an umbrella or walking stick, crutches or a wheelchair used by the passenger travelling with it, and bedding issued to you in AC classes. These are not weighed against your limit.',
    },
  ];

  const softwareSchema = buildSoftwareApplicationSchema({
    name: 'Train Luggage Allowance & Excess Charges Calculator',
    url: `https://railmonk.com${HREF}`,
    description:
      'Check how much luggage you may carry free by class on Indian Railways, whether a bag is within the size limit, and what unbooked excess costs at six times the luggage rate.',
    applicationCategory: 'TravelApplication',
    featureList: [
      'Free, marginal and maximum weights for all seven classes',
      'Child allowance handling',
      'Piece dimension check against the class size limit',
      'Declared versus undeclared excess charge comparison',
    ],
  });

  return (
    <>
      <Head>
        <title>Train Luggage Allowance Calculator — Weight Limits & Excess Charges | Railmonk</title>
        <meta
          name="description"
          content="How much luggage you can carry free by class, the size limit per piece, and what unbooked excess costs at six times the luggage rate."
        />
        <link rel="canonical" href={`https://railmonk.com${HREF}`} />
        <meta property="og:title" content="Train Luggage Allowance Calculator | Railmonk" />
        <meta property="og:description" content="Class-by-class free allowance, size limits, and the cost of not declaring excess luggage." />
        <meta property="og:url" content={`https://railmonk.com${HREF}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="India · Travel"
        title="Luggage Allowance & Excess Charges"
        subtitle="How much you may carry free, how big a single piece may be, and what it costs if a ticket checker finds it unbooked."
      >
        <Breadcrumbs
          className="-mt-4 mb-6"
          items={[{ name: 'Home', href: '/' }, { name: 'Rail tools', href: '/#tools' }, { name: 'Luggage allowance' }]}
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Inputs */}
          <Card className="p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-ink dark:text-white">Your journey</h2>

            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">Class</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {Object.values(CLASSES).map((cls) => {
                const active = cls.code === classCode;
                return (
                  <button
                    key={cls.code}
                    type="button"
                    onClick={() => setClassCode(cls.code)}
                    aria-pressed={active}
                    className={cn(
                      'rounded-xl border px-2 py-2 text-xs font-semibold transition',
                      active
                        ? 'border-brand-400 bg-brand-50/70 text-brand-800 shadow-sm dark:border-brand-500/70 dark:bg-brand-900/25 dark:text-brand-200'
                        : 'border-slate-200 bg-white text-ink-soft hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-600'
                    )}
                  >
                    {cls.label}
                  </button>
                );
              })}
            </div>

            <label htmlFor="lug-weight" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
              Total luggage weight (kg)
            </label>
            <input
              id="lug-weight"
              type="number"
              min="0"
              max="300"
              inputMode="decimal"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-brand-900/40"
            />

            <label htmlFor="lug-distance" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
              Journey distance (km)
            </label>
            <input
              id="lug-distance"
              type="number"
              min="0"
              max="4500"
              inputMode="numeric"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-brand-900/40"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DISTANCE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setDistanceKm(String(p.km))}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[0.7rem] font-medium text-ink-soft transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-brand-500/60"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <label htmlFor="lug-age" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
              Passenger age (optional)
            </label>
            <input
              id="lug-age"
              type="number"
              min="0"
              max="120"
              inputMode="numeric"
              placeholder="Adult"
              value={ageYears}
              onChange={(e) => setAgeYears(e.target.value)}
              className="mt-2 w-28 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-brand-900/40"
            />
            <p className="mt-1.5 text-xs text-ink-muted dark:text-slate-400">Ages 5–11 get half the allowance, capped at 50 kg.</p>

            <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-700/60">
              <label className="flex items-center gap-2 text-sm font-medium text-ink-soft dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={checkSize}
                  onChange={(e) => setCheckSize(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800"
                />
                Also check a single piece against the size limit
              </label>
              {checkSize ? (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    ['l', 'Length'],
                    ['w', 'Width'],
                    ['h', 'Height'],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label htmlFor={`lug-${key}`} className="block text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
                        {label} (cm)
                      </label>
                      <input
                        id={`lug-${key}`}
                        type="number"
                        min="1"
                        inputMode="decimal"
                        value={dims[key]}
                        onChange={(e) => setDims((d) => ({ ...d, [key]: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-brand-900/40"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>

          {/* Result */}
          <div className="space-y-5 lg:col-span-3">
            {result ? (
              <>
                <Card className={cn('overflow-hidden p-5', tone.card)}>
                  <div className="flex items-start gap-3">
                    <tone.Icon size={28} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                        {result.allowance.label} · {result.weightKg} kg
                      </p>
                      <p className="mt-1 font-display text-2xl font-bold leading-tight">{tone.label}</p>
                      <p className="mt-2 text-sm text-white/90">{result.verdict}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="font-display text-base font-bold text-ink dark:text-white">
                    Your allowance in {result.allowance.label}
                  </h3>
                  <div className="mt-2 divide-y divide-slate-100 text-sm dark:divide-slate-700/60">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-ink-soft dark:text-slate-300">Free allowance</span>
                      <span className="font-medium text-ink dark:text-white">{result.allowance.free} kg</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-ink-soft dark:text-slate-300">May stay in the compartment up to</span>
                      <span className="font-medium text-ink dark:text-white">
                        {result.allowance.hasMarginalHeadroom ? `${result.allowance.marginalCeiling} kg` : 'no headroom'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-ink-soft dark:text-slate-300">Maximum permitted</span>
                      <span className="font-medium text-ink dark:text-white">{result.allowance.max} kg</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-ink-soft dark:text-slate-300">Over your free allowance by</span>
                      <span className="font-medium text-ink dark:text-white">
                        {result.excessKg > 0 ? `${result.excessKg} kg` : '—'}
                      </span>
                    </div>
                  </div>
                </Card>

                {result.band !== 'free' ? (
                  <Card className="p-5">
                    <h3 className="font-display text-base font-bold text-ink dark:text-white">What the excess costs</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-800/60 dark:bg-emerald-900/20">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                          Booked at the parcel office
                        </p>
                        <p className="mt-1 font-display text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                          {result.declaredCharge > 0 ? rupees(result.declaredCharge) : '—'}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-emerald-800/80 dark:text-emerald-200/80">
                          {result.band === 'marginal'
                            ? `The marginal band is charged at ${MARGINAL_MULTIPLIER}× the ordinary luggage rate, and the bag stays with you.`
                            : 'The ordinary luggage rate, booked into the brake van before departure.'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/60 dark:bg-rose-950/30">
                        <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                          Found unbooked on the train
                        </p>
                        <p className="mt-1 font-display text-2xl font-bold text-rose-800 dark:text-rose-200">
                          {rupees(result.undeclaredPenalty)}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-rose-800/80 dark:text-rose-200/80">
                          {UNDECLARED_MULTIPLIER}× the ordinary luggage rate. The same bag, charged for not having been declared.
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-ink-muted dark:text-slate-400">
                      Both figures are estimates. The luggage rate is charged on a published distance-and-weight scale;
                      this models it rather than reproducing the full tariff table, so treat the amounts as planning
                      numbers and the multipliers as the rule.
                    </p>
                  </Card>
                ) : null}

                {result.sizeNote ? (
                  <Card className={cn('p-5', result.oversizePiece && 'border-orange-300 dark:border-orange-800')}>
                    <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink dark:text-white">
                      <Ruler size={18} className="text-brand-600 dark:text-brand-300" />
                      Size check
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft dark:text-slate-300">{result.sizeNote}</p>
                  </Card>
                ) : null}

                {result.notes.length ? (
                  <Card className="p-5">
                    <h3 className="font-display text-base font-bold text-ink dark:text-white">Worth knowing</h3>
                    <ul className="mt-2 space-y-2 text-sm leading-relaxed text-ink-soft dark:text-slate-300">
                      {result.notes.map((note) => (
                        <li key={note} className="flex gap-2">
                          <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                          {note}
                        </li>
                      ))}
                    </ul>
                  </Card>
                ) : null}

                <ShareResult
                  url={shareUrl}
                  title="Train luggage allowance — Railmonk"
                  text={`${result.weightKg} kg in ${result.allowance.label}: ${tone.label.toLowerCase()}.`}
                />
              </>
            ) : (
              <Card className="flex flex-col items-center justify-center p-10 text-center text-sm text-ink-muted dark:text-slate-400">
                <Briefcase size={40} className="mb-3 text-slate-300 dark:text-slate-600" />
                Enter your luggage weight to check it against the class allowance.
              </Card>
            )}
          </div>
        </div>

        {/* Full class table — the thing most people came for */}
        <Card className="mt-8 p-5">
          <h2 className="font-display text-lg font-bold text-ink dark:text-white">Luggage allowance by class</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                  <th className="py-2 pr-3 font-semibold text-ink dark:text-white">Class</th>
                  <th className="py-2 pr-3 font-semibold text-ink dark:text-white">Free</th>
                  <th className="py-2 pr-3 font-semibold text-ink dark:text-white">Marginal</th>
                  <th className="py-2 pr-3 font-semibold text-ink dark:text-white">Maximum</th>
                  <th className="py-2 font-semibold text-ink dark:text-white">Size limit per piece</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(CLASSES).map((cls) => {
                  const a = assessLuggage({ classCode: cls.code, weightKg: 0 }).allowance;
                  return (
                    <tr
                      key={cls.code}
                      className={cn(
                        'border-b border-slate-100 dark:border-slate-700/60',
                        cls.code === classCode && 'bg-brand-50/60 dark:bg-brand-900/20'
                      )}
                    >
                      <td className="py-2 pr-3 font-medium text-ink dark:text-white">{cls.label}</td>
                      <td className="py-2 pr-3 text-ink-soft dark:text-slate-300">{cls.free} kg</td>
                      <td className="py-2 pr-3 text-ink-soft dark:text-slate-300">{cls.marginal} kg</td>
                      <td className="py-2 pr-3 text-ink-soft dark:text-slate-300">
                        {cls.max} kg
                        {!a.hasMarginalHeadroom ? <span className="ml-1 text-xs text-orange-600 dark:text-orange-400">(= free)</span> : null}
                      </td>
                      <td className="py-2 text-ink-soft dark:text-slate-300">{a.sizeLimit.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-muted dark:text-slate-400">
            AC 3-Tier and AC Chair Car are the strict cases: the maximum equals the free allowance, so there is no
            in-compartment band above it, and the size limit per piece is less than half the volume allowed elsewhere.
          </p>
        </Card>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-display text-base font-bold text-ink dark:text-white">Not counted against your allowance</h2>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink-soft dark:text-slate-300">
              {FREE_ITEMS.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-base font-bold text-ink dark:text-white">Never allowed</h2>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-ink-soft dark:text-slate-300">
              {PROHIBITED_ITEMS.map((p) => (
                <li key={p.item} className="flex gap-2">
                  <Ban size={16} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>
                    <strong className="font-medium text-ink dark:text-white">{p.item}.</strong> {p.why}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs leading-relaxed text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
              <strong className="font-semibold">{DANGEROUS_GOODS.section}:</strong> {DANGEROUS_GOODS.penalty}{' '}
              {DANGEROUS_GOODS.note}
            </div>
          </Card>
        </div>

        <Card className="mt-5 p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink dark:text-white">
            <Dog size={18} className="text-brand-600 dark:text-brand-300" />
            Travelling with a pet
          </h2>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-ink-soft dark:text-slate-300">
            {PETS.map((p) => (
              <li key={p.rule}>
                <strong className="font-medium text-ink dark:text-white">{p.rule}.</strong> {p.detail}
              </li>
            ))}
          </ul>
        </Card>

        <HowToSection
          name="How to use the Luggage Allowance Calculator"
          description="Check your bags against the class limit before you reach the platform."
          steps={[
            { name: 'Pick your class', text: 'The free allowance ranges from 35 kg in Second Sitting to 70 kg in AC First, and the ceilings differ even more.' },
            { name: 'Enter the total weight', text: 'Add up everything you are carrying, excluding handbags, tiffin carriers and mobility aids.' },
            { name: 'Add the journey distance', text: 'The luggage rate is charged by weight and distance together, so the excess costs more the further you go.' },
            { name: 'Check a bulky piece', text: 'Tick the size box and enter the dimensions — a large light box can fail on size while passing on weight.' },
            { name: 'Compare the two charges', text: 'Booking the excess costs a fraction of what it costs when a ticket checker finds it unbooked.' },
          ]}
        />

        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">Three numbers, not one</h2>
          <p className="mt-3">
            Almost every answer to &ldquo;how much luggage can I take on a train?&rdquo; gives a single figure, and that
            is why so many travellers are surprised at the platform. Indian Railways defines three separate weights per
            class. The <strong className="text-ink dark:text-white">free allowance</strong> is what travels with you at
            no charge. The <strong className="text-ink dark:text-white">marginal allowance</strong> is a narrow band
            above it that may still be carried in the compartment if you pay for it. The{' '}
            <strong className="text-ink dark:text-white">maximum permitted</strong> is the ceiling for anything
            accompanying you at all — beyond it, the excess must be booked into the brake van as luggage.
          </p>
          <p className="mt-3">
            The case worth memorising is AC 3-Tier and AC Chair Car, where the maximum equals the free allowance. There
            is no band, no headroom and no discretion: 41 kg in 3A is already a booking job. These are also the two
            classes with the tighter size limit, 55 × 45 × 22.5 cm against 100 × 60 × 25 cm elsewhere, which is roughly
            a fifth of the volume.
          </p>
          <p className="mt-3">
            The financial argument for declaring is straightforward. Booked luggage is charged at the ordinary rate;
            unbooked luggage found during the journey is charged at{' '}
            <strong className="text-ink dark:text-white">{UNDECLARED_MULTIPLIER} times</strong> it. Nothing else about
            the bag changes. If you are near the limit, twenty minutes at the parcel office before departure is the
            cheapest twenty minutes of the trip. And if what you are carrying is on the prohibited list, none of this
            arithmetic applies — that is{' '}
            <a href={HREF.replace('luggage-allowance', 'penalty-calculator')} className="font-medium text-brand-600 underline underline-offset-2 dark:text-brand-300">
              a matter for the Railways Act
            </a>
            , not the luggage tariff.
          </p>
        </div>

        <NextStep
          title="Bags sorted. What else can the TTE charge you for?"
          body="Unbooked luggage is one of five things checked on board. The penalty calculator covers the rest — no ticket, no ID, wrong class, and travelling past your station."
          href="/rail/penalty-calculator"
          cta="Check penalties and excess fare"
          secondary={{ href: '/rail/train-fare-calculator', label: 'Estimate your fare' }}
        />

        <div className="mt-8">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="August 14, 2026"
            scope="Free, marginal and maximum luggage weights and the per-piece size limits are the published Indian Railways class allowances. Charge multipliers (1.5× marginal, 6× undeclared) are the rule as published. Rupee amounts are modelled from a distance-and-weight luggage scale rather than reproduced from the full tariff table, and are presented as estimates."
            sources={[
              { label: 'Indian Railways', url: 'https://indianrailways.gov.in/' },
              { label: 'IRCTC Official Portal', url: 'https://www.irctc.co.in/' },
            ]}
          />
        </div>

        <div className="mt-8">
          <SearchLandingSections
            intro={(
              <>
                <p>
                  Luggage rules are among the least-read and most-enforced parts of an Indian train journey. The
                  allowance is not one number but three, it differs by class, it is halved for children, and it is
                  policed by a size limit that has nothing to do with weight.
                </p>
                <p>
                  This tool puts your actual bags against your actual class, and shows the gap between declaring the
                  excess and being found with it — which is the difference between a modest charge and a six-fold one.
                </p>
              </>
            )}
            example={(
              <p>
                45 kg in Sleeper over 1,000 km: the free allowance is 40 kg, so 5 kg is excess. Inside the marginal
                band, so it may stay in the compartment on payment — about{' '}
                {rupees(assessLuggage({ classCode: 'SL', weightKg: 45, distanceKm: 1000 }).declaredCharge)} declared.
                Found unbooked instead, the same 5 kg is charged at six times the rate:{' '}
                {rupees(assessLuggage({ classCode: 'SL', weightKg: 45, distanceKm: 1000 }).undeclaredPenalty)}. The same
                45 kg in AC 3-Tier has no marginal band at all and must be booked.
              </p>
            )}
            formula={(
              <p>
                Excess weight = total weight − the class free allowance (halved and capped at 50 kg for ages 5–11). The
                band is decided by where the total falls: free allowance, marginal ceiling (free + marginal, capped at
                the class maximum), class maximum. Charge = excess weight × the luggage rate × distance, then ×{' '}
                {MARGINAL_MULTIPLIER} inside the marginal band, or × {UNDECLARED_MULTIPLIER} if found unbooked, with a
                floor. Size is judged per piece against the class limit, longest dimension against longest.
              </p>
            )}
            faqItems={seoFaqItems}
          />
        </div>

        <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-center text-sm leading-relaxed text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          Weights, size limits and charge multipliers are the published rules; rupee amounts are modelled estimates.
          Railmonk is not affiliated with Indian Railways or IRCTC. The charge assessed by railway staff at the parcel
          office or on the train is final.
        </div>

        <UpdatedStamp updated={getTool(HREF)?.updated} href={HREF} />

        <RelatedContent href={HREF} kind="tool" />
      </CalcLayout>
    </>
  );
};

export default LuggageAllowanceCalculator;
