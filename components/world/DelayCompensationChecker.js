import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { AlertCircle, Clock, Gift, Globe2, Scale, ShieldQuestion, Ticket } from 'lucide-react';
import { CalcLayout, ResultStat } from '../calculator/CalcLayout';
import Breadcrumbs from '../ui/Breadcrumbs';
import Card from '../ui/Card';
import RelatedContent from '../rail/RelatedContent';
import NextStep from '../rail/NextStep';
import ShareResult from '../rail/ShareResult';
import UpdatedStamp from '../rail/UpdatedStamp';
import useShareableInputs from '../rail/useShareableInputs';
import EEATPanel from '../calculator/EEATPanel';
import HowToSection from '../calculator/HowToSection';
import { editorialProfiles } from '../../utils/editorialProfiles';
import { buildSoftwareApplicationSchema } from '../../utils/schema';
import { buildFaqSchema } from '../../utils/faqSchema';
import { getTool } from '../../utils/catalog';
import {
  SCHEMES,
  computeDelayCompensation,
  formatDelay,
  formatMoney,
} from '../../utils/engines/delayCompensation';

const HREF = '/world/delay-compensation';
const URL = `https://railmonk.com${HREF}`;

const controlCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.95rem] text-ink ' +
  'shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 ' +
  'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

const labelCls = 'mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300';

// Scheme options are grouped by region so the select reads as a map rather than
// a flat list of fourteen acronyms.
const SCHEME_GROUPS = SCHEMES.reduce((groups, scheme) => {
  const group = groups.find((g) => g.region === scheme.region);
  if (group) group.schemes.push(scheme);
  else groups.push({ region: scheme.region, schemes: [scheme] });
  return groups;
}, []);

const FAQS = [
  {
    question: 'How much compensation do I get for a delayed train in Europe?',
    answer:
      'Under EU Regulation 2021/782 you are entitled to 25% of the price of the delayed journey if you arrive 60 to 119 minutes late, and 50% if you arrive 120 minutes or more late. The operator may refuse to pay amounts under €4, and it has one month from your claim to pay. Delay is measured on arrival at your final destination, not on departure.',
  },
  {
    question: 'Does a strike count as an extraordinary circumstance in the EU?',
    answer:
      'Not when it is the railway’s own staff striking. The regulation lets an operator escape compensation for extreme weather, major natural disasters, public-health crises and the acts of third parties such as people on the line or cable theft — but a strike by its own employees is explicitly excluded, so those delays are still compensated. The operator has to prove the exemption applies; you do not have to disprove it.',
  },
  {
    question: 'What is the difference between Delay Repay 15 and Delay Repay 30?',
    answer:
      'They are the two British thresholds. Delay Repay 15 starts paying at 15 minutes (25% of the single fare), rising to 50% at 30 minutes, 100% of the single fare at 60 minutes and 100% of a return fare at 120 minutes. Delay Repay 30 uses the same ladder but pays nothing below 30 minutes. Most large operators have moved to the 15-minute version, so check yours before assuming a short delay is not claimable.',
  },
  {
    question: 'Does Amtrak have to compensate me for a delay in the United States?',
    answer:
      'No. There is no federal law requiring an American railroad to compensate passengers for delays, and Amtrak publishes no percentage table. What you can rely on is a refund of the affected travel if Amtrak cancels or significantly delays your train — the usual fare restrictions are lifted during a disruption. Beyond that, a transportation eVoucher or Guest Rewards points is a goodwill decision made case by case by Customer Relations, and delays caused by freight-railroad congestion or weather are the least likely to be compensated.',
  },
  {
    question: 'Is there train delay compensation in Australia?',
    answer:
      'There is no national scheme. Victoria is the exception: V/Line pays the value of a daily fare to pass holders delayed 60 minutes or more on a single journey, and both Metro Trains and V/Line compensate pass holders in months when published punctuality targets are missed. Elsewhere you are relying on the operator’s refund conditions plus the Australian Consumer Law, under which services must be supplied with due care and within a reasonable time.',
  },
  {
    question: 'How long do I have to claim?',
    answer:
      'It varies sharply, and the shortest windows catch people out. The EU regulation gives you three months from the incident. Eurostar also allows three months but asks you to wait 24 hours before claiming. Switzerland allows only 30 days. Most British operators require a Delay Repay claim within 28 days. In the United States and Australia there is no statutory window — but the sooner you contact the operator, the better the outcome tends to be.',
  },
  {
    question: 'Is compensation based on my whole ticket or just the delayed leg?',
    answer:
      'The delayed leg. Both the EU regulation and Delay Repay work from the price of the journey that was actually delayed, so a return ticket is halved before the percentage is applied. The one documented exception is the British 120-minute band, which pays 100% of the full return fare rather than of the single leg.',
  },
];

const softwareSchema = buildSoftwareApplicationSchema({
  name: 'Train Delay Compensation Checker (EU, UK, US, Australia)',
  url: URL,
  description:
    'Work out what a delayed train entitles you to in the EU, the UK, Switzerland, the United States and Australia — the percentage, the amount, the claim deadline and the exemptions.',
  applicationCategory: 'TravelApplication',
  priceCurrency: 'EUR',
  featureList: [
    'EU Regulation 2021/782 compensation bands',
    'UK Delay Repay 15 and 30',
    'Eurostar cash versus voucher comparison',
    'Swiss SBB thresholds',
    'Amtrak and Australian operator guidance',
  ],
});

const Bullets = ({ items }) => (
  <ul className="mt-2 space-y-1.5 text-sm text-ink-muted dark:text-slate-400">
    {items.map((item) => (
      <li key={item} className="flex gap-2">
        <span aria-hidden="true" className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-brand-500" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const DelayCompensationChecker = () => {
  const [schemeId, setSchemeId] = useState('eu');
  const [delayMinutes, setDelayMinutes] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [ticketType, setTicketType] = useState('single');
  const [touched, setTouched] = useState(false);

  const shareUrl = useShareableInputs(
    { scheme: schemeId, delay: delayMinutes, price: ticketPrice, type: ticketType },
    (params) => {
      if (params.scheme && SCHEMES.some((s) => s.id === params.scheme)) setSchemeId(params.scheme);
      if (params.delay) setDelayMinutes(params.delay);
      if (params.price) setTicketPrice(params.price);
      if (params.type === 'single' || params.type === 'return') setTicketType(params.type);
    }
  );
  const tool = getTool(HREF);

  const result = useMemo(
    () => computeDelayCompensation({ schemeId, delayMinutes, ticketPrice, ticketType }),
    [schemeId, delayMinutes, ticketPrice, ticketType]
  );

  const scheme = result?.scheme || SCHEMES.find((s) => s.id === schemeId);
  const isDiscretionary = scheme.kind === 'discretionary';
  const awaitingDelay = !isDiscretionary && !delayMinutes;

  const amountLabel = result?.amount !== null && result?.amount !== undefined ? formatMoney(result.amount, scheme.currency) : null;
  const voucherLabel = result?.voucherAmount ? formatMoney(result.voucherAmount, scheme.currency) : null;

  return (
    <>
      <Head>
        <title>Train Delay Compensation Checker — EU, UK, US & Australia | Railmonk</title>
        <meta
          name="description"
          content="What a delayed train owes you outside India: EU Regulation 2021/782 bands, UK Delay Repay 15 and 30, Eurostar, Swiss SBB, Amtrak and Australian operator policy — with claim deadlines."
        />
        <link rel="canonical" href={URL} />
        <meta property="og:title" content="Train Delay Compensation Checker — EU, UK, US & Australia | Railmonk" />
        <meta property="og:description" content="Enter your delay and fare, and see the percentage, the amount and the deadline to claim." />
        <meta property="og:url" content={URL} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Train Delay Compensation Checker | Railmonk" />
        <meta name="twitter:description" content="Delayed abroad? See what the rules in that country actually entitle you to." />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(FAQS)) }} />
      </Head>

      <CalcLayout
        eyebrow="Trains abroad"
        title="Train Delay Compensation Checker"
        subtitle="A delayed train abroad is worth money in some countries and nothing at all in others. Pick where you were travelling and see what the rules there actually entitle you to — the percentage, the amount, and how long you have to claim it."
      >
        <Breadcrumbs
          className="-mt-4 mb-6"
          items={[{ name: 'Home', href: '/' }, { name: 'Trains abroad', href: '/world' }, { name: 'Delay compensation' }]}
        />

        <div className="grid gap-5 lg:grid-cols-5">
          <Card className="p-5 lg:col-span-2">
            <div className="space-y-4">
              <div>
                <label htmlFor="dc-scheme" className={labelCls}>
                  Where were you travelling?
                </label>
                <select
                  id="dc-scheme"
                  value={schemeId}
                  onChange={(e) => { setSchemeId(e.target.value); setTouched(true); }}
                  className={controlCls}
                >
                  {SCHEME_GROUPS.map((group) => (
                    <optgroup key={group.region} label={group.region}>
                      {group.schemes.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="mt-1 text-xs text-ink-muted dark:text-slate-500">{scheme.coverage}</p>
              </div>

              <div>
                <label htmlFor="dc-delay" className={labelCls}>
                  How late did you arrive? (minutes)
                </label>
                <input
                  id="dc-delay"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  placeholder="e.g. 95"
                  value={delayMinutes}
                  onChange={(e) => { setDelayMinutes(e.target.value); setTouched(true); }}
                  onBlur={() => setTouched(true)}
                  className={controlCls}
                />
                <p className="mt-1 text-xs text-ink-muted dark:text-slate-500">
                  Measured on <strong>arrival at your final destination</strong> — a late departure that the train makes
                  up on the way is not a delay for these purposes.
                </p>
              </div>

              {/* The fare only means something where a percentage is applied to
                  it. Leaving these on screen for Amtrak or Australia would imply
                  a calculation that is not happening. */}
              {!isDiscretionary ? (
                <>
                  <div>
                    <label htmlFor="dc-price" className={labelCls}>
                      What did the ticket cost? ({scheme.currencyCode})
                    </label>
                    <input
                      id="dc-price"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 120"
                      value={ticketPrice}
                      onChange={(e) => { setTicketPrice(e.target.value); setTouched(true); }}
                      className={controlCls}
                    />
                  </div>

                  <fieldset>
                    <legend className={labelCls}>Ticket type</legend>
                    <div className="flex gap-2">
                      {[
                        { id: 'single', label: 'Single' },
                        { id: 'return', label: 'Return' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => { setTicketType(opt.id); setTouched(true); }}
                          aria-pressed={ticketType === opt.id}
                          className={
                            'min-h-[44px] flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition ' +
                            (ticketType === opt.id
                              ? 'border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-600 dark:bg-brand-900/30 dark:text-brand-200'
                              : 'border-slate-200 bg-white text-ink-soft hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300')
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-ink-muted dark:text-slate-500">
                      Compensation is worked out on the delayed leg, so a return fare is halved first.
                    </p>
                  </fieldset>
                </>
              ) : null}

              {!isDiscretionary ? (
                <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3 text-sm dark:border-teal-800/60 dark:bg-teal-900/20">
                  <p className="font-semibold text-teal-800 dark:text-teal-300">The bands here</p>
                  <ul className="mt-1 space-y-1 text-teal-700 dark:text-teal-400">
                    {scheme.bands.map((band) => (
                      <li key={band.from}>
                        {band.to ? `${band.from}–${band.to - 1} min` : `${band.from} min or more`} →{' '}
                        {band.percent}% of the {band.basis === 'ticket' ? 'full ticket' : 'delayed leg'}
                        {band.voucherPercent ? `, or a ${band.voucherPercent}% voucher` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Card>

          <div className="space-y-5 lg:col-span-3" aria-live="polite">
            {isDiscretionary ? (
              <>
                <Card className="overflow-hidden border-amber-200 bg-gradient-to-br from-amber-500 to-amber-600 p-5 text-white dark:border-amber-700">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80">
                    <ShieldQuestion aria-hidden="true" className="h-3.5 w-3.5" />
                    No statutory entitlement here
                  </div>
                  <p className="mt-1 font-display text-2xl font-bold leading-tight">Nothing is owed by law</p>
                  <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm">{scheme.caveat}</p>
                </Card>

                <Card className="p-5">
                  <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink dark:text-white">
                    <Gift aria-hidden="true" className="h-4 w-4 text-brand-600 dark:text-brand-300" />
                    What to ask for instead
                  </h3>
                  <Bullets items={scheme.asks} />
                  <h3 className="mt-5 flex items-center gap-2 font-display text-base font-bold text-ink dark:text-white">
                    <Ticket aria-hidden="true" className="h-4 w-4 text-brand-600 dark:text-brand-300" />
                    What to have in front of you
                  </h3>
                  <Bullets items={scheme.evidence} />
                </Card>

                <Card className="p-5">
                  <h3 className="font-display text-base font-bold text-ink dark:text-white">What you can still rely on</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-slate-400">{scheme.choiceAtThreshold}</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted dark:text-slate-400">{scheme.assistance}</p>
                  <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-ink-soft dark:bg-slate-800/60 dark:text-slate-300">
                    {scheme.exemptionNote}
                  </p>
                </Card>
              </>
            ) : result && result.qualifies ? (
              <>
                <Card className="overflow-hidden border-brand-200 bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white dark:border-brand-700">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80">
                    <Scale aria-hidden="true" className="h-3.5 w-3.5" />
                    You are entitled to
                  </div>
                  <p className="mt-1 font-display text-3xl font-bold leading-tight">
                    {amountLabel || `${result.percent}% of the fare`}
                  </p>
                  <p className="mt-0.5 text-sm text-white/85">
                    {result.percent}% of the {result.band.basis === 'ticket' ? 'full ticket price' : 'delayed leg'} for a
                    delay of {formatDelay(result.delayMinutes)}
                    {amountLabel ? '' : ' — add the fare to see the amount'}
                  </p>
                  {voucherLabel ? (
                    <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm">
                      Or take a <strong>{voucherLabel}</strong> e-voucher instead ({result.band.voucherPercent}%) — worth
                      more, but only on Eurostar, and it expires 12 months after the delay.
                    </p>
                  ) : null}
                  {result.belowMinimum ? (
                    <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm">
                      This falls under the {formatMoney(scheme.minPayout, scheme.currency)} minimum the operator is
                      allowed to set, so it may decline to pay out at all.
                    </p>
                  ) : null}
                </Card>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ResultStat label="Claim within" value={scheme.claimWindowDays ? `${scheme.claimWindowDays} days` : 'No fixed limit'} emphasis />
                  <ResultStat label="They must pay within" value={scheme.payWithinDays ? `${scheme.payWithinDays} days` : 'Not specified'} />
                </div>

                {result.nextBand ? (
                  <div className="rounded-xl border-l-4 border-brand-400 bg-brand-50/70 p-4 text-sm dark:border-brand-500 dark:bg-brand-900/20">
                    <p className="text-brand-900/90 dark:text-brand-100/90">
                      <strong>{result.minutesToNextBand} minutes</strong> more delay and this would have risen to{' '}
                      {result.nextBand.percent}%. If your recorded arrival time is close to that line, it is worth
                      checking the operator&apos;s own delay record before you claim.
                    </p>
                  </div>
                ) : null}

                <Card className="p-5">
                  <h3 className="font-display text-base font-bold text-ink dark:text-white">Beyond the money</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-slate-400">{scheme.choiceAtThreshold}</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted dark:text-slate-400">{scheme.assistance}</p>
                </Card>

                <Card className="p-5">
                  <h3 className="font-display text-base font-bold text-ink dark:text-white">When they can refuse</h3>
                  <Bullets items={scheme.exemptions} />
                  <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-ink-soft dark:bg-slate-800/60 dark:text-slate-300">
                    {scheme.exemptionNote}
                  </p>
                </Card>

                <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50/70 p-4 text-sm dark:border-amber-500 dark:bg-amber-900/20">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">Before you rely on this</p>
                  <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">{scheme.caveat}</p>
                </div>
              </>
            ) : result && !result.qualifies ? (
              <>
                <Card className="p-5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
                    <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                    Below the threshold
                  </div>
                  <p className="mt-1 font-display text-2xl font-bold leading-tight text-ink dark:text-white">
                    No compensation for {formatDelay(result.delayMinutes)}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-slate-400">
                    This scheme starts paying at {scheme.bands[0].from} minutes. You were{' '}
                    <strong>{result.shortfallMinutes} minute{result.shortfallMinutes === 1 ? '' : 's'}</strong> short of
                    the first band.
                  </p>
                  {schemeId === 'uk-dr30' ? (
                    <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-ink-soft dark:bg-slate-800/60 dark:text-slate-300">
                      Most large British operators now run Delay Repay 15, which pays from 15 minutes. Check which
                      scheme yours uses before writing this off.
                    </p>
                  ) : null}
                </Card>
                <Card className="p-5">
                  <h3 className="font-display text-base font-bold text-ink dark:text-white">What you still have</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-slate-400">{scheme.assistance}</p>
                </Card>
              </>
            ) : (
              <Card className="flex flex-col items-center justify-center p-10 text-center text-sm text-ink-muted dark:text-slate-400">
                {touched && awaitingDelay ? (
                  <>
                    <AlertCircle aria-hidden="true" className="mb-3 h-8 w-8 text-amber-400" />
                    Enter how many minutes late you arrived to see what is owed.
                  </>
                ) : (
                  <>
                    <Globe2 aria-hidden="true" className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                    Pick a country and enter your delay to see what the rules there entitle you to.
                  </>
                )}
              </Card>
            )}

            {result && (result.qualifies || isDiscretionary) ? (
              <ShareResult
                url={shareUrl}
                title="Train delay compensation — Railmonk"
                text={
                  isDiscretionary
                    ? `${scheme.shortLabel}: what to ask for after a delayed train.`
                    : `${scheme.shortLabel}: ${result.percent}% back for a ${formatDelay(result.delayMinutes)} delay.`
                }
              />
            ) : null}
          </div>
        </div>

        <HowToSection
          name="How to claim compensation for a delayed train abroad"
          description="Turn a delayed arrival into a paid claim, wherever you were travelling."
          steps={[
            { name: 'Note the arrival delay', text: 'Compensation everywhere is measured on how late you reached your final destination, not on when the train left.' },
            { name: 'Identify the scheme', text: 'The country and operator decide whether you have a legal entitlement or only a goodwill request.' },
            { name: 'Work out the band', text: 'Enter the delay and the fare to see the percentage and the amount, and how close you were to the next band up.' },
            { name: 'Claim before the deadline', text: 'Three months in the EU, 30 days in Switzerland, usually 28 days in Britain. Miss it and a valid claim dies.' },
            { name: 'Keep the evidence', text: 'Booking reference, scheduled and actual times, and receipts for anything the delay cost you.' },
          ]}
        />

        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">
            Two different worlds, and it pays to know which one you are in
          </h2>
          <p className="mt-3">
            Indian Railways treats a delay as grounds for a refund through the TDR route — you file a claim, and the
            rules decide what comes back. Europe works on a different principle entirely: a delay creates an
            entitlement with a percentage attached, payable regardless of whether the railway was at fault, and the
            operator has a month to hand it over. The United States and Australia sit at the opposite end, with no
            statutory scheme at all, where the same delay produces a voucher if someone in customer relations decides
            it should.
          </p>
          <p className="mt-3">
            That gap is the whole reason this tool exists. A 90-minute delay on a Paris–Milan train is a quarter of
            your fare back as of right. The same delay on a Chicago–Denver Amtrak is a conversation. Knowing which one
            you are having before you start writing changes what you ask for and how you ask for it.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">
            The deadline is the part people lose on
          </h3>
          <p className="mt-3">
            Entitlements expire, and they expire faster than most travellers expect. Switzerland gives you 30 days
            from the journey. Most British operators want a Delay Repay claim inside 28. The EU is more generous at
            three months, but that still runs out well before the average person gets round to their holiday admin.
            If you are reading this on the train, the claim is worth starting before you get off it.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">
            Cash or voucher is a real decision
          </h3>
          <p className="mt-3">
            Where an operator offers both — Eurostar is the clearest case — the voucher is deliberately worth more
            than the cash. A three-hour delay pays 50% in money or 75% as a voucher. The voucher is only better if you
            will genuinely travel with that operator again inside a year; otherwise the smaller cash figure is the
            larger real amount. The calculator shows both so the comparison is explicit rather than buried in a
            claim form.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">
            If you are used to Indian Railways
          </h3>
          <p className="mt-3">
            Two habits transfer badly. First, there is no equivalent of filing a TDR and waiting: in Europe you claim
            from the operator directly, usually through a web form, and a national enforcement body handles it if they
            refuse. Second, the delay that matters is arrival, not departure — a train that leaves 40 minutes late and
            arrives on time owes you nothing anywhere in this table. The{' '}
            <Link href="/rail/tdr-refund-checker" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">
              TDR refund checker
            </Link>{' '}
            covers the Indian side of the same question.
          </p>
        </div>

        <NextStep
          title="Planning the trip rather than claiming for one?"
          body="Booking windows abroad range from 30 days to a full year, and the cheap fares go early. See when tickets open for the operator you need."
          href="/world/booking-windows"
          cta="Check booking windows"
          secondary={{ href: '/world', label: 'All trains-abroad tools' }}
        />

        <section className="mt-12" aria-labelledby="dc-faq">
          <h2 id="dc-faq" className="font-display text-xl font-bold text-ink dark:text-white">
            Frequently asked questions
          </h2>
          <div className="mt-4 space-y-3">
            {FAQS.map((faq) => (
              <details key={faq.question} className="rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/70 dark:bg-slate-800/70">
                <summary className="cursor-pointer select-none font-display text-[0.98rem] font-semibold text-ink dark:text-white">
                  {faq.question}
                </summary>
                <p className="mt-2.5 text-[0.92rem] leading-relaxed text-ink-soft dark:text-slate-300">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-10">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="31 July 2026"
            scope="Percentages, thresholds and deadlines are taken from Regulation (EU) 2021/782, the National Rail Conditions of Travel, and the published policies of Eurostar, SBB, Amtrak and the Victorian operators, checked in July 2026. Individual operators may pay more generously than the minimum, and national exemptions apply to some domestic services."
            sources={[
              { label: 'Regulation (EU) 2021/782', url: 'https://eur-lex.europa.eu/eli/reg/2021/782/oj' },
              { label: 'Your Europe — rail passenger rights', url: 'https://europa.eu/youreurope/citizens/travel/passenger-rights/rail/index_en.htm' },
              { label: 'National Rail — compensation and refunds', url: 'https://www.nationalrail.co.uk/help-and-assistance/compensation-and-refunds/' },
              { label: 'Amtrak — customer service commitments', url: 'https://www.amtrak.com/amtrak-customer-service-commitments' },
              { label: 'V/Line — compensation', url: 'https://www.vline.com.au/About-V-Line/Additional-pages/Compensation' },
            ]}
          />
        </div>

        <UpdatedStamp updated={tool?.updated} href={HREF} />

        <RelatedContent href={HREF} kind="tool" />
      </CalcLayout>
    </>
  );
};

export default DelayCompensationChecker;
