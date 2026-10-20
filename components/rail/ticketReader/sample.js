// A sample e-ticket for "Try a sample ticket", dated a fortnight ahead of
// today so its deadlines are live. Laid out like the current ERS text layer;
// the names, PNR and transaction ID are invented.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ersDate = (d) => `${String(d.getUTCDate()).padStart(2, '0')}-${MONTHS[d.getUTCMonth()]}-${d.getUTCFullYear()}`;

export const sampleTicketText = (today = new Date()) => {
  const base = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const depart = new Date(base + 14 * 86400000);
  const arrive = new Date(base + 15 * 86400000);
  const booked = new Date(base - 20 * 86400000);
  return [
    'Electronic Reservation Slip (ERS)',
    'Booked From              Boarding At              To',
    'NEW DELHI (NDLS)         NEW DELHI (NDLS)         MUMBAI CENTRAL (MMCT)',
    `Start Date* ${ersDate(depart)}  Departure* 16:55 ${ersDate(depart)}  Arrival* 08:35 ${ersDate(arrive)}`,
    'PNR             Train No./Name              Class',
    '2345678901      12952/MMCT TEJAS RAJ        AC 3 TIER (3A)',
    'Quota           Distance                    Booking Date',
    `GENERAL (GN)    1386 KM                     ${ersDate(booked)} 10:15:32 HRS`,
    'Passenger Details:',
    '#   Name            Age   Gender   Booking Status      Current Status',
    '1.  ASHA VERMA      34    F        CNF/B4/23/LOWER     CNF/B4/23/LOWER',
    '2.  KIRAN VERMA     36    M        RLWL/12             RAC 4',
    'Payment Details',
    'Ticket Fare      ₹ 3,945.00',
    'IRCTC Convenience Fee (Incl. of GST)      ₹ 35.40',
    'Total Fare (all inclusive)      ₹ 3,981.30',
  ].join('\n');
};
