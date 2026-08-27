import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import { BadgePercent, Info, Plus, ScrollText, Trash2, Users } from 'lucide-react';
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

const HREF = '/rail/concession-calculator';

const {
  MIN_DISTANCE_KM,
  CONFIDENCE,
  GENERAL_RULES,
  CATEGORIES,
  GROUPS,
  WITHDRAWN,
  getCategory,
  categoriesInGroup,
  assessFare,
  assessParty,
} = require('../../utils/engines/concessions');
const { CLASSES } = require('../../utils/engines/trainFare');

const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

const TRAIN_CATEGORIES = [
  { id: 'express', label: 'Mail / Express' },
  { id: 'superfast', label: 'Superfast' },
  { id: 'premium', label: 'Rajdhani / Shatabdi / Duronto' },
];

const MAX_TRAVELLERS = 6;

// Travellers ride in the query string as `adult,child-5-11,patient-cancer*`,
// where the star marks an escort. One field keeps the share link readable.
const encodeTravellers = (travellers) =>
  travellers.map((t) => `${t.categoryId}${t.escort ? '*' : ''}`).join(',');

const decodeTravellers = (text) =>
  String(text)
    .split(',')
    .map((part) => {
      const escort = part.endsWith('*');
      const categoryId = escort ? part.slice(0, -1) : part;
      return getCategory(categoryId) ? { categoryId, escort } : null;
    })
    .filter(Boolean)
    .slice(0, MAX_TRAVELLERS);

const DEFAULT_TRAVELLERS = [
  { categoryId: 'adult', escort: false },
  { categoryId: 'child-5-11', escort: false },
];

const ConcessionCalculator = () => {
  const [classCode, setClassCode] = useState('SL');
  const [distanceKm, setDistanceKm] = useState('800');
  const [trainCategory, setTrainCategory] = useState('superfast');
  const [travellers, setTravellers] = useState(DEFAULT_TRAVELLERS);

  const shareUrl = useShareableInputs(
    {
      class: classCode,
      km: distanceKm,
      cat: trainCategory,
      t: encodeTravellers(travellers),
    },
    (params) => {
      if (params.class) setClassCode(params.class);
      if (params.km) setDistanceKm(params.km);
      if (params.cat) setTrainCategory(params.cat);
      if (params.t) {
        const decoded = decodeTravellers(params.t);
        if (decoded.length) setTravellers(decoded);
      }
    }
  );

  const setTraveller = (index, patch) =>
    setTravellers((list) => list.map((t, i) => (i === index ? { ...t, ...patch } : t)));

  const addTraveller = () =>
    setTravellers((list) => (list.length >= MAX_TRAVELLERS ? list : [...list, { categoryId: 'adult', escort: false }]));

  const removeTraveller = (index) =>
    setTravellers((list) => (list.length <= 1 ? list : list.filter((_, i) => i !== index)));

  const result = useMemo(
    () => assessParty({ travellers, classCode, distanceKm: parseFloat(distanceKm), trainCategory }),
    [travellers, classCode, distanceKm, trainCategory]
  );

  // Worked examples in the prose come from the engine, so the numbers on the
  // page cannot drift from the numbers the calculator produces.
  const childExample = assessFare({ categoryId: 'child-5-11', classCode: 'SL', distanceKm: 800 });
  const adultExample = assessFare({ categoryId: 'adult', classCode: 'SL', distanceKm: 800 });
  const blindExample = assessFare({ categoryId: 'divyangjan-blind', classCode: '3A', distanceKm: 800 });

  const seoFaqItems = [
    {
      question: 'What is the age limit for a child train ticket in India?',
      answer:
        'A child under 5 travels free and is not issued a ticket, but gets no berth. From 5 up to under 12 a ticket is required, and the fare depends entirely on whether you ask for a separate berth: half the basic fare without one, the full adult fare with one. Age is reckoned on the date of the journey, so a child who turns 12 mid-trip is charged as an adult for the outward leg only.',
    },
    {
      question: 'Do children between 5 and 12 pay half fare on Indian Railways?',
      answer: `Only without a berth. Since 21 April 2016, a child aged 5 to under 12 allotted a separate berth pays the full adult fare. Choosing no separate berth means half the basic fare — and the child shares your berth. Over ${800} km in Sleeper that is about ${rupees(childExample.payable)} against ${rupees(adultExample.payable)} for an adult, a saving of ${childExample.effectivePercent}% rather than the 50% the phrase "half fare" suggests.`,
    },
    {
      question: 'Is the senior citizen concession on train tickets available in 2026?',
      answer:
        'No. The 40% concession for men aged 60 and above and 50% for women aged 58 and above was withdrawn on 20 March 2020 and has not been restored. What continues is the lower-berth allotment preference for senior citizens, which is an allocation rule rather than a discount, and the senior citizen quota in the reservation system.',
    },
    {
      question: 'Which railway concessions still exist?',
      answer:
        'Four Divyangjan categories, eleven patient categories and a set of student categories. Everything else — journalists, sportspersons, teachers, unemployed youth, doctors, senior citizens — was withdrawn in March 2020 and remains withdrawn.',
    },
    {
      question: 'Does a 75% concession mean my ticket costs 75% less?',
      answer: `No, and this is the most common disappointment at the counter. A concession applies to the basic fare only: the reservation fee, the superfast surcharge and GST are charged in full. A 75% concession in AC 3-Tier over 800 km works out at about ${blindExample.effectivePercent}% off the ticket as a whole.`,
    },
    {
      question: 'Is there a minimum distance for a railway concession?',
      answer: `Yes — ${MIN_DISTANCE_KM} km, but with wide exemptions. Students, blind and orthopaedically handicapped passengers and all the listed patient categories are exempt, which covers most people who still hold a concession. Child fares are not affected by it at all.`,
    },
    {
      question: 'Can I book a concession ticket online?',
      answer:
        'Only for categories that support prior registration — the Divyangjan concession in particular requires the railway-issued concession ID to be registered against your IRCTC account before you can book online. Everything else is issued across the counter at a reservation office, on production of the certificate. A ticket checker cannot grant a concession on board, however genuine the entitlement.',
    },
    {
      question: 'Can a concession be used on a Tatkal ticket?',
      answer:
        'Only for a few categories: Divyangjan, and cancer, kidney and thalassaemia patients, plus families of martyrs. Student and most other concessions cannot be combined with Tatkal or Premium Tatkal.',
    },
  ];

  const softwareSchema = buildSoftwareApplicationSchema({
    name: 'Train Concession & Child Fare Calculator',
    url: `https://railmonk.com${HREF}`,
    description:
      'Work out the child fare and the concession fare for an Indian train ticket — what each passenger pays, and what the concession actually takes off the ticket.',
    applicationCategory: 'TravelApplication',
    featureList: [
      'Child fare under the 2016 berth rule',
      'Divyangjan, patient and student concession rates',
      'Basic-fare-only arithmetic with fixed charges shown',
      'Whole-party totals',
    ],
  });

  return (
    <>
      <Head>
        <title>Train Concession & Child Fare Calculator — What Each Passenger Pays | Railmonk</title>
        <meta
          name="description"
          content="Child train ticket fare by age and berth, plus the Divyangjan, patient and student concessions that still exist — with what each one actually takes off the ticket."
        />
        <link rel="canonical" href={`https://railmonk.com${HREF}`} />
        <meta property="og:title" content="Train Concession & Child Fare Calculator | Railmonk" />
        <meta property="og:description" content="Half fare, 75% concessions and what they really come to once the fixed charges are counted." />
        <meta property="og:url" content={`https://railmonk.com${HREF}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="India · Fares"
        title="Concession & Child Fare Calculator"
        subtitle="What each passenger in your party actually pays — and why a 75% concession is never 75% off the ticket."
      >
        <Breadcrumbs
          className="-mt-4 mb-6"
          items={[{ name: 'Home', href: '/' }, { name: 'Rail tools', href: '/#tools' }, { name: 'Concession calculator' }]}
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Inputs */}
          <Card className="p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-ink dark:text-white">The journey</h2>

            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
              Class
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

            <label htmlFor="conc-km" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
              Distance (km)
            </label>
            <input
              id="conc-km"
              type="number"
              min="1"
              max="4500"
              inputMode="numeric"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-brand-900/40"
            />
            <p className="mt-1.5 text-xs text-ink-muted dark:text-slate-400">
              Most concessions need at least {MIN_DISTANCE_KM} km, though the categories that still exist are largely
              exempt from that.
            </p>

            <label htmlFor="conc-cat" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
              Train category
            </label>
            <select
              id="conc-cat"
              value={trainCategory}
              onChange={(e) => setTrainCategory(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-brand-900/40"
            >
              {TRAIN_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>

            <h2 className="mt-6 flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">
              <Users size={16} className="text-brand-600 dark:text-brand-300" />
              Who is travelling
            </h2>
            <div className="mt-2 space-y-2">
              {travellers.map((traveller, index) => {
                const category = getCategory(traveller.categoryId);
                return (
                  <div
                    key={`${traveller.categoryId}-${index}`}
                    className="rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800/60"
                  >
                    <div className="flex items-center gap-2">
                      <label htmlFor={`conc-t${index}`} className="sr-only">
                        Passenger {index + 1}
                      </label>
                      <select
                        id={`conc-t${index}`}
                        value={traveller.categoryId}
                        onChange={(e) => setTraveller(index, { categoryId: e.target.value, escort: false })}
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-brand-900/40"
                      >
                        <option value="adult">Adult — no concession</option>
                        {GROUPS.map((group) => (
                          <optgroup key={group.id} label={group.label}>
                            {categoriesInGroup(group.id).map((c) => (
                              <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {travellers.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeTraveller(index)}
                          aria-label={`Remove passenger ${index + 1}`}
                          className="shrink-0 rounded-lg border border-slate-200 p-2 text-ink-muted transition hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-rose-800"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : null}
                    </div>
                    {category?.escort ? (
                      <label className="mt-2 flex items-center gap-2 text-xs text-ink-soft dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={!!traveller.escort}
                          onChange={(e) => setTraveller(index, { escort: e.target.checked })}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-400 dark:border-slate-600"
                        />
                        This is the accompanying escort
                      </label>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {travellers.length < MAX_TRAVELLERS ? (
              <button
                type="button"
                onClick={addTraveller}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-ink-soft transition hover:border-brand-400 hover:text-brand-700 dark:border-slate-600 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:text-brand-200"
              >
                <Plus size={14} />
                Add a passenger
              </button>
            ) : null}
          </Card>

          {/* Result */}
          <div className="space-y-5 lg:col-span-3">
            {result ? (
              <>
                <Card className="overflow-hidden border-brand-300 bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white dark:border-brand-700">
                  <div className="flex items-start gap-3">
                    <BadgePercent size={28} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                        {result.lines.length} passenger{result.lines.length > 1 ? 's' : ''} · {CLASSES[classCode].label}
                      </p>
                      <p className="mt-1 font-display text-3xl font-bold leading-none">{rupees(result.total)}</p>
                      <p className="mt-2 text-sm text-white/90">
                        {result.saving > 0
                          ? `${rupees(result.saving)} less than ${rupees(result.fullTotal)} at full fare — ${Math.round((result.saving / result.fullTotal) * 100)}% off the party's ticket.`
                          : 'No concession applies to this party, so this is the ordinary fare.'}
                      </p>
                    </div>
                  </div>
                </Card>

                {result.lines.map((line, index) => (
                  <Card key={`${line.category.id}-${index}`} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-base font-bold text-ink dark:text-white">
                          {line.category.label}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-ink-soft dark:text-slate-300">
                          {line.category.blurb}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-display text-xl font-bold text-ink dark:text-white">{rupees(line.payable)}</p>
                        {line.admissible && line.percent > 0 ? (
                          <p className="mt-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            {line.percent}% off the basic fare
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {line.blockedReason ? (
                      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                        {line.blockedReason}
                      </p>
                    ) : null}

                    {line.payable > 0 ? (
                      <div className="mt-3 divide-y divide-slate-100 text-sm dark:divide-slate-700/60">
                        {line.breakdown.map((row) => (
                          <div key={row.label} className="py-2">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-ink-soft dark:text-slate-300">{row.label}</span>
                              <span className="shrink-0 font-medium text-ink dark:text-white">{rupees(row.amount)}</span>
                            </div>
                            {row.note ? (
                              <p className="mt-1 text-xs leading-relaxed text-ink-muted dark:text-slate-400">{row.note}</p>
                            ) : null}
                          </div>
                        ))}
                        {line.saving > 0 ? (
                          <div className="flex items-center justify-between py-2 text-sm font-semibold">
                            <span className="text-ink dark:text-white">Saved against {rupees(line.fullFare)}</span>
                            <span className="text-emerald-700 dark:text-emerald-300">
                              {rupees(line.saving)} · {line.effectivePercent}%
                            </span>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        No ticket, no fare.
                      </p>
                    )}

                    {line.notes.length ? (
                      <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink-soft dark:text-slate-300">
                        {line.notes.map((note) => (
                          <li key={note} className="flex gap-2">
                            <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                            {note}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {line.category.proof ? (
                      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-muted dark:text-slate-400">
                        <Info size={13} className="mt-0.5 shrink-0" />
                        <span>{line.category.proof}</span>
                      </p>
                    ) : null}

                    {line.category.confidence === 'reported' ? (
                      <p className="mt-2 text-xs leading-relaxed text-ink-muted dark:text-slate-400">
                        <strong className="font-semibold">{CONFIDENCE.reported.label}.</strong>{' '}
                        {CONFIDENCE.reported.note}
                      </p>
                    ) : null}
                  </Card>
                ))}

                <ShareResult
                  url={shareUrl}
                  title="Train concession fare — Railmonk"
                  text={`${result.lines.length} passenger${result.lines.length > 1 ? 's' : ''} in ${CLASSES[classCode].label}: about ${rupees(result.total)}.`}
                />
              </>
            ) : (
              <Card className="flex flex-col items-center justify-center p-10 text-center text-sm text-ink-muted dark:text-slate-400">
                <BadgePercent size={40} className="mb-3 text-slate-300 dark:text-slate-600" />
                Enter a distance to work out what each passenger pays.
              </Card>
            )}
          </div>
        </div>

        {/* Withdrawn categories — reference, and the answer to the commonest question here */}
        <Card className="mt-8 p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink dark:text-white">
            <ScrollText size={20} className="text-brand-600 dark:text-brand-300" />
            Concessions withdrawn in March 2020
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft dark:text-slate-300">
            Roughly fifty concession categories were suspended on 20 March 2020. Divyangjan, the listed patients and
            students came back. These did not, and no proposal to restore them has been accepted since — which is why
            they are listed here rather than left out for someone to keep searching for.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                  <th className="py-2 pr-3 font-semibold text-ink dark:text-white">Category</th>
                  <th className="py-2 font-semibold text-ink dark:text-white">What it used to be</th>
                </tr>
              </thead>
              <tbody>
                {WITHDRAWN.map((w) => (
                  <tr key={w.id} className="border-b border-slate-100 align-top dark:border-slate-700/60">
                    <td className="whitespace-nowrap py-2.5 pr-3 font-medium text-ink dark:text-white">{w.label}</td>
                    <td className="py-2.5 text-ink-soft dark:text-slate-300">{w.was}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* The rules that decide whether a concession is granted at all */}
        <Card className="mt-5 p-5">
          <h2 className="font-display text-lg font-bold text-ink dark:text-white">The rules behind every concession</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {GENERAL_RULES.map((rule) => (
              <div key={rule.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <p className="text-sm font-semibold text-ink dark:text-white">{rule.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft dark:text-slate-300">{rule.detail}</p>
              </div>
            ))}
          </div>
        </Card>

        <HowToSection
          name="How to use the Concession & Child Fare Calculator"
          description="Work out what a family or a concession holder actually pays before booking."
          steps={[
            { name: 'Set the journey', text: 'Class, distance and train category — a concession is worked out on the Mail/Express fare whatever train you take.' },
            { name: 'Add each passenger', text: 'Pick the category per person: adult, a child by age and berth choice, or a Divyangjan, patient or student concession.' },
            { name: 'Choose the berth for children', text: 'For a child aged 5 to 11 this is the whole decision — half fare without a berth, full fare with one.' },
            { name: 'Read the effective saving', text: 'Each line shows the headline percentage and what it comes to once the reservation fee, superfast charge and GST are added back.' },
            { name: 'Arrange the paperwork', text: 'Every concession needs its certificate before you book — a ticket checker cannot grant one on the train.' },
          ]}
        />

        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">
            A concession comes off the basic fare, not the ticket
          </h2>
          <p className="mt-3">
            This is the one rule that explains every disappointed conversation at a reservation counter. Indian
            Railways grants concessions on the <strong className="text-ink dark:text-white">basic fare</strong> only.
            The reservation fee, the superfast surcharge and GST are charged in full to everybody, concession or not.
          </p>
          <p className="mt-3">
            So a 75% concession in AC 3-Tier over 800 km does not produce a quarter-price ticket — it produces about{' '}
            {rupees(blindExample.payable)} against a full fare of {rupees(blindExample.fullFare)}, which is{' '}
            {blindExample.effectivePercent}% off rather than 75%. The gap widens as the journey gets shorter, because
            the fixed charges stay the same size while the basic fare shrinks. The calculator shows both numbers on
            every line for exactly this reason.
          </p>
          <h2 className="mt-8 font-display text-xl font-bold text-ink dark:text-white">
            The child fare rule changed in 2016, and the internet has not caught up
          </h2>
          <p className="mt-3">
            Before 21 April 2016, a child aged 5 to 11 paid half fare and still got a berth. Since then, half fare buys
            no berth at all — the child shares yours — and a berth of their own costs the full adult fare. Nothing about
            that has been reversed, however many pages still say otherwise.
          </p>
          <p className="mt-3">
            Over 800 km in Sleeper, the choice is roughly {rupees(childExample.payable)} sharing your berth against{' '}
            {rupees(adultExample.payable)} with one of their own. On a daytime run that is easy. On an overnight
            journey with two adults and two children it is the difference between four berths and two, and it is worth
            deciding deliberately rather than discovering at the platform.
          </p>
          <p className="mt-3">
            A child under 5 travels free but is likewise entitled to no berth, and carries no separate luggage
            allowance — their bags count against{' '}
            <a href="/rail/luggage-allowance" className="font-medium text-brand-600 underline underline-offset-2 dark:text-brand-300">
              your own free allowance
            </a>
            .
          </p>
        </div>

        <NextStep
          title="Know the fare, then get the booking window right."
          body="Concession tickets are issued at the counter and the quotas fill from the moment booking opens. The booking-date calculator tells you when that is."
          href="/rail/irctc-calculator"
          cta="Check my booking window"
          secondary={{ href: '/rail/guides/child-senior-concession-tickets', label: 'Read the concessions guide' }}
        />

        <div className="mt-8">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="August 27, 2026"
            scope="The child fare rule and the general concession rules — basic fare only, the 300 km minimum and its exemptions, counter issue — are taken from the Indian Railways general rules for concession and the 2016 child fare notification. Category percentages are reproduced from the IRCA Coaching Tariff table as published by secondary sources and are labelled as such on each result. Fare components come from the site's own fare engine and are estimates."
            sources={[
              { label: 'General Rules for Concession — Indian Railways', url: 'https://refunds.indianrail.gov.in/con_rules/conrules_general.pdf' },
              { label: 'PIB — revised child fare rule, 21 April 2016', url: 'https://www.pib.gov.in/newsite/PrintRelease.aspx?relid=138458' },
              { label: 'IRCTC Official Portal', url: 'https://www.irctc.co.in/' },
            ]}
          />
        </div>

        <div className="mt-8">
          <SearchLandingSections
            intro={(
              <>
                <p>
                  Two questions bring people here and both have a stale answer almost everywhere they are asked. Children
                  aged 5 to 11 have not automatically travelled at half fare with a berth since April 2016, and senior
                  citizens have not received a fare concession since March 2020. Neither was quietly reversed.
                </p>
                <p>
                  This calculator works out what each passenger in a party actually pays, using the same fare engine as
                  the rest of the site, and shows the one thing a percentage table cannot: what a concession comes to
                  once the reservation fee, superfast surcharge and GST are added back at full price.
                </p>
              </>
            )}
            example={(
              <p>
                Two adults and one child aged 8 travelling 800 km in Sleeper on a superfast train: the adults pay{' '}
                {rupees(adultExample.payable)} each, and the child pays {rupees(childExample.payable)} without a berth —
                a saving of {rupees(childExample.saving)}, or {childExample.effectivePercent}%, not the 50% that
                &ldquo;half fare&rdquo; implies. Ask for a berth for the child and that saving disappears entirely.
              </p>
            )}
            formula={(
              <p>
                Concessional fare = basic fare × (1 − concession %) + reservation fee + superfast surcharge + GST, with
                the last three at full rate. A child aged 5 to under 12 without a berth uses the same shape with the
                concession fixed at 50%; a child under 5 without a berth is issued no ticket at all. Concessions need a
                journey of {MIN_DISTANCE_KM} km unless the category is exempt, cannot be combined with each other, and
                are generally not admissible on Rajdhani and Shatabdi services.
              </p>
            )}
            faqItems={seoFaqItems}
          />
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center text-sm leading-relaxed text-ink-soft dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
          Informational only. Concession percentages are reproduced from the published tariff and can be revised;
          entitlement in any individual case is decided by railway staff on the certificate produced. Railmonk is not
          affiliated with Indian Railways or IRCTC.
        </div>

        <UpdatedStamp updated={getTool(HREF)?.updated} href={HREF} />

        <RelatedContent href={HREF} kind="tool" />
      </CalcLayout>
    </>
  );
};

export default ConcessionCalculator;
