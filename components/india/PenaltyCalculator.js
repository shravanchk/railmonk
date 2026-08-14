import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import { Gavel, Receipt, ScrollText, ShieldAlert } from 'lucide-react';
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

const HREF = '/rail/penalty-calculator';

const {
  MIN_EXCESS_CHARGE,
  CONFIDENCE,
  SCENARIOS,
  OFFENCES,
  assessPenalty,
  describeOffence,
} = require('../../utils/engines/penalties');
const { CLASSES } = require('../../utils/engines/trainFare');

const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

const TRAIN_CATEGORIES = [
  { id: 'express', label: 'Mail / Express' },
  { id: 'superfast', label: 'Superfast' },
  { id: 'premium', label: 'Rajdhani / Shatabdi / Duronto' },
];

const needs = (scenario, field) => scenario.needs.includes(field);

const PenaltyCalculator = () => {
  const [scenarioId, setScenarioId] = useState('no-ticket');
  const [classCode, setClassCode] = useState('SL');
  const [ticketedClassCode, setTicketedClassCode] = useState('2S');
  const [distanceKm, setDistanceKm] = useState('500');
  const [ticketedDistanceKm, setTicketedDistanceKm] = useState('300');
  const [trainCategory, setTrainCategory] = useState('superfast');
  const [passengers, setPassengers] = useState('1');
  const [luggageKg, setLuggageKg] = useState('90');

  const shareUrl = useShareableInputs(
    {
      s: scenarioId,
      class: classCode,
      tclass: ticketedClassCode,
      km: distanceKm,
      tkm: ticketedDistanceKm,
      cat: trainCategory,
      pax: passengers,
      kg: luggageKg,
    },
    (params) => {
      if (params.s) setScenarioId(params.s);
      if (params.class) setClassCode(params.class);
      if (params.tclass) setTicketedClassCode(params.tclass);
      if (params.km) setDistanceKm(params.km);
      if (params.tkm) setTicketedDistanceKm(params.tkm);
      if (params.cat) setTrainCategory(params.cat);
      if (params.pax) setPassengers(params.pax);
      if (params.kg) setLuggageKg(params.kg);
    }
  );

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];

  const result = useMemo(
    () =>
      assessPenalty({
        scenarioId,
        classCode,
        ticketedClassCode,
        distanceKm: parseFloat(distanceKm),
        ticketedDistanceKm: parseFloat(ticketedDistanceKm) || 0,
        trainCategory,
        passengers: parseInt(passengers, 10) || 1,
        luggageKg: parseFloat(luggageKg) || 0,
      }),
    [scenarioId, classCode, ticketedClassCode, distanceKm, ticketedDistanceKm, trainCategory, passengers, luggageKg]
  );

  const seoFaqItems = [
    {
      question: 'What is the fine for travelling without a ticket in India?',
      answer:
        `There is usually no "fine" in the criminal sense. Under Section 138 of the Railways Act 1989 you pay an excess charge to the ticket checker: the fare for the distance travelled in the class you are found in, plus a further ₹${MIN_EXCESS_CHARGE}. You get a receipt and continue your journey. A court fine only enters the picture under Section 137, if you refuse to pay — and that can reach ₹1,000, imprisonment of up to six months, or both, with the fare still payable.`,
    },
    {
      question: 'Is the fare charged from where I boarded or from where I was caught?',
      answer:
        'From the originating station of the train, not from where the ticket checker found you. This is the single biggest reason people underestimate the amount: a short hop discovered near the end of a long-distance train is charged as though you had travelled the whole way.',
    },
    {
      question: 'What happens if I forget my ID with an IRCTC e-ticket?',
      answer:
        `The e-ticket is treated as invalid, and every passenger on it is charged as ticketless — full fare plus the ₹${MIN_EXCESS_CHARGE} excess charge, not just the one person without the card. One passenger named on the ticket must carry an original photo ID: passport, Aadhaar, PAN card, driving licence, voter ID, a government or public-sector employer photo ID, a student photo ID, or a nationalised bank passbook with a photograph. A photocopy or a photo on your phone is not accepted.`,
    },
    {
      question: 'What if I sit in a higher class than my ticket?',
      answer:
        `You pay the difference between the two fares plus the ₹${MIN_EXCESS_CHARGE} excess charge — not the full higher-class fare. Upgrading on board is only possible if a berth is genuinely vacant after charting, which is why asking the ticket checker rather than simply moving is the cheaper approach.`,
    },
    {
      question: 'Do I get a refund if I travel in a lower class than my ticket?',
      answer:
        'No. The fare difference is only ever recovered in one direction. Voluntarily travelling in a lower class than you paid for earns nothing back, so if your booked coach is unusable, raise it with the ticket checker and get it recorded rather than quietly moving.',
    },
    {
      question: 'What is the penalty for travelling beyond my destination?',
      answer:
        `You are charged the fare for the extra distance plus the ₹${MIN_EXCESS_CHARGE} excess charge. Because the base fare is telescopic — the per-kilometre rate falls as a journey lengthens — the extra stretch charged on its own costs more than those kilometres would have inside a single through ticket. Telling the ticket checker before you pass your station keeps it an ordinary extension rather than an irregularity.`,
    },
    {
      question: 'Can I be arrested for not having a train ticket?',
      answer:
        'Not for simply lacking a ticket. Section 138 is a charge, not an offence, and paying it ends the matter. Prosecution under Section 137 follows from refusing to pay the excess charge or from fraudulent travel, and it is a magistrate — not the ticket checker — who decides any fine or imprisonment within the statutory maximum.',
    },
    {
      question: 'What is the fine for pulling the alarm chain?',
      answer:
        'Section 141 allows imprisonment of up to one year, a fine of up to ₹1,000, or both, where the chain is pulled without reasonable cause. Reasonable cause is a genuine defence — a medical emergency, a fire, a passenger in danger. Stopping the train because a companion missed the departure is not.',
    },
  ];

  const softwareSchema = buildSoftwareApplicationSchema({
    name: 'Train Penalty & Excess Fare Calculator',
    url: `https://railmonk.com${HREF}`,
    description:
      'Work out what a ticket checker can charge you on an Indian train — travelling without a ticket, without ID, in a higher class, or beyond your destination — under Section 138 of the Railways Act.',
    applicationCategory: 'TravelApplication',
    featureList: [
      'Section 138 excess charge arithmetic',
      'Missing e-ticket ID scenario',
      'Class upgrade and overshoot cases',
      'Statutory offence reference table',
    ],
  });

  return (
    <>
      <Head>
        <title>Train Penalty & Excess Fare Calculator — Railways Act Charges | Railmonk</title>
        <meta
          name="description"
          content="What a ticket checker can charge for travelling without a ticket, without ID, in a higher class or past your station — plus the statutory fines under the Railways Act."
        />
        <link rel="canonical" href={`https://railmonk.com${HREF}`} />
        <meta property="og:title" content="Train Penalty & Excess Fare Calculator | Railmonk" />
        <meta property="og:description" content="Section 138 excess charges, worked out from your actual class and distance." />
        <meta property="og:url" content={`https://railmonk.com${HREF}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="India · Rules"
        title="Penalty & Excess Fare Calculator"
        subtitle="What a ticket checker can actually charge you — and where an excess charge ends and a court fine begins."
      >
        <Breadcrumbs
          className="-mt-4 mb-6"
          items={[{ name: 'Home', href: '/' }, { name: 'Rail tools', href: '/#tools' }, { name: 'Penalty calculator' }]}
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Inputs */}
          <Card className="p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-ink dark:text-white">What happened?</h2>
            <div className="mt-2 space-y-2">
              {SCENARIOS.map((s) => {
                const active = s.id === scenarioId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScenarioId(s.id)}
                    aria-pressed={active}
                    className={cn(
                      'w-full rounded-xl border p-2.5 text-left text-sm font-medium transition',
                      active
                        ? 'border-brand-400 bg-brand-50/70 text-brand-800 shadow-sm dark:border-brand-500/70 dark:bg-brand-900/25 dark:text-brand-200'
                        : 'border-slate-200 bg-white text-ink-soft hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-600'
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
              {scenario.id === 'higher-class' ? 'Class you were found in' : 'Class travelled'}
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {Object.entries(CLASSES).map(([code, cls]) => {
                const active = code === classCode;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setClassCode(code)}
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

            {needs(scenario, 'ticketedClassCode') ? (
              <>
                <label htmlFor="pen-tclass" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
                  Class on your ticket
                </label>
                <select
                  id="pen-tclass"
                  value={ticketedClassCode}
                  onChange={(e) => setTicketedClassCode(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-brand-900/40"
                >
                  {Object.entries(CLASSES).map(([code, cls]) => (
                    <option key={code} value={code}>{cls.label}</option>
                  ))}
                </select>
              </>
            ) : null}

            <label htmlFor="pen-km" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
              {scenario.id === 'beyond-destination' ? 'Distance actually travelled (km)' : 'Distance travelled (km)'}
            </label>
            <input
              id="pen-km"
              type="number"
              min="1"
              max="4500"
              inputMode="numeric"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-brand-900/40"
            />
            {scenario.id !== 'unbooked-luggage' ? (
              <p className="mt-1.5 text-xs text-ink-muted dark:text-slate-400">
                Measured from the train&rsquo;s originating station, not from where you were checked.
              </p>
            ) : null}

            {needs(scenario, 'ticketedDistanceKm') ? (
              <>
                <label htmlFor="pen-tkm" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
                  Distance on your ticket (km)
                </label>
                <input
                  id="pen-tkm"
                  type="number"
                  min="0"
                  max="4500"
                  inputMode="numeric"
                  value={ticketedDistanceKm}
                  onChange={(e) => setTicketedDistanceKm(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-brand-900/40"
                />
              </>
            ) : null}

            {needs(scenario, 'luggageKg') ? (
              <>
                <label htmlFor="pen-kg" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
                  Luggage weight (kg)
                </label>
                <input
                  id="pen-kg"
                  type="number"
                  min="0"
                  max="300"
                  inputMode="decimal"
                  value={luggageKg}
                  onChange={(e) => setLuggageKg(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-brand-900/40"
                />
              </>
            ) : null}

            {scenario.id !== 'unbooked-luggage' ? (
              <>
                <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">Train category</label>
                <select
                  value={trainCategory}
                  onChange={(e) => setTrainCategory(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-brand-900/40"
                >
                  {TRAIN_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>

                <label htmlFor="pen-pax" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
                  Passengers affected
                </label>
                <input
                  id="pen-pax"
                  type="number"
                  min="1"
                  max="6"
                  inputMode="numeric"
                  value={passengers}
                  onChange={(e) => setPassengers(e.target.value)}
                  className="mt-2 w-24 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-brand-900/40"
                />
              </>
            ) : null}
          </Card>

          {/* Result */}
          <div className="space-y-5 lg:col-span-3">
            {result ? (
              <>
                <Card className="overflow-hidden border-rose-300 bg-gradient-to-br from-rose-600 to-rose-700 p-5 text-white dark:border-rose-900">
                  <div className="flex items-start gap-3">
                    <Receipt size={28} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                        {result.scenario.label} · {result.scenario.section}
                      </p>
                      <p className="mt-1 font-display text-3xl font-bold leading-none">{rupees(result.total)}</p>
                      <p className="mt-2 text-sm text-white/90">
                        {result.passengers > 1
                          ? `${rupees(result.perPassenger)} per passenger × ${result.passengers}. `
                          : ''}
                        Payable to the ticket checker against a receipt.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="font-display text-base font-bold text-ink dark:text-white">How it is made up</h3>
                  <div className="mt-2 divide-y divide-slate-100 text-sm dark:divide-slate-700/60">
                    {result.breakdown.map((row) => (
                      <div key={row.label} className="py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-ink-soft dark:text-slate-300">{row.label}</span>
                          <span className="shrink-0 font-medium text-ink dark:text-white">{rupees(row.amount)}</span>
                        </div>
                        {row.note ? <p className="mt-1 text-xs leading-relaxed text-ink-muted dark:text-slate-400">{row.note}</p> : null}
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-2.5 font-semibold">
                      <span className="text-ink dark:text-white">
                        Total{result.passengers > 1 ? ' per passenger' : ''}
                      </span>
                      <span className="text-rose-700 dark:text-rose-300">{rupees(result.perPassenger)}</span>
                    </div>
                  </div>
                  <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-muted dark:text-slate-400">
                    <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                    <span>
                      <strong className="font-semibold">{CONFIDENCE[result.scenario.confidence].label}.</strong>{' '}
                      {CONFIDENCE[result.scenario.confidence].note} Fare-derived amounts use the same estimating engine
                      as our fare calculator and are indicative, not a quotation.
                    </span>
                  </p>
                </Card>

                <Card className="p-5">
                  <h3 className="font-display text-base font-bold text-ink dark:text-white">{result.scenario.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft dark:text-slate-300">{result.scenario.summary}</p>
                  {result.notes.length ? (
                    <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft dark:text-slate-300">
                      {result.notes.map((note) => (
                        <li key={note} className="flex gap-2">
                          <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                          {note}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </Card>

                <ShareResult
                  url={shareUrl}
                  title="Train penalty estimate — Railmonk"
                  text={`${result.scenario.label}: about ${rupees(result.total)}.`}
                />
              </>
            ) : (
              <Card className="flex flex-col items-center justify-center p-10 text-center text-sm text-ink-muted dark:text-slate-400">
                <Gavel size={40} className="mb-3 text-slate-300 dark:text-slate-600" />
                Enter the distance travelled to work out the charge.
              </Card>
            )}
          </div>
        </div>

        {/* Statutory offences — reference, deliberately not a calculator */}
        <Card className="mt-8 p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink dark:text-white">
            <ScrollText size={20} className="text-brand-600 dark:text-brand-300" />
            Statutory offences under the Railways Act 1989
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft dark:text-slate-300">
            These are criminal provisions, not excess charges. The figures below are the maximum a court may impose —
            what is actually imposed is a magistrate&rsquo;s decision, which is why no calculator can produce a number
            for them and this table gives ceilings instead.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[38rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                  <th className="py-2 pr-3 font-semibold text-ink dark:text-white">Section</th>
                  <th className="py-2 pr-3 font-semibold text-ink dark:text-white">Offence</th>
                  <th className="py-2 font-semibold text-ink dark:text-white">Maximum penalty</th>
                </tr>
              </thead>
              <tbody>
                {OFFENCES.map((o) => (
                  <tr key={o.section} className="border-b border-slate-100 align-top dark:border-slate-700/60">
                    <td className="whitespace-nowrap py-2.5 pr-3 font-medium text-ink dark:text-white">{o.section}</td>
                    <td className="py-2.5 pr-3 text-ink-soft dark:text-slate-300">
                      {o.offence}
                      <span className="mt-0.5 block text-xs text-ink-muted dark:text-slate-400">{o.note}</span>
                    </td>
                    <td className="py-2.5 text-ink-soft dark:text-slate-300">{describeOffence(o)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <HowToSection
          name="How to use the Penalty & Excess Fare Calculator"
          description="Work out what a ticket checker can charge before you are standing in front of one."
          steps={[
            { name: 'Pick the situation', text: 'No ticket, no ID, higher class, past your station, or unbooked luggage — each is charged differently.' },
            { name: 'Enter class and distance', text: 'Distance runs from the train’s originating station, which is what makes these charges larger than people expect.' },
            { name: 'Add the ticket details', text: 'For a class upgrade or an overshoot, the charge is on the difference, so the tool needs what you actually held.' },
            { name: 'Read the breakdown', text: 'The fare component and the ₹250 excess charge are shown separately, because only one of them is a penalty.' },
            { name: 'Check the offence table', text: 'If the situation is a Railways Act offence rather than an excess charge, the ceiling is in the table below.' },
          ]}
        />

        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">A charge is not a fine</h2>
          <p className="mt-3">
            Almost everything a ticket checker collects is an <strong className="text-ink dark:text-white">excess
            charge</strong> under Section 138 of the Railways Act 1989, and it is not a punishment. It is the fare you
            should have paid, plus a charge of the same amount subject to a floor of{' '}
            {rupees(MIN_EXCESS_CHARGE)}. You pay it, you get an EFT receipt, and you carry on travelling. No court, no
            record, no arrest.
          </p>
          <p className="mt-3">
            The part that surprises people is the fare component. It is calculated from the{' '}
            <strong className="text-ink dark:text-white">train&rsquo;s originating station</strong>, not from where you
            boarded and not from where you were found. Being checked two hours into a Delhi–Chennai train means being
            charged as though you had been aboard since Delhi. That is why the same irregularity can cost{' '}
            {rupees(assessPenalty({ scenarioId: 'no-ticket', classCode: '2S', distanceKm: 100 }).perPassenger)} on a
            short local run and{' '}
            {rupees(assessPenalty({ scenarioId: 'no-ticket', classCode: '3A', distanceKm: 2180 }).perPassenger)} on a
            long-distance AC coach.
          </p>
          <p className="mt-3">
            A <strong className="text-ink dark:text-white">statutory penalty</strong> is a different thing entirely, and
            you reach it mainly by refusing to pay. Section 137 turns unpaid ticketless travel into a prosecution with a
            fine of up to ₹1,000 or six months&rsquo; imprisonment — and the fare is still owed. The other sections in
            the table cover conduct rather than tickets: the alarm chain, dangerous goods, travelling on the roof. Those
            are ceilings set by statute and filled in by a magistrate, so treat any single number quoted for them
            elsewhere with suspicion.
          </p>
          <p className="mt-3">
            The practical lesson across all five scenarios is the same: tell the ticket checker before they find out.
            An unbooked bag declared at the parcel office costs a{' '}
            <a href="/rail/luggage-allowance" className="font-medium text-brand-600 underline underline-offset-2 dark:text-brand-300">
              sixth of what it costs on the train
            </a>
            , and a journey extended with permission is an ordinary extension rather than an irregularity.
          </p>
        </div>

        <NextStep
          title="Most of this is avoidable."
          body="Every scenario here starts with a ticket problem. The booking-date calculator and waitlist odds tool are how you avoid boarding without a confirmed one."
          href="/rail/irctc-calculator"
          cta="Check my booking window"
          secondary={{ href: '/rail/guides/train-travel-rules', label: 'Read the travel rules guide' }}
        />

        <div className="mt-8">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="August 14, 2026"
            scope="Statutory sections and maximum penalties are taken from the Railways Act 1989 and presented as ceilings, not as amounts anyone is guaranteed to be charged. The ₹250 excess-charge floor and the e-ticket ID requirement are labelled as applied practice rather than verbatim statute. Fare components come from the site's own fare engine and are estimates."
            sources={[
              { label: 'Indian Railways', url: 'https://indianrailways.gov.in/' },
              { label: 'IRCTC Official Portal', url: 'https://www.irctc.co.in/' },
              { label: 'Rail Madad — grievance portal', url: 'https://railmadad.indianrailways.gov.in/' },
            ]}
          />
        </div>

        <div className="mt-8">
          <SearchLandingSections
            intro={(
              <>
                <p>
                  &ldquo;What is the fine for travelling without a ticket?&rdquo; has a misleading answer everywhere it
                  is asked, because the usual reply quotes ₹250 and stops. The ₹250 is only the smaller half: the fare
                  for the distance travelled is charged alongside it, from the train&rsquo;s originating station.
                </p>
                <p>
                  This calculator separates the two and works the fare out from your actual class and distance, across
                  the five situations a ticket checker actually deals with. The Railways Act offences — which are court
                  matters with statutory ceilings rather than arithmetic — are listed separately, and deliberately not
                  turned into a number.
                </p>
              </>
            )}
            example={(
              <p>
                Found without a ticket in Sleeper, 500 km into the journey, on a superfast train: the fare for 500 km is
                about {rupees(assessPenalty({ scenarioId: 'no-ticket', classCode: 'SL', distanceKm: 500 }).fareDue)}, and
                the excess charge is {rupees(MIN_EXCESS_CHARGE)} — roughly{' '}
                {rupees(assessPenalty({ scenarioId: 'no-ticket', classCode: 'SL', distanceKm: 500 }).perPassenger)} in
                total. Sitting in AC 2-Tier on a Sleeper ticket over the same distance costs far less, about{' '}
                {rupees(assessPenalty({ scenarioId: 'higher-class', classCode: '2A', ticketedClassCode: 'SL', distanceKm: 500 }).perPassenger)},
                because only the fare difference is recovered.
              </p>
            )}
            formula={(
              <p>
                Section 138 charge = the fare due + an excess charge with a floor of {rupees(MIN_EXCESS_CHARGE)}. The
                fare due depends on the case: the full fare for the distance when there is no valid ticket or no ID; the
                difference between two class fares on an upgrade; the fare for the extra distance when travelling past
                your station. Unbooked luggage sits outside Section 138 entirely and is charged at six times the
                ordinary luggage rate with no excess charge added.
              </p>
            )}
            faqItems={seoFaqItems}
          />
        </div>

        <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-center text-sm leading-relaxed text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          Informational only, and not legal advice. Statutory maximums are from the Railways Act 1989; fare components
          are modelled estimates. Railmonk is not affiliated with Indian Railways or IRCTC, and the amount assessed by
          railway staff is final.
        </div>

        <UpdatedStamp updated={getTool(HREF)?.updated} href={HREF} />

        <RelatedContent href={HREF} kind="tool" />
      </CalcLayout>
    </>
  );
};

export default PenaltyCalculator;
