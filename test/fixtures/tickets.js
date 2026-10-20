// Sample tickets for the ticket reader tests.
//
// Laid out like IRCTC's two ERS formats and its booking SMS, with every
// personal detail invented: names, PNRs, transaction IDs and fares belong to
// nobody. Train numbers, names and stations are real timetable facts, which is
// public information and keeps the samples recognisable.
//
// The ERS samples are written as the lines utils/pdfLines.js produces — two or
// more spaces between columns — and `ERS_LAYOUTS` places the same text on a
// PDF page so the tests can run it through pdf.js as well.

// Current ERS: labels in a header row, values on the row below.
const ERS_CURRENT = [
  'Electronic Reservation Slip (ERS)',
  'Booked From              Boarding At              To',
  'NEW DELHI (NDLS)         NEW DELHI (NDLS)         MUMBAI CENTRAL (MMCT)',
  'Start Date* 15-Nov-2026  Departure* 16:55 15-Nov-2026  Arrival* 08:35 16-Nov-2026',
  'PNR             Train No./Name              Class',
  '2345678901      12952/MMCT TEJAS RAJ        AC 3 TIER (3A)',
  'Quota           Distance                    Booking Date',
  'GENERAL (GN)    1386 KM                     20-Sep-2026 10:15:32 HRS',
  'Passenger Details:',
  '#   Name            Age   Gender   Booking Status      Current Status',
  '1.  ASHA VERMA      34    F        CNF/B4/23/LOWER     CNF/B4/23/LOWER',
  '2.  KIRAN VERMA     36    M        CNF/B4/24/MIDDLE    CNF/B4/24/MIDDLE',
  'Transaction ID: 100005678901234',
  'IR recovers only 57% of cost of travel on an average.',
  'Payment Details',
  'Ticket Fare      ₹ 3,945.00',
  'IRCTC Convenience Fee (Incl. of GST)      ₹ 35.40',
  'Travel Insurance Premium (Incl. of GST)      ₹ 0.90',
  'Total Fare (all inclusive)      ₹ 3,981.30',
  'Instructions: Tatkal tickets are not refundable on cancellation. Passengers travelling on a Tatkal ticket must carry ID.',
].join('\n');

// Older ERS: every field written as "Label : value", Tatkal, mixed statuses.
const ERS_OLDER = [
  'Electronic Reservation Slip (Personal User)',
  'PNR No. : 4512345678     Train No. & Name : 12627/KARNATAKA EXP     Quota : TATKAL (TQ)',
  'Transaction ID : 100003123456789     Date of Booking : 23-Dec-2026 10:02:11 AM     Class : SLEEPER CLASS (SL)',
  'From : KSR BENGALURU (SBC)     Date of Journey : 24-Dec-2026     To : NEW DELHI (NDLS)',
  'Boarding At : KSR BENGALURU (SBC)     Date of Boarding : 24-Dec-2026     Scheduled Departure* : 24-Dec-2026 19:20',
  'Reservation Upto : NEW DELHI (NDLS)     Scheduled Arrival : 26-Dec-2026 09:00     Adult : 3   Child : 0',
  'Passenger Details:',
  'SNo.   Name             Age   Sex      Booking Status/Coach No/Seat No     Current Status/Coach No/Seat No',
  '1      RAVI NAIR        45    Male     CNF/S5/33/LB                        CNF/S5/33/LB',
  '2      LATA NAIR        42    Female   RAC/RAC 4                           RAC/RAC 2',
  '3      ANU NAIR         17    Female   TQWL/12                             TQWL/3',
  'Ticket Fare : Rs. 2,345.00     Convenience Fee : Rs. 17.70     Total Fare : Rs. 2,362.70',
].join('\n');

// Current ERS, boarding mid-route: the train started the day before, and the
// passengers are waitlisted and RAC.
const ERS_MIDROUTE = [
  'Electronic Reservation Slip (ERS)',
  'Booked From              Boarding At              To',
  'NAGPUR (NGP)             NAGPUR (NGP)             NEW DELHI (NDLS)',
  'Start Date* 09-Jan-2027  Departure* 05:40 10-Jan-2027  Arrival* 20:50 10-Jan-2027',
  'PNR             Train No./Name              Class',
  '6012345678      12625/KERALA EXPRESS        AC 2 TIER (2A)',
  'Quota           Distance                    Booking Date',
  'GENERAL (GN)    1093 KM                     02-Dec-2026 08:01:12 HRS',
  'Passenger Details:',
  '#   Name            Age   Gender   Booking Status      Current Status',
  '1.  MEERA DAS       29    F        GNWL/41             RAC 7',
  '2.  SUNIL DAS       31    M        GNWL/42             WL/3',
  'Ticket Fare      ₹ 4,890.00',
  'Total Fare (all inclusive)      ₹ 4,925.40',
].join('\n');

// IRCTC booking SMS — confirmed, two passengers.
const SMS_CONFIRMED =
  'PNR:2345678901,TRN:12952,DOJ:15-11-26,3A,NDLS-MMCT,DP:16:55,Boarding at NDLS only,\n' +
  'ASHA VERMA+1,B4 23,B4 24,\n' +
  'Fare:003945,SC:35.4+PG chgs.\n' +
  'Beware of fraudulent customer care numbers. For IRCTC Official Customer Care contact 14646';

// Tatkal waitlist — the SMS never says "Tatkal"; TQWL does.
const SMS_TATKAL_WL =
  'PNR:4512345678,TRN:12627,DOJ:24-12-26,SL,SBC-NDLS,DP:19:20,Boarding at SBC only,\n' +
  'RAVI NAIR+2,TQWL 12,TQWL 13,TQWL 14,\n' +
  'Fare:002345,SC:17.7+PG chgs.';

// Single passenger, RAC, dash separators, no "+N".
const SMS_RAC = 'PNR-6012345678,TRN-12301,DOJ-05-01-27,3A,HWH-NDLS,DP-16:50,MEERA DAS,RAC 21,Fare-002890';

// Per-passenger "P1-" berths.
const SMS_PER_PASSENGER =
  'PNR:7712345678,TRN:20901,DOJ:02-02-2027,CC,MMCT-GNC,DP:06:00,\nKIRAN SHAH+1,P1-C3,45,WS,P2-C3,46,NC,\nFare:2,450.00,SC:35.4';

// General quota SMS: no quota printed, so the reader must ask.
const SMS_NO_QUOTA = 'PNR:8812345678,TRN:12002,DOJ:11-03-27,CC,NDLS-BPL,DP:06:00,Boarding at NDLS only,\nNEHA RAO,C2 61,\nFare:001570,SC:17.7';

const NOT_A_TICKET = 'Your OTP for login is 482913. Do not share it with anyone.';

/**
 * The current-layout sample as a positioned page: each line's cells placed in
 * fixed columns, the way the ERS lays them out. Used to build a real PDF.
 */
const toPageCells = (text) =>
  text.split('\n').map((line) => {
    const cells = [];
    let x = 0;
    line.split(/(\s{2,})/).forEach((part) => {
      if (/^\s+$/.test(part)) {
        x += part.length * 6;
      } else if (part) {
        cells.push({ text: part, col: x });
        x += part.length * 6;
      }
    });
    return cells;
  });

module.exports = {
  ERS_CURRENT,
  ERS_OLDER,
  ERS_MIDROUTE,
  SMS_CONFIRMED,
  SMS_TATKAL_WL,
  SMS_RAC,
  SMS_PER_PASSENGER,
  SMS_NO_QUOTA,
  NOT_A_TICKET,
  toPageCells,
};
