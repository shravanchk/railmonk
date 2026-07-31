import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { IndianRupee, TicketX } from 'lucide-react';
import { ResultStat } from '../calculator/CalcLayout';
import Card from '../ui/Card';
import ShareResult from '../rail/ShareResult';
import NextStep from '../rail/NextStep';
import useShareableInputs from '../rail/useShareableInputs';
import HiPageShell from './HiPageShell';
import { buildSoftwareApplicationSchema } from '../../utils/schema';
import { CLASS_RULES, computeCancellationRefund, flatChargePerPassenger, clerkagePerPassenger } from '../../utils/engines/irctcCancellation';

const HREF = '/rail/irctc-cancellation-calculator';

const controlCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.95rem] text-ink ' +
  'shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 ' +
  'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

const CLASS_LABELS_HI = {
  '1A': 'एसी फर्स्ट क्लास / एग्जीक्यूटिव (1A/EC)',
  '2A': 'एसी 2-टियर (2A)',
  '3A': 'एसी 3-टियर / चेयर कार / 3E (3A/CC/3E)',
  SL: 'स्लीपर (SL)',
  '2S': 'सेकंड सिटिंग (2S)',
};

const TICKET_TYPES_HI = [
  { id: 'confirmed', label: 'कन्फर्म (CNF)' },
  { id: 'rac', label: 'RAC' },
  { id: 'waitlisted', label: 'वेटिंग लिस्ट (WL)' },
  { id: 'tatkal-confirmed', label: 'तत्काल — कन्फर्म' },
  { id: 'tatkal-rac-wl', label: 'तत्काल — RAC / वेटिंग' },
];

// The rule the engine picked, said in Hindi. Kept as a lookup rather than
// spliced into the JSX so the whole explanation is reviewable in one place.
const RULE_COPY_HI = {
  flat: 'यात्रा से 72 घंटे या उससे पहले रद्द किया — केवल श्रेणी का निश्चित शुल्क कटा है।',
  'slab-25': 'यात्रा से 72 से 24 घंटे पहले — किराये का 25% कटता है (या निश्चित शुल्क, जो अधिक हो)।',
  'slab-50': 'यात्रा से 24 से 8 घंटे पहले — किराये का 50% कटता है (या निश्चित शुल्क, जो अधिक हो)।',
  'no-refund': 'यात्रा से 8 घंटे के भीतर कन्फर्म टिकट रद्द करने पर कोई रिफंड नहीं मिलता।',
  clerkage: 'RAC या वेटिंग टिकट पर केवल क्लर्केज कटता है — प्रति यात्री ₹60 और उस पर 5% जीएसटी।',
  'rac-wl-late': 'निर्धारित प्रस्थान से आधे घंटे के भीतर RAC या वेटिंग टिकट रद्द करने पर रिफंड नहीं मिलता।',
  'tatkal-no-refund': 'कन्फर्म तत्काल टिकट पर रद्दीकरण का कोई रिफंड नहीं मिलता — यह तत्काल की सबसे बड़ी शर्त है।',
};

const rupee = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const FAQS = [
  {
    question: 'ट्रेन टिकट रद्द करने पर कितना पैसा कटता है?',
    answer:
      'कन्फर्म टिकट पर यह इस बात से तय होता है कि आप कितनी जल्दी रद्द कर रहे हैं। प्रस्थान से 72 घंटे या उससे पहले केवल श्रेणी का निश्चित शुल्क कटता है — स्लीपर में ₹120, एसी 3-टियर में ₹180 और जीएसटी। 72 से 24 घंटे के बीच किराये का 25%, और 24 से 8 घंटे के बीच 50%। प्रस्थान से 8 घंटे के भीतर कन्फर्म टिकट पर कुछ भी वापस नहीं मिलता।',
  },
  {
    question: 'क्या तत्काल टिकट रद्द करने पर पैसा वापस मिलता है?',
    answer:
      'कन्फर्म तत्काल टिकट पर नहीं। यह तत्काल की सबसे महँगी शर्त है और अक्सर लोग इसे बाद में जान पाते हैं। हाँ, यदि तत्काल टिकट RAC या वेटिंग में ही रह गई, तो सामान्य क्लर्केज काटकर बाक़ी रकम वापस मिल जाती है।',
  },
  {
    question: 'RAC या वेटिंग टिकट रद्द करने पर कितना कटता है?',
    answer:
      'सिर्फ़ क्लर्केज — प्रति यात्री ₹60 और उस पर 5% जीएसटी, यानी लगभग ₹63। शर्त यह है कि रद्दीकरण निर्धारित प्रस्थान से कम से कम आधे घंटे पहले हो। पूरी तरह वेटिंग रह गई ई-टिकट चार्ट बनते ही अपने आप रद्द हो जाती है और पैसा उसी खाते में लौट आता है — इसके लिए कुछ करने की ज़रूरत नहीं।',
  },
  {
    question: 'क्या रद्दीकरण शुल्क पर जीएसटी लगता है?',
    answer:
      'एसी श्रेणियों पर हाँ, 5%। स्लीपर और सेकंड सिटिंग पर नहीं। क्लर्केज पर भी जीएसटी लगता है। यह कैलकुलेटर जीएसटी जोड़कर ही रकम दिखाता है, इसलिए जो आँकड़ा दिखता है वही असल में कटता है।',
  },
  {
    question: 'अगर ट्रेन रद्द हो जाए या बहुत देर से चले तो?',
    answer:
      'तब यह सामान्य रद्दीकरण नहीं रहता। ट्रेन रद्द होने पर पूरा किराया वापस मिलता है, और तीन घंटे से अधिक देरी होने पर यदि आप यात्रा नहीं करते तो TDR भरकर पूरा रिफंड माँगा जा सकता है। ऐसी स्थितियों के लिए TDR वाला टूल देखिए, यह कैलकुलेटर नहीं।',
  },
];

const softwareSchema = buildSoftwareApplicationSchema({
  name: 'ट्रेन टिकट रद्दीकरण रिफंड कैलकुलेटर',
  url: `https://railmonk.com/hi${HREF}`,
  description: 'टिकट रद्द करने से पहले जानिए कि कितना शुल्क कटेगा और कितने रुपये वापस मिलेंगे।',
  applicationCategory: 'TravelApplication',
  featureList: ['समय के अनुसार रद्दीकरण स्लैब', 'श्रेणीवार निश्चित शुल्क', 'RAC और वेटिंग क्लर्केज', 'जीएसटी सहित गणना'],
});

const CancellationCalculatorHi = () => {
  const [classCode, setClassCode] = useState('SL');
  const [ticketType, setTicketType] = useState('confirmed');
  const [fare, setFare] = useState('');
  const [hours, setHours] = useState('');
  const [passengers, setPassengers] = useState('1');

  const shareUrl = useShareableInputs(
    { cls: classCode, type: ticketType, fare, hours, pax: passengers },
    (params) => {
      if (params.cls && CLASS_RULES[params.cls]) setClassCode(params.cls);
      if (params.type && TICKET_TYPES_HI.some((t) => t.id === params.type)) setTicketType(params.type);
      if (params.fare) setFare(params.fare);
      if (params.hours) setHours(params.hours);
      if (params.pax) setPassengers(params.pax);
    }
  );

  const result = useMemo(() => {
    const fareNum = Number(fare);
    const hoursNum = Number(hours);
    if (!(fareNum > 0) || hours === '' || !Number.isFinite(hoursNum) || hoursNum < 0) return null;
    return computeCancellationRefund({
      classCode,
      ticketType,
      fare: fareNum,
      hoursBeforeDeparture: hoursNum,
      passengers: Math.max(1, Number(passengers) || 1),
    });
  }, [classCode, ticketType, fare, hours, passengers]);

  const refundShare = result && Number(fare) > 0 ? Math.round((result.refund / Number(fare)) * 100) : null;

  return (
    <HiPageShell
      englishHref={HREF}
      metaTitle="ट्रेन टिकट कैंसिल करने पर कितना रिफंड मिलेगा | Railmonk"
      metaDescription="टिकट रद्द करने पर कितना कटेगा और कितना वापस आएगा? कन्फर्म, RAC, वेटिंग और तत्काल — मौजूदा रद्दीकरण नियमों के अनुसार जीएसटी सहित सटीक हिसाब।"
      ogDescription="रद्द करने से पहले जानिए कि असल में कितने रुपये वापस मिलेंगे।"
      eyebrow="रद्दीकरण और रिफंड"
      title="टिकट रद्दीकरण रिफंड कैलकुलेटर"
      subtitle="रद्द करने से पहले जान लीजिए कि रेलवे कितना काटेगा और आपके खाते में कितना लौटेगा — कन्फर्म, RAC, वेटिंग और तत्काल, सबके अलग नियम हैं।"
      breadcrumbLabel="रद्दीकरण रिफंड कैलकुलेटर"
      schema={softwareSchema}
      faqs={FAQS}
      howTo={{
        name: 'टिकट रद्द करने पर रिफंड कैसे निकालें',
        description: 'श्रेणी, टिकट की स्थिति और बचे हुए समय से रिफंड की सटीक रकम निकालिए।',
        steps: [
          { name: 'श्रेणी चुनिए', text: 'निश्चित शुल्क श्रेणी पर निर्भर करता है — स्लीपर में ₹120, एसी 3-टियर में ₹180 और जीएसटी।' },
          { name: 'टिकट की स्थिति बताइए', text: 'कन्फर्म, RAC, वेटिंग या तत्काल — नियम पूरी तरह बदल जाता है।' },
          { name: 'कुल किराया भरिए', text: 'जो रकम आपने चुकाई थी, सभी यात्रियों को मिलाकर।' },
          { name: 'बचा हुआ समय डालिए', text: 'प्रस्थान में कितने घंटे बाक़ी हैं — 72, 24 और 8 घंटे पर स्लैब बदलता है।' },
          { name: 'रिफंड देखिए', text: 'कटौती और वापसी दोनों जीएसटी सहित दिखती हैं।' },
        ],
      }}
      reviewedOn="31 जुलाई 2026"
      scope="गणना 1 अप्रैल 2026 से लागू रद्दीकरण नियमों पर आधारित है, जिसमें एसी श्रेणियों के शुल्क और क्लर्केज पर 5% जीएसटी शामिल है। ट्रेन रद्द होने या तीन घंटे से अधिक देरी की स्थिति अलग है और उसके लिए TDR वाला नियम लागू होता है।"
      sources={[
        { label: 'IRCTC आधिकारिक पोर्टल', url: 'https://www.irctc.co.in/' },
        { label: 'भारतीय रेल', url: 'https://indianrailways.gov.in/' },
      ]}
    >
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <div className="space-y-4">
            <div>
              <label htmlFor="hi-class" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">
                यात्रा श्रेणी
              </label>
              <select id="hi-class" value={classCode} onChange={(e) => setClassCode(e.target.value)} className={controlCls}>
                {Object.keys(CLASS_RULES).map((code) => (
                  <option key={code} value={code}>{CLASS_LABELS_HI[code]}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-ink-muted dark:text-slate-500">
                इस श्रेणी का निश्चित शुल्क: {rupee(flatChargePerPassenger(classCode))} प्रति यात्री।
              </p>
            </div>

            <div>
              <label htmlFor="hi-ticket-type" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">
                टिकट की स्थिति
              </label>
              <select id="hi-ticket-type" value={ticketType} onChange={(e) => setTicketType(e.target.value)} className={controlCls}>
                {TICKET_TYPES_HI.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="hi-fare" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">
                कुल किराया (₹)
              </label>
              <input
                id="hi-fare"
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="जैसे 1800"
                value={fare}
                onChange={(e) => setFare(e.target.value)}
                className={controlCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="hi-hours" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">
                  प्रस्थान में बचे घंटे
                </label>
                <input
                  id="hi-hours"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  placeholder="जैसे 30"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className={controlCls}
                />
              </div>
              <div>
                <label htmlFor="hi-pax" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">
                  यात्रियों की संख्या
                </label>
                <input
                  id="hi-pax"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={passengers}
                  onChange={(e) => setPassengers(e.target.value)}
                  className={controlCls}
                />
              </div>
            </div>

            <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3 text-sm dark:border-teal-800/60 dark:bg-teal-900/20">
              <p className="font-semibold text-teal-800 dark:text-teal-300">कन्फर्म टिकट के स्लैब</p>
              <ul className="mt-1 space-y-1 text-teal-700 dark:text-teal-400">
                <li>72 घंटे या पहले → केवल निश्चित शुल्क</li>
                <li>72–24 घंटे → किराये का 25%</li>
                <li>24–8 घंटे → किराये का 50%</li>
                <li>8 घंटे से कम → कोई रिफंड नहीं</li>
              </ul>
            </div>
          </div>
        </Card>

        <div className="min-w-0 space-y-5 lg:col-span-3" aria-live="polite">
          {result && result.rule !== 'invalid' ? (
            <>
              <Card className="overflow-hidden border-brand-200 bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white dark:border-brand-700">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80">
                  <IndianRupee aria-hidden="true" className="h-3.5 w-3.5" />
                  आपको वापस मिलेगा
                </div>
                <p className="mt-1 font-display text-3xl font-bold leading-tight">{rupee(result.refund)}</p>
                <p className="mt-0.5 text-sm text-white/85">
                  {/* "₹600 कटेगा" mis-agrees with a rupee amount; phrasing it as
                      a noun avoids the number/gender agreement entirely. */}
                  कुल {rupee(fare)} में से {rupee(result.deduction)} की कटौती
                  {refundShare !== null ? ` — यानी लगभग ${refundShare}% वापसी` : ''}
                </p>
                <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm">{RULE_COPY_HI[result.rule]}</p>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <ResultStat label="कुल कटौती" value={rupee(result.deduction)} emphasis />
                <ResultStat label="वापसी" value={rupee(result.refund)} tone="positive" />
              </div>

              {result.minChargeApplied ? (
                <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50/70 p-4 text-sm dark:border-amber-500 dark:bg-amber-900/20">
                  <p className="text-amber-800/90 dark:text-amber-200/90">
                    इस मामले में प्रतिशत से ज़्यादा निश्चित शुल्क बना, इसलिए वही लागू हुआ। सस्ते टिकटों पर अक्सर ऐसा होता है।
                  </p>
                </div>
              ) : null}

              <Card className="p-5">
                <h3 className="font-display text-base font-bold text-ink dark:text-white">यह रकम कैसे बनी</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-muted dark:text-slate-400">चुकाया गया किराया</dt>
                    <dd className="font-medium text-ink dark:text-white">{rupee(fare)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-muted dark:text-slate-400">रद्दीकरण कटौती</dt>
                    <dd className="font-medium text-ink dark:text-white">− {rupee(result.deduction)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 dark:border-slate-700">
                    <dt className="font-semibold text-ink dark:text-white">खाते में वापस</dt>
                    <dd className="font-semibold text-emerald-600 dark:text-emerald-400">{rupee(result.refund)}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-ink-muted dark:text-slate-500">
                  रकम उसी माध्यम में लौटती है जिससे भुगतान हुआ था, और सामान्यतः तीन से सात कार्यदिवस लगते हैं।
                </p>
              </Card>
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center p-10 text-center text-sm text-ink-muted dark:text-slate-400">
              <TicketX aria-hidden="true" className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
              किराया और प्रस्थान में बचे घंटे भरिए, फिर रिफंड की रकम यहाँ दिखेगी।
            </Card>
          )}

          {result && result.rule !== 'invalid' ? (
            <ShareResult
              locale="hi"
              url={shareUrl}
              title="रद्दीकरण रिफंड — Railmonk"
              text={`${rupee(fare)} की टिकट पर ${rupee(result.refund)} वापस मिलेंगे।`}
            />
          ) : null}
        </div>
      </div>

      <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
        <h2 className="font-display text-xl font-bold text-ink dark:text-white">
          रद्दीकरण में असली फ़र्क समय डालता है, किराया नहीं
        </h2>
        <p className="mt-3">
          लोग अक्सर मानते हैं कि महँगी टिकट पर ज़्यादा कटता है। असल में सबसे बड़ा कारक यह है कि आप कब रद्द कर रहे हैं।
          प्रस्थान से 72 घंटे पहले तक केवल श्रेणी का निश्चित शुल्क लगता है, चाहे किराया कितना भी हो। उसके बाद हर स्लैब पर
          कटौती तेज़ी से बढ़ती है — 25%, फिर 50%, और आठ घंटे के भीतर पूरी रकम चली जाती है। यात्रा टलने का अंदेशा हो तो
          जल्दी रद्द करना ही सबसे सस्ता विकल्प है।
        </p>

        <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">
          वेटिंग टिकट के लिए कुछ करना ज़रूरी नहीं
        </h3>
        <p className="mt-3">
          पूरी तरह वेटिंग रह गई ई-टिकट चार्ट बनते ही अपने आप रद्द हो जाती है और क्लर्केज ({rupee(clerkagePerPassenger())}{' '}
          प्रति यात्री) काटकर बाक़ी रकम उसी खाते में लौट आती है। इसके लिए न TDR भरना पड़ता है, न कहीं आवेदन करना पड़ता है।
          चार्ट कब बनेगा, यह जानने के लिए{' '}
          <Link href="/rail/chart-preparation-time" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">
            चार्ट तैयारी कैलकुलेटर
          </Link>{' '}
          देखिए।
        </p>

        <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">तत्काल की सबसे महँगी शर्त</h3>
        <p className="mt-3">
          कन्फर्म तत्काल टिकट पर रद्दीकरण का कोई रिफंड नहीं मिलता। यह प्रीमियम के अलावा एक छिपी हुई लागत है, और तत्काल
          लेने से पहले इसे जोड़कर देखना चाहिए। हाँ, ट्रेन रद्द हो जाए या तीन घंटे से अधिक देर से चले, तो TDR के ज़रिये
          पूरा रिफंड माँगा जा सकता है।
        </p>
      </div>

      <NextStep
        title="ट्रेन रद्द हुई या बहुत देर से चली?"
        body="ऐसी स्थिति में सामान्य रद्दीकरण नियम नहीं, TDR के नियम लागू होते हैं — और पूरा किराया वापस मिल सकता है।"
        href="/rail/tdr-refund-checker"
        cta="TDR रिफंड जाँचिए"
        secondary={{ href: '/rail/irctc-cancellation-calculator', label: 'Read this page in English' }}
      />
    </HiPageShell>
  );
};

export default CancellationCalculatorHi;
