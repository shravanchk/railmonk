import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { ResultStat } from '../calculator/CalcLayout';
import Card from '../ui/Card';
import ShareResult from '../rail/ShareResult';
import NextStep from '../rail/NextStep';
import useShareableInputs from '../rail/useShareableInputs';
import HiPageShell from './HiPageShell';
import { buildSoftwareApplicationSchema } from '../../utils/schema';
import { TATKAL_RULES, computeTatkalCharge } from '../../utils/engines/tatkalCharges';

const HREF = '/rail/tatkal-charges-calculator';

const controlCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.95rem] text-ink ' +
  'shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 ' +
  'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

const CLASS_LABELS_HI = {
  '2S': 'सेकंड सिटिंग (2S)',
  SL: 'स्लीपर (SL)',
  CC: 'एसी चेयर कार (CC)',
  '3A': 'एसी 3-टियर (3A)',
  '2A': 'एसी 2-टियर (2A)',
  EC: 'एग्जीक्यूटिव चेयर कार (EC)',
};

const AC_CLASSES = new Set(['CC', '3A', '2A', 'EC']);

const rupee = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const FAQS = [
  {
    question: 'तत्काल टिकट में कितना अतिरिक्त शुल्क लगता है?',
    answer:
      'स्लीपर और सेकंड सिटिंग में बेस किराये का 10%, और एसी श्रेणियों में 30% — पर हर श्रेणी में एक न्यूनतम और अधिकतम सीमा भी है। स्लीपर में यह ₹100 से ₹200 के बीच रहता है, एसी 3-टियर में ₹300 से ₹400, और एसी 2-टियर में ₹400 से ₹500। यही वजह है कि छोटी दूरी पर प्रतिशत के हिसाब से तत्काल कहीं ज़्यादा महँगा पड़ता है।',
  },
  {
    question: 'तत्काल बुकिंग किस समय खुलती है?',
    answer:
      'यात्रा से एक दिन पहले — एसी श्रेणियों के लिए सुबह 10:00 बजे और स्लीपर तथा अन्य नॉन-एसी श्रेणियों के लिए सुबह 11:00 बजे। यह गिनती यात्रा के दिन से एक दिन पीछे होती है, यानी 15 तारीख की यात्रा के लिए तत्काल 14 तारीख को खुलेगा।',
  },
  {
    question: 'क्या तत्काल टिकट रद्द करने पर पैसा वापस मिलता है?',
    answer:
      'कन्फर्म तत्काल टिकट पर नहीं — यह तत्काल की सबसे बड़ी छिपी हुई लागत है। यदि तत्काल टिकट RAC या वेटिंग में ही रह गई, तो क्लर्केज काटकर बाक़ी रकम वापस मिल जाती है। इसलिए तत्काल लेने से पहले यह जोखिम भी प्रीमियम में जोड़कर देखिए।',
  },
  {
    question: 'तत्काल और प्रीमियम तत्काल में क्या अंतर है?',
    answer:
      'सामान्य तत्काल का शुल्क तय होता है, जो यह कैलकुलेटर बताता है। प्रीमियम तत्काल में किराया माँग के अनुसार बढ़ता-घटता है, इसलिए उसकी कोई निश्चित दर नहीं होती और वह इस तालिका से कहीं महँगा पड़ सकता है। प्रीमियम तत्काल की बुकिंग एसी वाली घड़ी यानी सुबह 10:00 बजे से चलती है।',
  },
  {
    question: 'क्या तत्काल के लिए आधार ज़रूरी है?',
    answer:
      'IRCTC खाते से आधार सत्यापित होने पर तत्काल बुकिंग में ओटीपी वाली अतिरिक्त प्रक्रिया और भीड़ के समय की कुछ बाध्यताएँ आसान हो जाती हैं। नियम समय-समय पर बदलते रहे हैं, इसलिए बुकिंग से पहले IRCTC पर मौजूदा शर्त एक बार देख लेना बेहतर है।',
  },
];

const softwareSchema = buildSoftwareApplicationSchema({
  name: 'तत्काल शुल्क कैलकुलेटर',
  url: `https://railmonk.com/hi${HREF}`,
  description: 'जानिए तत्काल टिकट पर बेस किराये के ऊपर कितना अतिरिक्त शुल्क लगेगा — श्रेणीवार दर, न्यूनतम और अधिकतम सीमा सहित।',
  applicationCategory: 'TravelApplication',
  featureList: ['श्रेणीवार तत्काल दर', 'न्यूनतम और अधिकतम सीमा', 'प्रति यात्री और कुल शुल्क', 'तत्काल बुकिंग का समय'],
});

const TatkalChargesHi = () => {
  const [classCode, setClassCode] = useState('SL');
  const [basicFare, setBasicFare] = useState('');
  const [passengers, setPassengers] = useState('1');

  const shareUrl = useShareableInputs(
    { cls: classCode, fare: basicFare, pax: passengers },
    (params) => {
      if (params.cls && TATKAL_RULES[params.cls]) setClassCode(params.cls);
      if (params.fare) setBasicFare(params.fare);
      if (params.pax) setPassengers(params.pax);
    }
  );

  const result = useMemo(() => {
    const fareNum = Number(basicFare);
    if (!(fareNum > 0)) return null;
    const r = computeTatkalCharge({
      classCode,
      basicFare: fareNum,
      passengers: Math.max(1, Number(passengers) || 1),
    });
    return r.valid ? r : null;
  }, [classCode, basicFare, passengers]);

  const rule = TATKAL_RULES[classCode];
  const isAc = AC_CLASSES.has(classCode);

  return (
    <HiPageShell
      englishHref={HREF}
      metaTitle="तत्काल चार्ज कितना लगता है — तत्काल शुल्क कैलकुलेटर | Railmonk"
      metaDescription="तत्काल टिकट पर कितना अतिरिक्त शुल्क लगेगा? स्लीपर में 10%, एसी में 30% — न्यूनतम और अधिकतम सीमा सहित सटीक हिसाब, और बुकिंग का सही समय।"
      ogDescription="श्रेणी और बेस किराया डालिए, तत्काल का असली प्रीमियम देखिए।"
      eyebrow="तत्काल"
      title="तत्काल शुल्क कैलकुलेटर"
      subtitle="तत्काल में बेस किराये के ऊपर जो प्रीमियम लगता है, वह श्रेणी और दूरी दोनों से बदलता है — और छोटी दूरी पर सबसे भारी पड़ता है। भुगतान से पहले असली रकम देख लीजिए।"
      breadcrumbLabel="तत्काल शुल्क कैलकुलेटर"
      schema={softwareSchema}
      faqs={FAQS}
      howTo={{
        name: 'तत्काल शुल्क कैसे निकालें',
        description: 'श्रेणी और बेस किराये से तत्काल का अतिरिक्त शुल्क निकालिए।',
        steps: [
          { name: 'श्रेणी चुनिए', text: 'स्लीपर और 2S पर दर 10% है, एसी श्रेणियों पर 30%।' },
          { name: 'बेस किराया भरिए', text: 'आरक्षण शुल्क, सुपरफास्ट शुल्क और जीएसटी जोड़ने से पहले वाला किराया।' },
          { name: 'यात्री जोड़िए', text: 'शुल्क प्रति यात्री लगता है, इसलिए कुल रकम यात्रियों से गुणा होती है।' },
          { name: 'सीमा देखिए', text: 'हर श्रेणी में न्यूनतम और अधिकतम तय है — छोटी दूरी पर न्यूनतम ही लागू होता है।' },
          { name: 'समय याद रखिए', text: 'एसी के लिए सुबह 10:00 और नॉन-एसी के लिए 11:00 बजे, यात्रा से एक दिन पहले।' },
        ],
      }}
      reviewedOn="31 जुलाई 2026"
      scope="शुल्क भारतीय रेल की प्रकाशित तत्काल तालिका के अनुसार हैं, जो अप्रैल 2026 के किराया संशोधन के बाद भी अपरिवर्तित है। प्रीमियम तत्काल में किराया माँग के अनुसार बदलता है और वह इस गणना में शामिल नहीं है।"
      sources={[
        { label: 'IRCTC आधिकारिक पोर्टल', url: 'https://www.irctc.co.in/' },
        { label: 'भारतीय रेल', url: 'https://indianrailways.gov.in/' },
      ]}
    >
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <div className="space-y-4">
            <div>
              <label htmlFor="hi-tatkal-class" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">
                यात्रा श्रेणी
              </label>
              <select id="hi-tatkal-class" value={classCode} onChange={(e) => setClassCode(e.target.value)} className={controlCls}>
                {Object.keys(TATKAL_RULES).map((code) => (
                  <option key={code} value={code}>{CLASS_LABELS_HI[code]}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-ink-muted dark:text-slate-500">
                दर {Math.round(rule.rate * 100)}% — न्यूनतम {rupee(rule.min)}, अधिकतम {rupee(rule.max)} प्रति यात्री।
              </p>
            </div>

            <div>
              <label htmlFor="hi-basic-fare" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">
                बेस किराया प्रति यात्री (₹)
              </label>
              <input
                id="hi-basic-fare"
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="जैसे 700"
                value={basicFare}
                onChange={(e) => setBasicFare(e.target.value)}
                className={controlCls}
              />
              <p className="mt-1 text-xs text-ink-muted dark:text-slate-500">
                आरक्षण शुल्क, सुपरफास्ट शुल्क और जीएसटी जोड़ने से <strong>पहले</strong> वाला किराया।
              </p>
            </div>

            <div>
              <label htmlFor="hi-tatkal-pax" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">
                यात्रियों की संख्या
              </label>
              <input
                id="hi-tatkal-pax"
                type="number"
                inputMode="numeric"
                min="1"
                value={passengers}
                onChange={(e) => setPassengers(e.target.value)}
                className={controlCls}
              />
            </div>

            <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3 text-sm dark:border-teal-800/60 dark:bg-teal-900/20">
              <p className="font-semibold text-teal-800 dark:text-teal-300">बुकिंग का समय</p>
              <p className="mt-1 text-teal-700 dark:text-teal-400">
                {isAc
                  ? 'इस श्रेणी के लिए तत्काल यात्रा से एक दिन पहले सुबह 10:00 बजे खुलता है।'
                  : 'इस श्रेणी के लिए तत्काल यात्रा से एक दिन पहले सुबह 11:00 बजे खुलता है।'}
              </p>
            </div>
          </div>
        </Card>

        <div className="min-w-0 space-y-5 lg:col-span-3" aria-live="polite">
          {result ? (
            <>
              <Card className="overflow-hidden border-brand-200 bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white dark:border-brand-700">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80">
                  <Zap aria-hidden="true" className="h-3.5 w-3.5" />
                  तत्काल शुल्क
                </div>
                <p className="mt-1 font-display text-3xl font-bold leading-tight">{rupee(result.totalCharge)}</p>
                <p className="mt-0.5 text-sm text-white/85">
                  {rupee(result.chargePerPassenger)} प्रति यात्री × {Math.max(1, Number(passengers) || 1)} — यानी बेस किराये का लगभग{' '}
                  {Math.round(result.percentOfFare)}%
                </p>
                {result.minApplied ? (
                  <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm">
                    {Math.round(rule.rate * 100)}% से निकली रकम न्यूनतम सीमा से कम थी, इसलिए न्यूनतम {rupee(rule.min)} लागू
                    हुआ। छोटी दूरी पर तत्काल इसी वजह से महँगा पड़ता है।
                  </p>
                ) : null}
                {result.maxApplied ? (
                  <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm">
                    रकम अधिकतम सीमा से ऊपर जा रही थी, इसलिए {rupee(rule.max)} पर रुक गई — लंबी दूरी पर तत्काल तुलनात्मक रूप
                    से सस्ता पड़ता है।
                  </p>
                ) : null}
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <ResultStat label="कुल किराया (तत्काल सहित)" value={rupee(result.totalFare)} emphasis />
                <ResultStat label="प्रति यात्री कुल" value={rupee(result.farePerPassenger)} />
              </div>

              <Card className="p-5">
                <h3 className="font-display text-base font-bold text-ink dark:text-white">हिसाब कैसे बना</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-muted dark:text-slate-400">बेस किराया प्रति यात्री</dt>
                    <dd className="font-medium text-ink dark:text-white">{rupee(basicFare)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-muted dark:text-slate-400">तत्काल शुल्क प्रति यात्री</dt>
                    <dd className="font-medium text-ink dark:text-white">+ {rupee(result.chargePerPassenger)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 dark:border-slate-700">
                    <dt className="font-semibold text-ink dark:text-white">कुल ({passengers} यात्री)</dt>
                    <dd className="font-semibold text-ink dark:text-white">{rupee(result.totalFare)}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-ink-muted dark:text-slate-500">
                  इसमें आरक्षण शुल्क, सुपरफास्ट शुल्क और जीएसटी शामिल नहीं हैं — वे अलग से जुड़ते हैं।
                </p>
              </Card>
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center p-10 text-center text-sm text-ink-muted dark:text-slate-400">
              <Zap aria-hidden="true" className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
              बेस किराया भरिए और तत्काल का असली प्रीमियम देखिए।
            </Card>
          )}

          {result ? (
            <ShareResult
              locale="hi"
              url={shareUrl}
              title="तत्काल शुल्क — Railmonk"
              text={`${CLASS_LABELS_HI[classCode]} में तत्काल शुल्क ${rupee(result.chargePerPassenger)} प्रति यात्री।`}
            />
          ) : null}
        </div>
      </div>

      <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
        <h2 className="font-display text-xl font-bold text-ink dark:text-white">
          छोटी दूरी पर तत्काल सबसे महँगा क्यों पड़ता है
        </h2>
        <p className="mt-3">
          तत्काल शुल्क सिर्फ़ प्रतिशत नहीं है — हर श्रेणी में एक न्यूनतम रकम भी तय है। स्लीपर में दर 10% है, पर न्यूनतम
          ₹100। इसका मतलब यह हुआ कि ₹300 के किराये पर भी ₹100 ही लगेगा, यानी असल में 33%। लंबी दूरी पर उल्टा होता है:
          अधिकतम सीमा के कारण प्रीमियम एक हद के बाद बढ़ता ही नहीं, इसलिए प्रतिशत घटता चला जाता है। यही कारण है कि तत्काल
          लंबी यात्राओं के लिए तुलनात्मक रूप से बेहतर सौदा है।
        </p>

        <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">प्रीमियम के अलावा एक और लागत</h3>
        <p className="mt-3">
          कन्फर्म तत्काल टिकट रद्द करने पर कोई रिफंड नहीं मिलता। यह शुल्क तालिका में कहीं नहीं दिखता, पर योजना बदलने की
          संभावना हो तो यह सबसे बड़ी लागत साबित होती है। तुलना कीजिए कि सामान्य टिकट पर 72 घंटे पहले रद्द करने पर सिर्फ़
          निश्चित शुल्क कटता — यह अंतर{' '}
          <Link href="/hi/rail/irctc-cancellation-calculator" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">
            रद्दीकरण कैलकुलेटर
          </Link>{' '}
          में साफ़ दिखता है।
        </p>

        <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">तत्काल से पहले यह देख लीजिए</h3>
        <p className="mt-3">
          कई बार तत्काल की ज़रूरत ही नहीं होती। यदि सामान्य कोटे की खिड़की अभी खुली नहीं है, तो{' '}
          <Link href="/hi/rail/irctc-calculator" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">
            बुकिंग तिथि कैलकुलेटर
          </Link>{' '}
          से तारीख देखकर उसी दिन सुबह 8 बजे कोशिश करना सस्ता पड़ता है। और यदि टिकट पहले से वेटिंग में है, तो{' '}
          <Link href="/hi/rail/waitlist-confirmation-chances" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">
            वेटिंग संभावना
          </Link>{' '}
          देखकर तय कीजिए कि तत्काल पर पैसा लगाना ज़रूरी है भी या नहीं।
        </p>
      </div>

      <NextStep
        title="बुकिंग की खिड़की कब खुलेगी?"
        body="तत्काल यात्रा से एक दिन पहले खुलता है, पर सामान्य कोटा 60 दिन पहले। अपनी तारीख के लिए दोनों समय देख लीजिए।"
        href="/hi/rail/irctc-calculator"
        cta="बुकिंग तिथि देखिए"
        secondary={{ href: '/rail/tatkal-charges-calculator', label: 'Read this page in English' }}
      />
    </HiPageShell>
  );
};

export default TatkalChargesHi;
