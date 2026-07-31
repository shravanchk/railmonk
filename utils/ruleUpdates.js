// Dated log of Indian Railways / IRCTC rule changes that affect what the tools
// on this site calculate.
//
// Rules for this file — they exist because the whole point of the page is that
// a reader can check us:
//   • Every entry needs an `effective` date and at least one `sources` link.
//   • `confidence: 'circular'` means we read the Railway Board / IRCTC circular
//     itself. `'reported'` means it comes from national press reporting of a
//     Railway Board decision and we could not retrieve the circular text —
//     the UI labels these differently, and they should stay labelled.
//   • No entry without a date. No "recently updated" without knowing when.

export const RULE_UPDATES = [
  {
    id: 'excess-luggage-online-booking',
    title: 'Excess luggage can be booked online with the ticket',
    effective: '2026-07-31',
    effectiveLabel: '31 July 2026',
    category: 'planning',
    confidence: 'reported',
    summary:
      'Passengers can now book and pay for excess luggage online at the time of ticket reservation, in AC First Class, AC 2-Tier, First Class, Sleeper and Second Class. AC 3-Tier and AC Chair Car are excluded because their maximum permissible limit is the same as the free allowance, so there is no excess to book.',
    whatChanged:
      'Excess luggage previously had to be handled at the parcel or luggage office before travel. Free allowances themselves are unchanged — 70 kg in 1A, 50 kg in FC and 2A, 40 kg in 3A, CC and SL, 35 kg in 2S — and excess inside the compartment is still charged at 1.5 times the luggage rate.',
    affects: ['/rail/guides/train-travel-rules'],
    sources: [
      { label: 'IANS — online excess luggage booking launched', url: 'https://ianslive.in/indian-railways-launches-online-excess-luggage-booking-with-ticket-reservations--20260731140922' },
      { label: 'Indian Railways', url: 'https://indianrailways.gov.in/' },
    ],
  },
  {
    id: 'ticketless-penalty-500',
    title: 'Minimum penalty for ticketless travel doubled to ₹500',
    effective: '2026-07-01',
    effectiveLabel: '1 July 2026',
    category: 'planning',
    confidence: 'reported',
    summary:
      'The minimum penalty under Section 138 of the Railways Act for travelling without a ticket — or beyond the distance the ticket covers — rose from ₹250 to ₹500, payable in addition to the fare for the distance travelled. The change came through amendments to Sections 137 and 138 made by the Jan Vishwas (Amendment of Provisions) Act, 2026.',
    whatChanged:
      'Court-imposed punishment is unchanged at up to six months imprisonment, a fine of up to ₹1,000, or both. The practical effect is on the penalty a TTE collects on board, which is now twice what most passengers expect it to be.',
    affects: ['/rail/guides/train-travel-rules'],
    sources: [
      { label: 'Business Today — penalty change from 1 July 2026', url: 'https://www.businesstoday.in/india/story/railways-rule-change-from-july-1-travelling-without-a-ticket-how-much-fine-youll-have-to-pay-538856-2026-06-24' },
      { label: 'Railways Act, 1989 — Section 138', url: 'https://lawgist.in/railways-act/138' },
    ],
  },
  {
    id: 'chart-preparation-10-hours',
    title: 'First reservation chart now prepared 10 hours before departure',
    effective: '2025-12-01',
    effectiveLabel: 'December 2025',
    category: 'planning',
    confidence: 'reported',
    summary:
      'The first chart is now prepared at least 10 hours before departure, up from 8 hours. For trains leaving between 05:00 and 14:00, the first chart is prepared by 20:00 the previous evening. The final chart is still prepared about 30 minutes before departure.',
    whatChanged:
      'Waitlisted and RAC passengers learn their status considerably earlier, which leaves more time to arrange an alternative. It also means the window for filing certain TDR claims and for last-minute berth allocation shifts earlier in the day.',
    affects: ['/rail/chart-preparation-time', '/rail/waitlist-confirmation-chances', '/rail/tdr-refund-checker'],
    sources: [
      { label: 'Business Standard — reservation chart timing change', url: 'https://www.business-standard.com/india-news/indian-railways-rules-2025-new-chart-updates-for-waiting-list-and-racs-nc-125121800905_1.html' },
      { label: 'IRCTC official portal', url: 'https://www.irctc.co.in/' },
    ],
  },
  {
    id: 'cancellation-slabs-april-2026',
    title: 'Cancellation refund slabs revised',
    effective: '2026-04-01',
    effectiveLabel: '1 April 2026',
    category: 'refunds',
    confidence: 'reported',
    summary:
      'Confirmed-ticket cancellation now works on 72-hour, 24-hour and 8-hour thresholds, with a flat minimum charge per passenger by class (₹240 for 1A/EC down to ₹60 for 2S) and 5% GST on AC classes. RAC and waitlisted tickets carry a ₹60 clerkage plus GST.',
    whatChanged:
      'The time bands that decide whether you lose the flat charge, 25% or 50% of the fare moved. Cancelling inside 8 hours of departure means no refund on a confirmed ticket.',
    affects: ['/rail/irctc-cancellation-calculator', '/rail/tdr-refund-checker'],
    sources: [
      { label: 'IRCTC cancellation & refund rules', url: 'https://www.irctc.co.in/nget/cancellation-rules' },
      { label: 'Indian Railways', url: 'https://indianrailways.gov.in/' },
    ],
  },
  {
    id: 'tatkal-aadhaar-otp',
    title: 'Aadhaar authentication and OTP required for Tatkal',
    effective: '2025-07-15',
    effectiveLabel: '1 July 2025, OTP from 15 July 2025',
    category: 'tatkal',
    confidence: 'reported',
    summary:
      'Tatkal tickets on the IRCTC website and app can be booked only by Aadhaar-authenticated users (from 1 July 2025), and online Tatkal bookings additionally require Aadhaar-based OTP verification (from 15 July 2025). Authorised agents remain barred from booking in the first 30 minutes of the Tatkal window.',
    whatChanged:
      'If your IRCTC account is not Aadhaar-authenticated, you cannot book Tatkal at all — and account verification is not something you can complete in the minute the window opens. Do it well before the journey.',
    affects: ['/rail/tatkal-charges-calculator', '/rail/booking-reminder', '/rail/irctc-calculator'],
    sources: [
      { label: 'Press Information Bureau — Ministry of Railways', url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2135694&reg=3&lang=2' },
      { label: 'IRCTC official portal', url: 'https://www.irctc.co.in/' },
    ],
  },
  {
    id: 'arp-60-days',
    title: 'Advance Reservation Period cut from 120 days to 60 days',
    effective: '2024-11-01',
    effectiveLabel: '1 November 2024',
    category: 'booking',
    confidence: 'circular',
    circular: 'Railway Board Commercial Circular No. 10 of 2024, dated 16 October 2024',
    summary:
      'The advance reservation period for reserved tickets is 60 days, excluding the date of journey. The 365-day limit for the Foreign Tourist quota is unchanged, and certain daytime express trains that already had shorter limits keep them.',
    whatChanged:
      'Trips can no longer be booked a season ahead — holiday and festival travel now needs a reminder set roughly two months out rather than four.',
    affects: ['/rail/irctc-calculator', '/rail/booking-reminder'],
    sources: [
      { label: 'Railway Board Commercial Circular No. 10 of 2024 (PDF)', url: 'https://contents.irctc.co.in/en/ARP_Change_to_60_days.pdf' },
    ],
  },
];

/** Newest-first by effective date. */
export const recentRuleUpdates = (limit) => {
  const sorted = [...RULE_UPDATES].sort((a, b) => b.effective.localeCompare(a.effective));
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
};

/** Rule changes that affect a given tool or guide URL. */
export const ruleUpdatesFor = (href) => RULE_UPDATES.filter((u) => u.affects.includes(href));

export const CONFIDENCE_LABEL = {
  circular: 'Verified against the circular',
  reported: 'Per published rules and national reporting',
};
