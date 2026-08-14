// Single source of truth for every tool and guide on the site.
//
// Navbar, footer, homepage, /guides, related-link blocks and the sitemap check
// all read from here, so a new page is added in exactly one place and can never
// go missing from navigation the way pages used to.
//
// `updated` is the date the page's rules or content were last reviewed — it is
// what renders as "Updated <date>" and what feeds sitemap lastmod. Keep it
// honest: bump it only when the page actually changed.

export const CATEGORIES = [
  { id: 'booking', label: 'Booking', blurb: 'When your window opens and how to be ready for it.' },
  { id: 'tatkal', label: 'Tatkal', blurb: 'The one-day quota — timings, premiums, and tactics.' },
  { id: 'refunds', label: 'Cancellation & refunds', blurb: 'What you get back, and what you have to claim.' },
  { id: 'waitlist', label: 'Waitlist & RAC', blurb: 'Reading a waitlist code and judging your real odds.' },
  { id: 'fares', label: 'Fares & charges', blurb: 'What the ticket price is actually made of.' },
  { id: 'coaches', label: 'Coaches & berths', blurb: 'Where your berth is, and where your coach stops.' },
  { id: 'planning', label: 'Train planning', blurb: 'Charts, journeys, and the timeline around your trip.' },
  { id: 'rules', label: 'Rules & penalties', blurb: 'What you may carry, and what it costs when a rule is broken.' },
  { id: 'world', label: 'Trains abroad', blurb: 'The rules that replace the Indian ones once you leave the network.' },
];

export const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || '';

// `titleHi` / `blurbHi` exist only on entries that have a Hindi page. Anything
// without them falls back to English rather than showing a gap — a Hindi reader
// following a link to an untranslated tool should still see what it is called.
export const localizedTitle = (entry, locale = 'en') =>
  (locale === 'hi' && entry?.titleHi) || entry?.title || '';

export const localizedBlurb = (entry, locale = 'en') =>
  (locale === 'hi' && entry?.blurbHi) || entry?.blurb || '';

// ── Tools ───────────────────────────────────────────────────────────────────
// `blurb` is the one-sentence explanation shown on cards and category lists.
// `icon` is a lucide-react icon name resolved by the consuming component.
//
// `keywords` never renders — it exists only to feed site search. Put the words
// a traveller would actually type here, including abbreviations (ARP, GNWL),
// the phrasing of the question ("when can I book"), and the odd Hinglish term.
// The search engine handles plurals, prefixes and typos on its own, so there is
// no point listing "refunds" next to "refund".
export const TOOLS = [
  {
    href: '/rail/irctc-calculator',
    title: 'IRCTC Booking Date Calculator',
    titleHi: 'IRCTC बुकिंग तिथि कैलकुलेटर',
    nav: 'Booking Date Calculator',
    blurb: 'Find the exact date and time your ticket window opens — general quota and Tatkal.',
    blurbHi: 'जानिए आपकी टिकट बुकिंग किस तारीख और समय पर खुलेगी — जनरल कोटा और तत्काल, दोनों के लिए।',
    keywords: [
      'ARP', 'advance reservation period', 'ARP full form', '60 day rule', '120 days', 'booking window',
      'when can I book', 'booking opens', 'booking not opened', 'reservation opens', 'general quota', '8 am',
      'foreign tourist quota', '365 days', 'suvidha', 'special trains', 'ticket kab milega', 'countdown',
    ],
    category: 'booking',
    icon: 'CalendarClock',
    updated: '2026-08-02',
    relatedTools: ['/rail/booking-reminder', '/rail/tatkal-charges-calculator', '/rail/chart-preparation-time'],
    relatedGuides: ['/rail/guides/irctc-booking-strategy', '/rail/guides/how-to-book-train-ticket-online'],
    featured: true,
  },
  {
    href: '/rail/irctc-cancellation-calculator',
    title: 'Cancellation Refund Calculator',
    titleHi: 'टिकट रद्दीकरण रिफंड कैलकुलेटर',
    nav: 'Cancellation Refund Calculator',
    blurb: 'See the rupee amount you actually get back before you cancel, under the current refund slabs.',
    blurbHi: 'टिकट रद्द करने से पहले जानिए कि मौजूदा रिफंड नियमों के तहत आपको असल में कितने रुपये वापस मिलेंगे।',
    keywords: [
      'cancel ticket', 'refund amount', 'cancellation charge', 'clerkage', 'how much refund',
      'confirmed ticket', 'RAC cancellation', 'GST', 'refund slab', '48 hours', '12 hours',
      'paisa wapas', 'ticket cancel karna',
    ],
    category: 'refunds',
    icon: 'TicketX',
    updated: '2026-07-24',
    relatedTools: ['/rail/tdr-refund-checker', '/rail/train-fare-calculator'],
    relatedGuides: ['/rail/guides/irctc-booking-strategy'],
    featured: true,
  },
  {
    href: '/rail/chart-preparation-time',
    title: 'Chart Preparation Time Calculator',
    nav: 'Chart Preparation Time',
    blurb: 'Work out when your train’s first and final reservation charts are prepared — the moment a waitlist stops moving.',
    keywords: [
      'chart', 'charting', 'first chart', 'final chart', 'second chart', 'chart prepared',
      '10 hours before departure', '8 hours', 'berth allotment', 'current booking',
      'when does waitlist stop moving', 'chart status',
    ],
    category: 'planning',
    icon: 'ClipboardList',
    updated: '2026-07-24',
    relatedTools: ['/rail/waitlist-confirmation-chances', '/rail/tdr-refund-checker', '/rail/coach-position-finder'],
    relatedGuides: ['/rail/guides/waitlist-rac-guide'],
    featured: true,
    isNew: true,
  },
  {
    href: '/rail/tatkal-charges-calculator',
    title: 'Tatkal Charges Calculator',
    titleHi: 'तत्काल शुल्क कैलकुलेटर',
    nav: 'Tatkal Charges Calculator',
    blurb: 'Know the real Tatkal premium over the base fare for your class and distance before you pay it.',
    blurbHi: 'भुगतान से पहले जानिए कि आपकी श्रेणी और दूरी पर बेस किराये के ऊपर तत्काल का असली प्रीमियम कितना बनता है।',
    keywords: [
      'tatkal premium', 'tatkal charge', 'tatkal time', 'tatkal booking time', '10 am', '11 am',
      'premium tatkal', 'AC tatkal', 'sleeper tatkal', 'extra charge', 'Aadhaar OTP',
      'tatkal kitna extra',
    ],
    category: 'tatkal',
    icon: 'Zap',
    updated: '2026-07-24',
    relatedTools: ['/rail/booking-reminder', '/rail/train-fare-calculator', '/rail/irctc-calculator'],
    relatedGuides: ['/rail/guides/tatkal-booking-masterclass'],
  },
  {
    href: '/rail/waitlist-confirmation-chances',
    title: 'Waitlist Confirmation Chances',
    titleHi: 'वेटिंग लिस्ट कन्फर्म होने की संभावना',
    nav: 'Waitlist Confirmation Chances',
    blurb: 'Decode GNWL, RLWL, PQWL and TQWL — and get an honest estimate of whether your ticket will confirm.',
    blurbHi: 'GNWL, RLWL, PQWL और TQWL का मतलब समझिए — और जानिए कि आपका टिकट कन्फर्म होने की सही संभावना कितनी है।',
    keywords: [
      'WL', 'GNWL', 'RLWL', 'PQWL', 'TQWL', 'RSWL', 'RAC', 'CNF', 'waitlist code',
      'confirmation chance', 'will my ticket confirm', 'waiting list position', 'clear hoga',
    ],
    category: 'waitlist',
    icon: 'ListOrdered',
    updated: '2026-07-24',
    relatedTools: ['/rail/chart-preparation-time', '/rail/tdr-refund-checker'],
    relatedGuides: ['/rail/guides/waitlist-rac-guide'],
    featured: true,
  },
  {
    href: '/rail/tdr-refund-checker',
    title: 'TDR Refund Checker',
    nav: 'TDR Refund Checker',
    blurb: 'Check whether your situation qualifies for a TDR refund, what share you can claim, and the filing deadline.',
    keywords: [
      'TDR', 'file TDR', 'ticket deposit receipt', 'train cancelled', 'train late',
      'AC not working', 'missed train', 'refund claim', 'filing deadline', '72 hours',
      'did not travel', 'partially travelled',
    ],
    category: 'refunds',
    icon: 'FileCheck',
    updated: '2026-07-24',
    relatedTools: ['/rail/irctc-cancellation-calculator', '/rail/chart-preparation-time'],
    relatedGuides: ['/rail/guides/waitlist-rac-guide'],
  },
  {
    href: '/rail/train-fare-calculator',
    title: 'Train Fare Calculator',
    nav: 'Train Fare Calculator',
    blurb: 'Estimate the fare from distance and class — base fare, reservation fee, superfast charge and GST itemised.',
    keywords: [
      'fare', 'ticket price', 'how much is the ticket', 'base fare', 'reservation charge',
      'superfast charge', 'GST', 'distance', 'sleeper fare', 'AC fare', '3A', '2A', '1A',
      'CC', 'EC', '2S', 'kitna lagega',
    ],
    category: 'fares',
    icon: 'BadgeIndianRupee',
    updated: '2026-07-24',
    relatedTools: ['/rail/tatkal-charges-calculator', '/rail/irctc-cancellation-calculator'],
    relatedGuides: ['/rail/guides/train-classes-explained'],
  },
  {
    href: '/rail/berth-position-finder',
    title: 'Berth Position Finder',
    nav: 'Berth Position Finder',
    blurb: 'Turn a seat number into its position in the coach — lower, middle, upper or side — before you board.',
    keywords: [
      'berth', 'lower berth', 'middle berth', 'upper berth', 'side lower', 'side upper',
      'seat number', 'which berth', 'coach layout', '72 berths', 'sleeper layout',
      'berth position', 'window seat',
    ],
    category: 'coaches',
    icon: 'BedDouble',
    updated: '2026-07-24',
    relatedTools: ['/rail/coach-position-finder', '/rail/waitlist-confirmation-chances'],
    relatedGuides: ['/rail/guides/train-classes-explained'],
  },
  {
    href: '/rail/coach-position-finder',
    title: 'Coach Position Finder',
    nav: 'Coach Position Finder',
    blurb: 'See where coach S4, B2 or A1 typically stands so you wait at the right end of the platform.',
    keywords: [
      'coach position', 'S4', 'B2', 'A1', 'platform', 'where to stand', 'engine',
      'train composition', 'coach sequence', 'front or rear', 'coach layout', 'pantry car',
    ],
    category: 'coaches',
    icon: 'MapPin',
    updated: '2026-07-24',
    relatedTools: ['/rail/berth-position-finder', '/rail/chart-preparation-time'],
    relatedGuides: ['/rail/guides/train-classes-explained', '/rail/guides/vande-bharat-guide'],
  },
  {
    href: '/rail/booking-reminder',
    title: 'Booking & Tatkal Reminders',
    nav: 'Booking & Tatkal Reminders',
    blurb: 'Put the exact moment your booking window opens into your own calendar, with an alert before it starts.',
    keywords: [
      'reminder', 'alert', 'notification', 'calendar', 'ICS file', 'Google Calendar',
      'Outlook', 'tatkal alarm', 'booking alarm', 'never miss the window', 'set a reminder',
    ],
    category: 'booking',
    icon: 'BellRing',
    updated: '2026-07-24',
    relatedTools: ['/rail/irctc-calculator', '/rail/saved-journeys', '/rail/tatkal-charges-calculator'],
    relatedGuides: ['/rail/guides/tatkal-booking-masterclass', '/rail/guides/irctc-booking-strategy'],
    featured: true,
    isNew: true,
  },
  {
    href: '/rail/saved-journeys',
    title: 'Saved Journeys',
    nav: 'Saved Journeys',
    blurb: 'Keep your upcoming trips in one place with a countdown to each booking window, chart time and refund cut-off.',
    keywords: [
      'saved trips', 'my journeys', 'upcoming trip', 'trip list', 'bookmark', 'countdown',
      'my bookings', 'planned journeys',
    ],
    category: 'planning',
    icon: 'Bookmark',
    updated: '2026-07-24',
    relatedTools: ['/rail/booking-reminder', '/rail/chart-preparation-time', '/rail/irctc-calculator'],
    relatedGuides: ['/rail/guides/irctc-booking-strategy'],
    isNew: true,
  },
  {
    href: '/world/delay-compensation',
    title: 'Train Delay Compensation Checker',
    nav: 'Delay Compensation (abroad)',
    blurb: 'See what a delayed train owes you in the EU, the UK, Switzerland, the US or Australia — the percentage, the amount and the deadline.',
    keywords: [
      'delay compensation', 'train late abroad', 'EU 261 train', '2021/782', 'passenger rights',
      'Delay Repay', 'Delay Repay 15', 'Delay Repay 30', 'Eurostar delay', 'Amtrak delay',
      'SBB delay', 'refund for late train', 'compensation claim', 'how late for compensation',
      'Europe train delayed', 'V/Line compensation',
    ],
    category: 'world',
    icon: 'Scale',
    updated: '2026-07-31',
    relatedTools: ['/world/booking-windows', '/rail/tdr-refund-checker', '/rail/irctc-cancellation-calculator'],
    relatedGuides: ['/rail/guides/train-classes-explained'],
    isNew: true,
  },
  {
    href: '/world/booking-windows',
    title: 'International Booking Window Calculator',
    nav: 'Booking Windows (abroad)',
    blurb: 'When tickets go on sale for Amtrak, Deutsche Bahn, Eurostar, SNCF, Trenitalia, NSW TrainLink and more.',
    keywords: [
      'booking window abroad', 'advance booking', 'when do tickets go on sale', 'Amtrak 11 months',
      'Deutsche Bahn 12 months', 'Eurostar booking', 'SNCF booking opens', 'Trenitalia booking',
      'Renfe booking window', 'booking horizon', 'advance tickets', 'NSW TrainLink booking',
      'Ghan booking', 'how early can I book', 'Europe train tickets',
    ],
    category: 'world',
    icon: 'Globe2',
    updated: '2026-07-31',
    relatedTools: ['/world/delay-compensation', '/rail/irctc-calculator', '/rail/booking-reminder'],
    relatedGuides: ['/rail/guides/irctc-booking-strategy'],
    isNew: true,
  },
  {
    href: '/rail/luggage-allowance',
    title: 'Luggage Allowance & Excess Charges',
    nav: 'Luggage Allowance',
    blurb: 'How much you can carry free by class, the size limit per piece, and what unbooked excess costs at six times the rate.',
    keywords: [
      'luggage allowance', 'how much luggage', 'baggage limit', 'weight limit', 'excess luggage',
      'luggage charges', 'free allowance', 'suitcase size', 'trunk size', 'brake van', 'parcel office',
      'saman', 'train me kitna saman le ja sakte hain', 'bag limit', 'pet dog train', 'carry dog',
      'prohibited items', 'gas cylinder train', 'child luggage',
    ],
    category: 'rules',
    icon: 'Briefcase',
    updated: '2026-08-14',
    relatedTools: ['/rail/penalty-calculator', '/rail/train-fare-calculator', '/rail/berth-position-finder'],
    relatedGuides: ['/rail/guides/train-travel-rules'],
    isNew: true,
  },
  {
    href: '/rail/penalty-calculator',
    title: 'Penalty & Excess Fare Calculator',
    nav: 'Penalties & Excess Fare',
    blurb: 'What a ticket checker can charge for no ticket, no ID, a higher class or travelling past your station.',
    keywords: [
      'penalty', 'fine', 'without ticket', 'ticketless travel', 'ticket checker', 'TTE fine',
      '250 penalty', 'excess fare', 'Section 138', 'Section 137', 'Railways Act', 'no ID proof',
      'ID card e-ticket', 'higher class', 'upgrade penalty', 'beyond destination', 'alarm chain fine',
      'bina ticket', 'jurmana', 'railway fine',
    ],
    category: 'rules',
    icon: 'Gavel',
    updated: '2026-08-14',
    relatedTools: ['/rail/luggage-allowance', '/rail/train-fare-calculator', '/rail/tdr-refund-checker'],
    relatedGuides: ['/rail/guides/train-travel-rules', '/rail/guides/rail-madad-139-complaints'],
    isNew: true,
  },
  {
    href: '/world/rail-pass-calculator',
    title: 'Rail Pass Break-Even Calculator',
    nav: 'Rail Pass vs Tickets',
    blurb: 'Is an Interrail or Eurail pass worth it? Compare it against point-to-point tickets with reservation fees counted in.',
    keywords: [
      'Interrail', 'Eurail', 'rail pass', 'is Interrail worth it', 'break even', 'global pass',
      'flexi pass', 'travel days', 'point to point tickets', 'Europe train pass', 'youth pass',
      'Interrail price', 'pass vs tickets', 'backpacking Europe', 'Eurail calculator',
    ],
    category: 'world',
    icon: 'Sparkles',
    updated: '2026-08-14',
    relatedTools: ['/world/reservation-required', '/world/booking-windows', '/world/delay-compensation'],
    relatedGuides: ['/rail/guides/irctc-booking-strategy'],
    isNew: true,
  },
  {
    href: '/world/reservation-required',
    title: 'Do I Need a Seat Reservation?',
    nav: 'Reservation Rules (abroad)',
    blurb: 'Which trains force a compulsory seat reservation, what pass holders pay, and which services you can simply board.',
    keywords: [
      'seat reservation', 'compulsory reservation', 'reservation fee', 'Interrail reservation',
      'Eurail reservation', 'TGV reservation', 'AVE reservation', 'Frecciarossa reservation',
      'Eurostar pass', 'do I need to reserve', 'ICE reservation', 'night train reservation',
      'Nightjet', 'pass quota', 'Italo pass', 'OUIGO pass',
    ],
    category: 'world',
    icon: 'Ticket',
    updated: '2026-08-14',
    relatedTools: ['/world/rail-pass-calculator', '/world/booking-windows', '/world/delay-compensation'],
    relatedGuides: ['/rail/guides/train-classes-explained'],
    isNew: true,
  },
];

// ── Guides ──────────────────────────────────────────────────────────────────
export const GUIDES = [
  {
    href: '/rail/guides/how-to-book-train-ticket-online',
    title: 'How to Book a Train Ticket Online',
    blurb: "First-timer's walkthrough: create an IRCTC account, search trains, read availability codes, pay, and travel on an e-ticket.",
    keywords: [
      'IRCTC account', 'sign up', 'register', 'e-ticket', 'payment', 'UPI', 'availability',
      'first time booking', 'step by step', 'how to book', 'ID proof', 'user ID',
    ],
    category: 'booking',
    updated: '2026-07-20',
    readingMinutes: 9,
    relatedTools: ['/rail/irctc-calculator', '/rail/booking-reminder', '/rail/train-fare-calculator'],
  },
  {
    href: '/rail/guides/irctc-booking-strategy',
    title: 'IRCTC Booking Strategy',
    blurb: 'A preparation system for regular and Tatkal bookings — windows, quotas, and confirmation odds.',
    keywords: [
      'booking plan', 'master list', 'confirmation odds', 'quota', 'strategy',
      'best time to book', 'avoid waitlist', 'preparation',
    ],
    category: 'booking',
    updated: '2026-08-02',
    readingMinutes: 11,
    relatedTools: ['/rail/irctc-calculator', '/rail/booking-reminder', '/rail/waitlist-confirmation-chances'],
    popular: true,
  },
  {
    href: '/rail/guides/tatkal-booking-masterclass',
    title: 'Tatkal Booking Masterclass',
    blurb: 'Exact timings, the Aadhaar rule, master-list prep, payment strategy, and a minute-by-minute booking plan.',
    keywords: [
      'tatkal trick', 'tatkal tips', 'fast booking', 'autofill', 'master list', 'Aadhaar',
      'OTP', '10 am rush', 'tatkal kaise book kare', 'agent',
    ],
    category: 'tatkal',
    updated: '2026-07-20',
    readingMinutes: 10,
    relatedTools: ['/rail/tatkal-charges-calculator', '/rail/booking-reminder', '/rail/irctc-calculator'],
    popular: true,
  },
  {
    href: '/rail/guides/waitlist-rac-guide',
    title: 'Waitlist & RAC Survival Guide',
    blurb: 'GNWL, RLWL, PQWL and TQWL decoded — how charting works, your RAC rights, and what to do at each stage.',
    keywords: [
      'RAC', 'side lower', 'waitlist rights', 'charting', 'GNWL', 'RLWL', 'PQWL', 'TQWL',
      'boarding with a waitlist', 'auto cancellation', 'e-ticket waitlist', 'can I travel',
    ],
    category: 'waitlist',
    updated: '2026-07-20',
    readingMinutes: 12,
    relatedTools: ['/rail/waitlist-confirmation-chances', '/rail/chart-preparation-time', '/rail/tdr-refund-checker'],
    popular: true,
  },
  {
    href: '/rail/guides/train-classes-explained',
    title: 'Train Classes Explained',
    blurb: '1A vs 2A vs 3A vs 3E vs SL vs CC vs EC vs 2S — berths, comfort, bedding, and who each class actually suits.',
    keywords: [
      '1A', '2A', '3A', '3E', 'SL', 'CC', 'EC', '2S', 'sleeper vs 3AC', 'bedding',
      'difference between classes', 'which class', 'AC classes', 'travel class',
    ],
    category: 'coaches',
    updated: '2026-07-20',
    readingMinutes: 10,
    relatedTools: ['/rail/train-fare-calculator', '/rail/berth-position-finder', '/rail/coach-position-finder'],
    popular: true,
  },
  {
    href: '/rail/guides/train-travel-rules',
    title: 'Train Travel Rules: Berths, Luggage & Penalties',
    blurb: 'The rules people actually argue about on board — night berth timings, the middle berth, luggage limits by class, and what a ticketless journey now costs.',
    keywords: [
      'night berth timing', 'sleeping hours', '10 pm', 'middle berth rule', 'middle berth timing',
      'luggage limit', 'luggage allowance', 'how much luggage', 'excess luggage', 'baggage',
      'penalty', 'fine', 'without ticket', 'ticketless', 'TTE', 'higher class', 'seat rules',
      'berth rules', 'train me kitna saman',
    ],
    category: 'rules',
    updated: '2026-08-14',
    readingMinutes: 9,
    relatedTools: ['/rail/luggage-allowance', '/rail/penalty-calculator', '/rail/berth-position-finder'],
    isNew: true,
  },
  {
    href: '/rail/guides/quotas-vikalp-break-journey',
    title: 'Quotas, VIKALP & Break Journey',
    blurb: 'Every reservation quota explained, how the free VIKALP alternate-train scheme works, and when you can break a long journey en route.',
    keywords: [
      'quota', 'quota list', 'general quota', 'ladies quota', 'senior citizen quota', 'lower berth quota',
      'HO quota', 'emergency quota', 'divyangjan', 'handicapped quota', 'defence quota', 'duty pass',
      'foreign tourist quota', 'VIKALP', 'ATAS', 'alternate train', 'break journey', 'stopover',
      'kaun sa quota',
    ],
    category: 'booking',
    updated: '2026-07-31',
    readingMinutes: 10,
    relatedTools: ['/rail/waitlist-confirmation-chances', '/rail/irctc-calculator', '/rail/tatkal-charges-calculator'],
    isNew: true,
  },
  {
    href: '/rail/guides/cancellation-refund-tdr',
    title: 'Cancellation Charges, Refunds & TDR',
    blurb:
      'What is actually deducted when you cancel — the 72, 24 and 8 hour slabs, flat charges by class, RAC and waitlist clerkage, and the cases where you file a TDR instead.',
    keywords: [
      'cancellation charges', 'cancellation charge', 'refund rules', 'how much refund',
      'cancel ticket', 'ticket cancel karne par', 'deduction', 'clerkage', 'TDR',
      'ticket deposit receipt', 'refund status', 'refund time', 'how long refund',
      'tatkal refund', 'non refundable', 'AC not working', 'train cancelled refund',
      '8 hours', '48 hours', 'GST',
    ],
    category: 'refunds',
    updated: '2026-08-01',
    readingMinutes: 11,
    relatedTools: ['/rail/irctc-cancellation-calculator', '/rail/tdr-refund-checker', '/rail/chart-preparation-time'],
    isNew: true,
  },
  {
    href: '/rail/guides/child-senior-concession-tickets',
    title: 'Child Tickets, Senior Fares & Concessions',
    blurb:
      'Age rules for child tickets, the 2016 change that made a berth cost full fare, where the senior citizen concession stands now, and which concessions still exist.',
    keywords: [
      'child ticket', 'child ticket age', 'kids ticket', 'children fare', 'half ticket',
      'under 5', '5 to 12', 'baby ticket', 'bachche ka ticket', 'age limit',
      'senior citizen', 'senior citizen concession', 'old age discount', '60 years',
      'concession', 'discount', 'divyangjan', 'handicapped concession', 'student concession',
      'patient concession', 'lower berth quota', 'lower berth preference',
    ],
    category: 'fares',
    updated: '2026-08-01',
    readingMinutes: 9,
    relatedTools: ['/rail/train-fare-calculator', '/rail/irctc-calculator', '/rail/berth-position-finder'],
    isNew: true,
  },
  {
    href: '/rail/guides/pnr-status-availability-codes',
    title: 'PNR Status & Availability Codes',
    blurb:
      'How to read a PNR — booking status versus current status, what CNF, RAC, WL, CURR_AVBL and REGRET mean, and what changes at chart preparation.',
    keywords: [
      'PNR', 'PNR meaning', 'booking status', 'current status', 'CNF', 'RAC', 'WL',
      'CURR_AVBL', 'current availability', 'REGRET', 'not available', 'CAN', 'MOD',
      'availability code', 'status code', 'what does CNF mean', 'chart prepared',
      'coach number', 'berth number', 'confirmed', '10 digit',
    ],
    category: 'waitlist',
    updated: '2026-08-01',
    readingMinutes: 9,
    relatedTools: ['/rail/waitlist-confirmation-chances', '/rail/chart-preparation-time', '/rail/berth-position-finder'],
    isNew: true,
  },
  {
    href: '/rail/guides/rail-madad-139-complaints',
    title: 'Rail Madad & 139: Complaints and Emergencies',
    blurb:
      'The single 139 helpline, reporting a medical or security emergency on board, lost luggage, and how to write a complaint that actually gets acted on.',
    keywords: [
      '139', 'rail madad', 'railway helpline', 'helpline number', 'complaint',
      'how to complain', 'shikayat', 'emergency', 'medical emergency', 'RPF',
      '182', 'security', 'lost luggage', 'theft', 'stolen', 'lost property',
      'cleanliness complaint', 'clean my coach', 'catering complaint', 'complaint status',
    ],
    category: 'planning',
    updated: '2026-08-01',
    readingMinutes: 8,
    relatedTools: ['/rail/tdr-refund-checker', '/rail/waitlist-confirmation-chances'],
    isNew: true,
  },
  {
    href: '/rail/guides/train-numbers-zones-station-codes',
    title: 'Train Numbers, Zones & Station Codes',
    blurb:
      'Why train numbers have five digits and what the first one tells you, why Chennai Central is MAS, and how railway zones shape the network you book on.',
    keywords: [
      'train number', 'train number meaning', 'five digit', '5 digit train number',
      'first digit', 'station code', 'station code list', 'MAS', 'NDLS', 'SBC', 'CSMT',
      'railway zone', 'zones', 'up and down train', 'train history', 'history of indian railways',
      '1853', 'first train', 'gauge', 'why NDLS', 'MEMU', 'DEMU', 'passenger train',
    ],
    category: 'planning',
    updated: '2026-08-01',
    readingMinutes: 9,
    relatedTools: ['/rail/coach-position-finder', '/rail/train-fare-calculator', '/rail/irctc-calculator'],
    isNew: true,
  },
  {
    href: '/rail/guides/vande-bharat-guide',
    title: 'Vande Bharat Express Guide',
    blurb: 'Booking, CC vs Executive class, fares and opt-in catering, and practical tips before you board.',
    keywords: [
      'Vande Bharat', 'semi high speed', 'CC', 'EC', 'executive chair car', 'catering',
      'food charges', 'Tejas', 'fastest train',
    ],
    category: 'planning',
    updated: '2026-07-20',
    readingMinutes: 8,
    relatedTools: ['/rail/train-fare-calculator', '/rail/coach-position-finder'],
  },
];

// ── Lookups ─────────────────────────────────────────────────────────────────
const byHref = (list) => Object.fromEntries(list.map((item) => [item.href, item]));
const TOOL_INDEX = byHref(TOOLS);
const GUIDE_INDEX = byHref(GUIDES);

export const getTool = (href) => TOOL_INDEX[href];
export const getGuide = (href) => GUIDE_INDEX[href];

export const toolsInCategory = (id) => TOOLS.filter((t) => t.category === id);
export const guidesInCategory = (id) => GUIDES.filter((g) => g.category === id);

/** Resolve a page's `relatedTools` / `relatedGuides` hrefs into full entries. */
export const resolveRelated = (hrefs = [], kind = 'tool') => {
  const index = kind === 'guide' ? GUIDE_INDEX : TOOL_INDEX;
  return hrefs.map((href) => index[href]).filter(Boolean);
};

/** Related links for a tool page, resolved from the catalog. */
export const relatedForTool = (href) => {
  const tool = getTool(href);
  if (!tool) return { tools: [], guides: [] };
  return {
    tools: resolveRelated(tool.relatedTools, 'tool'),
    guides: resolveRelated(tool.relatedGuides, 'guide'),
  };
};

/** Related links for a guide page, resolved from the catalog. */
export const relatedForGuide = (href) => {
  const guide = getGuide(href);
  if (!guide) return { tools: [], guides: [] };
  const sameTopic = GUIDES.filter((g) => g.category === guide.category && g.href !== href);
  return {
    tools: resolveRelated(guide.relatedTools, 'tool'),
    guides: sameTopic,
  };
};

/** Guides sorted newest-first by `updated`. */
export const recentlyUpdatedGuides = (limit = 4) =>
  [...GUIDES].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, limit);

export const popularGuides = (limit = 4) => GUIDES.filter((g) => g.popular).slice(0, limit);

/** Categories that actually have content, with their tools and guides attached. */
export const populatedCategories = () =>
  CATEGORIES.map((c) => ({
    ...c,
    tools: toolsInCategory(c.id),
    guides: guidesInCategory(c.id),
  })).filter((c) => c.tools.length || c.guides.length);
