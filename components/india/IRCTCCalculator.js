import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { Calendar, ExternalLink } from 'lucide-react';
import EEATPanel from '../calculator/EEATPanel';
import { editorialProfiles } from '../../utils/editorialProfiles';
import SearchLandingSections from '../calculator/SearchLandingSections';
import { buildSoftwareApplicationSchema, buildBreadcrumbSchema } from '../../utils/schema';
import { CalcLayout } from '../calculator/CalcLayout';
import HowToSection from '../calculator/HowToSection';
import { SelectField } from '../ui/Field';
import Card from '../ui/Card';
import { cn } from '../ui/cn';

const controlCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.95rem] text-ink ' +
  'shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 ' +
  'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

const IRCTCCalculator = () => {
  const [journeyDate, setJourneyDate] = useState('');
  const [passengerType, setPassengerType] = useState('general');
  const [trainType, setTrainType] = useState('mail-express');
  const [bookingResults, setBookingResults] = useState(null);

  // Booking rules based on IRCTC guidelines (effective from Nov 1, 2024)
  const bookingRules = useMemo(() => ({
    // Tatkal opens 1 day before journey (excluding journey day): AC classes
    // (incl. Premium Tatkal) at 10:00 AM, non-AC/Sleeper at 11:00 AM.
    general: {
      'mail-express': { days: 60, time: '10:00' },
      'rajdhani-shatabdi': { days: 60, time: '10:00' },
      'duronto': { days: 60, time: '10:00' },
      'premium-tatkal': { days: 1, time: '10:00' },
      'tatkal': { days: 1, time: '11:00' }
    },
    senior: {
      'mail-express': { days: 60, time: '10:00' },
      'rajdhani-shatabdi': { days: 60, time: '10:00' },
      'duronto': { days: 60, time: '10:00' },
      'premium-tatkal': { days: 1, time: '10:00' },
      'tatkal': { days: 1, time: '11:00' }
    },
    ladies: {
      'mail-express': { days: 60, time: '10:00' },
      'rajdhani-shatabdi': { days: 60, time: '10:00' },
      'duronto': { days: 60, time: '10:00' },
      'premium-tatkal': { days: 1, time: '10:00' },
      'tatkal': { days: 1, time: '11:00' }
    }
  }), []);

  const passengerTypes = useMemo(() => [
    { value: 'general', label: 'General Public', icon: '👥' },
    { value: 'senior', label: 'Senior Citizens (60+)', icon: '👴' },
    { value: 'ladies', label: 'Ladies (General)', icon: '👩' }
  ], []);

  const trainTypes = useMemo(() => [
    { value: 'mail-express', label: 'Mail/Express Trains', description: 'Regular trains' },
    { value: 'rajdhani-shatabdi', label: 'Rajdhani/Shatabdi', description: 'Premium trains' },
    { value: 'duronto', label: 'Duronto Express', description: 'Non-stop trains' },
    { value: 'premium-tatkal', label: 'Premium Tatkal', description: 'Same day booking (AC classes)' },
    { value: 'tatkal', label: 'Tatkal', description: 'Same day booking (Non-AC classes)' }
  ], []);

  const getTatkalNotes = useCallback(() => [
    'Tatkal opens exactly 1 day before journey date (excluding the journey day)',
    'AC classes (incl. Premium Tatkal): 10:00 AM; non-AC / Sleeper: 11:00 AM',
    'Higher Tatkal charges apply over the base fare',
    'Limited quota available — book as soon as the window opens'
  ], []);

  const getGeneralNotes = useCallback(() => {
    const notes = [
      'Booking opens at 10:00 AM IST',
      'Subject to availability',
      'New 60-day advance booking period effective from Nov 1, 2024',
      'Cancellation rules apply as per IRCTC policy'
    ];

    if (passengerType === 'senior') {
      notes.push('Senior citizens (60+) also follow 60-day advance booking period');
      notes.push('Concession available as per rules');
    }

    if (passengerType === 'ladies') {
      notes.push('Ladies quota is reserved within the normal 10:00 AM booking window (not a separate opening time)');
    }

    const today = new Date();
    const effectiveDate = new Date('2024-11-01');
    if (today < effectiveDate) {
      notes.unshift('Until Oct 31, 2024: 120-day advance booking period applies');
    }

    return notes;
  }, [passengerType]);

  const calculateBookingDate = useCallback(() => {
    if (!journeyDate) return;

    const journey = new Date(journeyDate);
    const rule = bookingRules[passengerType][trainType];

    // Calculate booking start date
    const bookingStart = new Date(journey);
    bookingStart.setDate(journey.getDate() - rule.days);

    // For Tatkal, booking starts 1 day before at specific times
    if (trainType.includes('tatkal')) {
      const tatkalDate = new Date(journey);
      tatkalDate.setDate(journey.getDate() - 1);

      setBookingResults({
        bookingStartDate: tatkalDate,
        bookingStartTime: rule.time + ' AM',
        journeyDate: journey,
        daysInAdvance: 1,
        passengerCategory: passengerTypes.find(p => p.value === passengerType).label,
        trainCategory: trainTypes.find(t => t.value === trainType).label,
        specialNotes: getTatkalNotes()
      });
    } else {
      setBookingResults({
        bookingStartDate: bookingStart,
        bookingStartTime: rule.time + ' AM',
        journeyDate: journey,
        daysInAdvance: rule.days,
        passengerCategory: passengerTypes.find(p => p.value === passengerType).label,
        trainCategory: trainTypes.find(t => t.value === trainType).label,
        specialNotes: getGeneralNotes()
      });
    }
  }, [journeyDate, passengerType, trainType, bookingRules, passengerTypes, trainTypes, setBookingResults, getTatkalNotes, getGeneralNotes]);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilBooking = () => {
    if (!bookingResults) return 0;
    const today = new Date();
    const bookingDate = bookingResults.bookingStartDate;
    const diffTime = bookingDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  useEffect(() => {
    if (journeyDate) {
      calculateBookingDate();
    } else {
      setBookingResults(null);
    }
  }, [journeyDate, passengerType, trainType, calculateBookingDate]);

  // Decorative moving-train animation — inject keyframes once on mount.
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes trainMove {
        0% { left: -260px; }
        100% { left: 100vw; }
      }
    `;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  const trainAnimationStyles = {
    wrapper: {
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden',
      height: '40px',
      margin: '0 0 12px 0',
      position: 'relative',
      background: 'transparent'
    },
    svg: {
      position: 'absolute',
      left: '-260px',
      right: 'auto',
      top: '4px',
      animation: 'trainMove 10s linear infinite',
      zIndex: 1,
      transform: 'none'
    }
  };

  const seoFaqItems = [
    {
      question: 'When does IRCTC general booking open?',
      answer: 'For most regular classes, booking opens at 10:00 AM IST as per current applicable booking window rules.'
    },
    {
      question: 'When does Tatkal booking open?',
      answer: 'Tatkal generally opens one day before journey date around 11:00 AM IST. Always verify final timing on the official IRCTC portal.'
    },
    {
      question: 'Can this tool guarantee seat availability?',
      answer: 'No. It helps plan booking windows and timing strategy. Final availability depends on live quota, demand, and IRCTC system status.'
    },
    {
      question: 'What is the difference between GNWL and RLWL waitlists?',
      answer: 'GNWL (General Waiting List) applies to journeys starting near the train’s origin and clears most often, because it absorbs cancellations from the largest quota. RLWL (Remote Location) and PQWL (Pooled Quota) serve intermediate stations with much smaller quotas, so equal-looking waitlist numbers can have very different chances of confirming.'
    },
    {
      question: 'What does RAC mean on a ticket?',
      answer: 'Reservation Against Cancellation — you are allowed to board and travel, typically sharing a side-lower berth with another RAC passenger, and you get a full berth if a confirmed passenger cancels. It sits between confirmed and waitlisted: travel is guaranteed, comfort is not.'
    },
    {
      question: 'Does the 60-day window apply to Tatkal bookings?',
      answer: 'No. Tatkal is a separate quota that opens one day before the journey date — 10:00 AM IST for AC classes and 11:00 AM for non-AC — regardless of when general booking opened. A Tatkal ticket also carries a maximum of 4 passengers.'
    }
  ];
  const softwareSchema = buildSoftwareApplicationSchema({
    name: 'IRCTC Advance Booking Calculator',
    url: 'https://railmonk.com/rail/irctc-calculator',
    description: 'Calculate IRCTC booking window dates and timing guidance for regular and Tatkal bookings.',
    applicationCategory: 'TravelApplication',
    featureList: [
      'Advance booking date calculator',
      'Tatkal window timing helper',
      'Booking reminder and calendar links',
      'Quota and timing guidance'
    ]
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', item: 'https://railmonk.com/' },
    { name: 'IRCTC Calculator', item: 'https://railmonk.com/rail/irctc-calculator' }
  ]);

  const daysUntil = getDaysUntilBooking();
  const todayIso = new Date().toISOString().split('T')[0];

  const detailRow = (label, value) => (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-ink-soft dark:text-slate-300">{label}</span>
      <span className="font-medium text-ink dark:text-white">{value}</span>
    </div>
  );

  const calendarLinkCls =
    'flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-white no-underline transition hover:opacity-90';

  return (
    <>
      <Head>
        <title>IRCTC Booking Charges Calculator | Train Ticket Fee Tool | Railmonk</title>
        <meta name="description" content="IRCTC Booking Charges Calculator. Compute convenience fees & payment gateway charges for train ticket classes (Sleeper, 3A, 2A, CC, etc)." />
        <meta name="keywords" content="IRCTC calculator, train booking charges, railway ticket fees, IRCTC convenience fee" />
        <link rel="canonical" href="https://railmonk.com/rail/irctc-calculator" />
        <meta property="og:title" content="IRCTC Booking Charges Calculator | Railmonk" />
        <meta property="og:description" content="Calculate IRCTC booking & payment gateway charges for all classes." />
        <meta property="og:url" content="https://railmonk.com/rail/irctc-calculator" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="IRCTC Booking Charges Calculator | Railmonk" />
        <meta name="twitter:description" content="IRCTC train ticket booking fee & convenience charge calculator." />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="India · Travel"
        title="IRCTC Advance Booking Calculator"
        subtitle="Find out exactly when your train ticket booking window opens — for general, quota, and Tatkal bookings."
      >
        {/* Decorative moving train */}
        <div style={trainAnimationStyles.wrapper} aria-hidden="true">
          <svg style={trainAnimationStyles.svg} viewBox="0 0 260 40" width="260" height="40">
            {/* Coach 3 */}
            <g>
              <rect x="8" y="14" width="44" height="16" rx="3" fill="#888" />
              <rect x="14" y="18" width="8" height="6" rx="1" fill="#fff" />
              <rect x="28" y="18" width="8" height="6" rx="1" fill="#fff" />
              <rect x="42" y="18" width="8" height="6" rx="1" fill="#fff" />
              <circle cx="20" cy="30" r="3" fill="#444" />
              <circle cx="36" cy="30" r="3" fill="#444" />
              <circle cx="52" cy="30" r="3" fill="#444" />
            </g>
            {/* Coach 2 */}
            <g>
              <rect x="58" y="14" width="44" height="16" rx="3" fill="#888" />
              <rect x="64" y="18" width="8" height="6" rx="1" fill="#fff" />
              <rect x="78" y="18" width="8" height="6" rx="1" fill="#fff" />
              <rect x="92" y="18" width="8" height="6" rx="1" fill="#fff" />
              <circle cx="70" cy="30" r="3" fill="#444" />
              <circle cx="86" cy="30" r="3" fill="#444" />
              <circle cx="102" cy="30" r="3" fill="#444" />
            </g>
            {/* Coach 1 */}
            <g>
              <rect x="108" y="14" width="44" height="16" rx="3" fill="#888" />
              <rect x="114" y="18" width="8" height="6" rx="1" fill="#fff" />
              <rect x="128" y="18" width="8" height="6" rx="1" fill="#fff" />
              <rect x="142" y="18" width="8" height="6" rx="1" fill="#fff" />
              <circle cx="120" cy="30" r="3" fill="#444" />
              <circle cx="136" cy="30" r="3" fill="#444" />
              <circle cx="152" cy="30" r="3" fill="#444" />
            </g>
            {/* WAP-7 Engine */}
            <g>
              <rect x="158" y="14" width="54" height="16" rx="3" fill="#e0e0e0" stroke="#2d3a4b" strokeWidth="1" />
              <rect x="158" y="22" width="54" height="4" fill="#c00" />
              <text x="170" y="21" fontSize="8" fontFamily="'Source Sans 3', sans-serif" fill="#c00" fontWeight="bold">IR</text>
              <circle cx="210" cy="22" r="2" fill="#ff0" stroke="#aaa" strokeWidth="0.5" />
              <rect x="212" y="24" width="4" height="6" rx="1" fill="#444" />
              <circle cx="170" cy="30" r="3.5" fill="#444" />
              <circle cx="188" cy="30" r="3.5" fill="#444" />
              <circle cx="206" cy="30" r="3.5" fill="#444" />
            </g>
          </svg>
        </div>

        <div className="grid gap-5 lg:grid-cols-5">
          {/* Input Panel */}
          <Card className="p-5 lg:col-span-2">
            <div className="space-y-4">
              <div>
                <label htmlFor="irctc-date" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">Journey date</label>
                <input
                  id="irctc-date"
                  type="date"
                  value={journeyDate}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (selectedDate >= today) {
                      setJourneyDate(e.target.value);
                    }
                  }}
                  min={todayIso}
                  className={controlCls}
                />
              </div>

              <SelectField
                id="irctc-passenger"
                label="Passenger category"
                value={passengerType}
                onChange={setPassengerType}
                options={passengerTypes.map((t) => ({ value: t.value, label: `${t.icon} ${t.label}` }))}
              />

              <SelectField
                id="irctc-train"
                label="Train category"
                value={trainType}
                onChange={setTrainType}
                options={trainTypes.map((t) => ({ value: t.value, label: `${t.label} — ${t.description}` }))}
              />

              <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3 text-sm dark:border-teal-800/60 dark:bg-teal-900/20">
                <p className="font-semibold text-teal-800 dark:text-teal-300">All times in IST (UTC+5:30)</p>
                <p className="mt-0.5 text-teal-700 dark:text-teal-400">
                  60-day advance booking period applies for regular bookings (from Nov 1, 2024).
                </p>
              </div>
            </div>
          </Card>

          {/* Results Panel */}
          <div className="space-y-5 lg:col-span-3">
            {bookingResults ? (
              <>
                {/* Booking opens */}
                <Card className="overflow-hidden border-brand-200 bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white dark:border-brand-700">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Booking opens</p>
                      <p className="mt-1 font-display text-lg font-bold leading-tight">{formatDate(bookingResults.bookingStartDate)}</p>
                      <p className="mt-0.5 text-sm text-white/85">at {bookingResults.bookingStartTime}</p>
                    </div>
                    <div className="shrink-0 rounded-xl bg-white/15 px-4 py-3 text-center">
                      <div className="font-display text-2xl font-bold leading-none">{daysUntil}</div>
                      <div className="mt-0.5 text-xs text-white/85">{daysUntil === 1 ? 'day' : 'days'} {daysUntil > 0 ? 'left' : daysUntil === 0 ? '' : 'ago'}</div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg bg-white/10 px-3 py-2 text-center text-sm">
                    {daysUntil > 0
                      ? 'Mark your calendar to book your tickets on time!'
                      : daysUntil === 0
                        ? 'Booking is available now! Visit the IRCTC website.'
                        : 'Booking date has passed.'}
                  </div>
                  <a
                    href="https://www.irctc.co.in/nget/train-search"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-50"
                  >
                    Book on the official IRCTC portal <ExternalLink size={15} strokeWidth={2.2} />
                  </a>
                </Card>

                {/* Add to calendar */}
                <Card className="p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">
                    <Calendar size={16} className="text-brand-600 dark:text-brand-300" />
                    Add to calendar
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=IRCTC Booking Opens - ${bookingResults.trainCategory}&dates=${bookingResults.bookingStartDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${bookingResults.bookingStartDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=Train booking opens for ${bookingResults.trainCategory}%0A%0APassenger Type: ${bookingResults.passengerCategory}%0AJourney Date: ${formatDate(bookingResults.journeyDate)}%0ABooking Time: ${bookingResults.bookingStartTime}%0A%0AVisit IRCTC website to book tickets: https://www.irctc.co.in&location=IRCTC Website`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={calendarLinkCls}
                      style={{ backgroundColor: '#ea4335' }}
                    >
                      <Calendar size={18} />
                      Google
                    </a>
                    <a
                      href={`https://outlook.live.com/calendar/0/deeplink/compose?subject=IRCTC Booking Opens - ${bookingResults.trainCategory}&startdt=${bookingResults.bookingStartDate.toISOString()}&enddt=${bookingResults.bookingStartDate.toISOString()}&body=Train booking opens for ${bookingResults.trainCategory}%0D%0A%0D%0APassenger Type: ${bookingResults.passengerCategory}%0D%0AJourney Date: ${formatDate(bookingResults.journeyDate)}%0D%0ABooking Time: ${bookingResults.bookingStartTime}%0D%0A%0D%0AVisit IRCTC website to book tickets: https://www.irctc.co.in&location=IRCTC Website`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={calendarLinkCls}
                      style={{ backgroundColor: '#0078d4' }}
                    >
                      <Calendar size={18} />
                      Outlook
                    </a>
                    <a
                      href={`data:text/calendar;charset=utf8,BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${bookingResults.bookingStartDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${bookingResults.bookingStartDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:IRCTC Booking Opens - ${bookingResults.trainCategory}
DESCRIPTION:Train booking opens for ${bookingResults.trainCategory}\\n\\nPassenger Type: ${bookingResults.passengerCategory}\\nJourney Date: ${formatDate(bookingResults.journeyDate)}\\nBooking Time: ${bookingResults.bookingStartTime}\\n\\nVisit IRCTC website to book tickets: https://www.irctc.co.in
LOCATION:IRCTC Website
END:VEVENT
END:VCALENDAR`}
                      download="irctc_booking_reminder.ics"
                      className={calendarLinkCls}
                      style={{ backgroundColor: '#4f46e5' }}
                    >
                      <Calendar size={18} />
                      iCal
                    </a>
                  </div>
                </Card>

                {/* Journey details */}
                <Card className="p-5">
                  <h3 className="font-display text-base font-bold text-ink dark:text-white">Journey details</h3>
                  <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-700">
                    {detailRow('Journey date', formatDate(bookingResults.journeyDate))}
                    {detailRow('Passenger type', bookingResults.passengerCategory)}
                    {detailRow('Train type', bookingResults.trainCategory)}
                    {detailRow('Advance period', `${bookingResults.daysInAdvance} days`)}
                  </div>
                </Card>

                {/* Important notes */}
                <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50/70 p-4 dark:border-amber-500 dark:bg-amber-900/20">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Important notes</p>
                  <ul className="mt-2 space-y-1 text-sm text-amber-800/90 dark:text-amber-200/90">
                    {bookingResults.specialNotes.map((note, index) => (
                      <li key={index} className="flex gap-2"><span aria-hidden="true">•</span><span>{note}</span></li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <Card className="flex flex-col items-center justify-center p-10 text-center text-sm text-ink-muted dark:text-slate-400">
                <Calendar size={40} className="mb-3 text-slate-300 dark:text-slate-600" />
                Select your journey date to see when booking opens.
              </Card>
            )}
          </div>
        </div>

        <HowToSection
          name="How to use the IRCTC Advance Booking Calculator"
          description="Find out when your train ticket booking window opens and set a reminder."
          steps={[
            { name: 'Enter your journey date', text: 'Pick the date you plan to travel using the date selector.' },
            { name: 'Choose your passenger category', text: 'Select General, Senior Citizen, or Ladies to apply the right quota rules.' },
            { name: 'Select the train category', text: 'Pick Mail/Express, Rajdhani/Shatabdi, Duronto, or a Tatkal option.' },
            { name: 'See when booking opens', text: 'The calculator shows the exact booking-open date, IST opening time, and a days-left countdown.' },
            { name: 'Set a reminder', text: 'Add the booking window to Google Calendar, Outlook, or download an iCal file so you never miss it.' }
          ]}
        />

        {/* Advance booking rules */}
        <div className="mt-10">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">IRCTC advance booking rules</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'General booking (from Nov 1, 2024)',
                items: ['Mail/Express: 60 days advance', 'Rajdhani/Shatabdi: 60 days advance', 'Duronto Express: 60 days advance', 'Opening time: 10:00 AM IST', 'Valid for all passenger types', 'Applicable for all classes', 'Subject to quota availability']
              },
              {
                title: 'Special quotas & timings',
                items: ['Tatkal AC classes: 10:00 AM (1 day before)', 'Tatkal non-AC / Sleeper: 11:00 AM (1 day before)', 'Premium Tatkal: AC classes, dynamic pricing', 'Senior Citizen: 60 days advance', 'Foreign Tourist: 365 days advance', 'Disabled Quota: 60 days advance', 'Defence Quota: Special rules apply']
              },
              {
                title: 'Important guidelines',
                items: ['Valid ID proof mandatory', 'Max 6 tickets per month (general)', 'Max 12 tickets for verified users', 'Tatkal: Max 4 passengers per ticket', 'No agent booking in Tatkal (10-12 AM)', 'Cancellation rules vary by class', 'Keep checking RAC/Waitlist status']
              }
            ].map((col) => (
              <Card key={col.title} className="p-5">
                <h4 className="font-semibold text-brand-700 dark:text-brand-300">{col.title}</h4>
                <ul className="mt-2 space-y-1 text-sm text-ink-muted dark:text-slate-400">
                  {col.items.map((item) => (
                    <li key={item} className="flex gap-2"><span aria-hidden="true">•</span><span>{item}</span></li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">Why the booking date is the whole game</h2>
          <p className="mt-3">
            On popular routes, confirmed berths disappear within minutes of the window opening — sometimes within
            seconds around festivals. That turns a simple question, &ldquo;when exactly can I book?&rdquo;, into
            the difference between a confirmed sleeper berth and a three-digit waitlist. The arithmetic trips
            people in two places: the 60-day general window is counted excluding the journey day, and Tatkal
            follows its own clock entirely — one day before the journey, at different times for AC and non-AC
            classes. This tool exists to do that date math and let you set the reminder.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">A worked example: five people to a wedding</h3>
          <p className="mt-3">
            Ananya needs five sleeper berths to Lucknow for a family wedding on a Friday. Her best option is the
            general window: the calculator gives her the exact opening date roughly two months out, at 10:00 AM
            IST, and she books all five on one ticket the moment it opens. If she misses it, the fallback splits
            into two problems: Tatkal opens the Thursday before at 11:00 AM for sleeper (10:00 for AC), and a
            Tatkal ticket carries at most four passengers — so five people means two tickets, booked in a quota
            that often empties in the first minutes. The lesson generalizes: the general window rewards planning
            once; Tatkal punishes everyone equally.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">Living with the 60-day window</h3>
          <p className="mt-3">
            The advance reservation period was halved from 120 to 60 days on 1 November 2024. The practical
            effects cut both ways. Trips can no longer be locked in a season ahead, so holiday travel now needs a
            calendar reminder two months out. But the shorter window also squeezed out speculative booking —
            tickets bought &ldquo;just in case&rdquo; and cancelled later — which had inflated apparent demand
            and fed the waitlist churn. Availability at opening now reflects real intent more than it used to.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">A Tatkal opening, run properly</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li><strong className="text-ink dark:text-white">Before the clock:</strong> log in early (sessions started at 9:58 beat logins at 10:00), and have every traveller saved in your master passenger list — typing names during the rush is where bookings die.</li>
            <li><strong className="text-ink dark:text-white">Payment:</strong> keep one fast method ready and pre-authorized; a payment that bounces at 10:02 usually means starting over against an emptier quota.</li>
            <li><strong className="text-ink dark:text-white">Know your hour:</strong> AC classes open at 10:00, sleeper and other non-AC at 11:00 — two separate chances if your class is flexible. Agents are barred from booking in the opening window, which keeps the first minutes for individual users.</li>
            <li><strong className="text-ink dark:text-white">Premium Tatkal</strong> is the paid escape hatch: dynamic pricing on AC classes, so you trade money for probability. Worth it when the journey is non-negotiable; poor value when a waitlist would likely clear anyway.</li>
          </ul>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">Reading a waitlisted ticket</h3>
          <p className="mt-3">
            The status code matters as much as the number. <strong className="text-ink dark:text-white">CNF</strong>{' '}
            is a berth. <strong className="text-ink dark:text-white">RAC</strong> guarantees travel — typically a
            shared side-lower berth — and upgrades to a full berth as confirmed passengers cancel.{' '}
            <strong className="text-ink dark:text-white">WL</strong> means no travel unless it clears, and the
            prefix tells you the odds: GNWL draws on the origin station&rsquo;s large quota and clears most
            reliably, while RLWL and PQWL pool much smaller allocations for intermediate stations — a GNWL 20 is
            routinely a better bet than an RLWL 8. Checking which waitlist a route uses, before booking, is the
            single most underrated habit in Indian rail planning.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">Charges people conflate</h3>
          <p className="mt-3">
            The fare on the ticket is the railway&rsquo;s; the convenience fee added at checkout is IRCTC&rsquo;s
            platform charge and varies by payment method — one reason the same journey can cost slightly different
            amounts on different bookings. Tatkal adds its own premium over base fare, and Premium Tatkal replaces
            fixed pricing with demand-based fares altogether. When comparing the &ldquo;cost of a ticket,&rdquo;
            be clear which of the three layers moved. And if plans change after booking, cancellation has its own
            fee structure — the{' '}
            <a href="/rail/irctc-cancellation-calculator" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">IRCTC cancellation charges calculator</a>{' '}
            estimates your refund under the April 2026 72h/24h/8h rules.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">Using this page well</h3>
          <p className="mt-3">
            Enter the journey date the moment travel plans firm up, add the calendar reminder the tool generates,
            and book at opening. If the date is inside the 60-day window already, check the general quota first
            and treat Tatkal as the fallback it was designed to be. Booking Tatkal anyway? Check the real premium
            with the{' '}
            <a href="/rail/tatkal-charges-calculator" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">Tatkal charges calculator</a>, and know your exit cost up front with the{' '}
            <a href="/rail/irctc-cancellation-calculator" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">cancellation refund calculator</a>.
          </p>
        </div>

        <div className="mt-8">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="March 7, 2026"
            scope="Booking-window output is based on modeled IRCTC timing rules and should be verified against official portal notices."
            sources={[
              { label: 'IRCTC Official Portal', url: 'https://www.irctc.co.in/' },
              { label: 'Indian Railways', url: 'https://indianrailways.gov.in/' },
              { label: 'Railway Enquiry', url: 'https://enquiry.indianrail.gov.in/' }
            ]}
          />
        </div>

        <div className="mt-8">
          <SearchLandingSections
            intro={(
              <>
                <p>
                  IRCTC booking timing queries are highly intent-driven: users usually need exact opening windows for
                  regular and Tatkal booking, not long documentation. This page combines timing logic and practical
                  booking planning so you can avoid missing critical windows.
                </p>
                <p>
                  Use this tool before important travel bookings to calculate booking date, time, and quota context in
                  one place.
                </p>
              </>
            )}
            example={(
              <p>
                If your journey date is April 30 and the train follows a 60-day advance window, booking date is derived
                by moving back the configured days and applying opening-time logic. For Tatkal journeys, the calculator
                applies one-day window rules with expected opening time to help you prepare in advance.
              </p>
            )}
            formula={(
              <p>
                Core logic: booking date = journey date minus applicable advance-booking days, then attach quota-specific
                opening time (regular, Tatkal, or other selected quota category). Display layers then provide category
                labels, reminders, and practical timing guidance for real booking behavior.
              </p>
            )}
            faqItems={seoFaqItems}
            relatedLinks={[
              { label: 'IRCTC Cancellation Charges Calculator', href: '/rail/irctc-cancellation-calculator' },
              { label: 'Tatkal Charges Calculator', href: '/rail/tatkal-charges-calculator' },
              { label: 'TDR Refund Checker', href: '/rail/tdr-refund-checker' },
              { label: 'Train Berth Position Finder', href: '/rail/berth-position-finder' },
              { label: 'IRCTC and Booking Strategy Guide', href: '/rail/guides/irctc-booking-strategy' }
            ]}
          />
        </div>

        <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-center text-sm leading-relaxed text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          All times shown are in IST (UTC+5:30). This calculator is for informational purposes only and is not affiliated with Indian Railways or IRCTC. For official information, visit{' '}
          <a href="https://www.irctc.co.in" target="_blank" rel="noopener noreferrer" className="font-medium underline">IRCTC website</a>. Rules and timings may change without notice.
        </div>
      </CalcLayout>
    </>
  );
};

export default IRCTCCalculator;
