import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, Clock, Train } from 'lucide-react';
import { ResultStat } from '../calculator/CalcLayout';
import Card from '../ui/Card';
import ShareResult from '../rail/ShareResult';
import NextStep from '../rail/NextStep';
import useShareableInputs from '../rail/useShareableInputs';
import HiPageShell from './HiPageShell';
import { buildSoftwareApplicationSchema } from '../../utils/schema';
import { QUOTAS, computeBookingWindow } from '../../utils/engines/bookingWindow';

// Every string this page shows a reader lives in this file. The arithmetic does
// not: it comes from the same bookingWindow engine the English page uses, so the
// two can never disagree about a date.
const HREF = '/rail/irctc-calculator';

const controlCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.95rem] text-ink ' +
  'shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 ' +
  'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

const QUOTA_LABELS = {
  general: { label: 'जनरल / सामान्य बुकिंग', hint: 'मेल, एक्सप्रेस, राजधानी, शताब्दी, दुरंतो और वंदे भारत' },
  'tatkal-ac': { label: 'तत्काल — एसी श्रेणियाँ', hint: '1A, 2A, 3A, 3E, CC, EC और प्रीमियम तत्काल' },
  'tatkal-non-ac': { label: 'तत्काल — स्लीपर और नॉन-एसी', hint: 'SL, 2S और अन्य नॉन-एसी श्रेणियाँ' },
  'foreign-tourist': { label: 'विदेशी पर्यटक कोटा', hint: '365 दिन की अवधि, जो अब भी अपरिवर्तित है' },
};

const MONTHS_HI = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
const DAYS_HI = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

/** '2026-10-01' → 'गुरुवार, 1 अक्टूबर 2026' */
const formatHindiDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return '';
  const [, y, mo, d] = m;
  const instant = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  return `${DAYS_HI[instant.getUTCDay()]}, ${Number(d)} ${MONTHS_HI[Number(mo) - 1]} ${y}`;
};

const TIME_LABELS_HI = {
  '08:00': 'सुबह 8:00 बजे',
  '10:00': 'सुबह 10:00 बजे',
  '11:00': 'सुबह 11:00 बजे',
};

const FAQS = [
  {
    question: 'ट्रेन की टिकट कितने दिन पहले बुक हो सकती है?',
    answer:
      'सामान्य कोटा में यात्रा की तारीख से 60 दिन पहले, यात्रा का दिन गिने बिना। यह सीमा 1 नवंबर 2024 से लागू हुई, इससे पहले यह 120 दिन थी। बुकिंग उस दिन सुबह 8:00 बजे खुलती है। विदेशी पर्यटक कोटा अब भी 365 दिन का है।',
  },
  {
    question: 'तत्काल बुकिंग किस समय शुरू होती है?',
    answer:
      'तत्काल यात्रा से ठीक एक दिन पहले खुलता है। एसी श्रेणियों (1A, 2A, 3A, 3E, CC, EC) के लिए सुबह 10:00 बजे और स्लीपर तथा अन्य नॉन-एसी श्रेणियों के लिए सुबह 11:00 बजे। ध्यान रखें कि यह गिनती यात्रा के दिन से एक दिन पीछे होती है — यानी 10 तारीख की यात्रा के लिए तत्काल 9 तारीख को खुलेगा।',
  },
  {
    question: 'क्या 8 बजे और 10 बजे का समय एक ही चीज़ है?',
    answer:
      'नहीं, और यही सबसे आम भ्रम है। सुबह 8:00 बजे सामान्य कोटा की 60-दिन वाली बुकिंग खुलती है। सुबह 10:00 और 11:00 बजे केवल तत्काल की बुकिंग खुलती है, जो यात्रा से एक दिन पहले होती है। दोनों अलग-अलग खिड़कियाँ हैं।',
  },
  {
    question: 'क्या 60 दिन की गिनती में यात्रा का दिन शामिल है?',
    answer:
      'नहीं। यात्रा का दिन गिनती से बाहर रहता है। इसलिए यदि आपकी यात्रा 1 अक्टूबर को है, तो उससे 60 दिन पीछे जाकर बुकिंग की तारीख निकलती है — यह कैलकुलेटर वही गणना करता है, ताकि आपको एक दिन का अंतर न झेलना पड़े।',
  },
  {
    question: 'बुकिंग खुलने के समय टिकट कैसे मिले?',
    answer:
      'खिड़की खुलने से पहले IRCTC में लॉग इन रहें, यात्रियों की जानकारी मास्टर लिस्ट में पहले से भर लें, और भुगतान का तरीका तय रखें। लोकप्रिय ट्रेनों में जनरल कोटा भी पहले कुछ मिनटों में भर जाता है, इसलिए तैयारी ही असली फ़र्क डालती है।',
  },
];

const softwareSchema = buildSoftwareApplicationSchema({
  name: 'IRCTC बुकिंग तिथि कैलकुलेटर',
  url: `https://railmonk.com/hi${HREF}`,
  description:
    'जानिए आपकी ट्रेन टिकट की बुकिंग किस तारीख और किस समय खुलेगी — जनरल कोटा (60 दिन) और तत्काल, दोनों के लिए।',
  applicationCategory: 'TravelApplication',
  featureList: ['60 दिन की अग्रिम आरक्षण अवधि', 'तत्काल बुकिंग का समय', 'विदेशी पर्यटक कोटा', 'बुकिंग खुलने तक की गिनती'],
});

const BookingDateCalculatorHi = () => {
  const [journeyDate, setJourneyDate] = useState('');
  const [quotaId, setQuotaId] = useState('general');

  const shareUrl = useShareableInputs({ date: journeyDate, quota: quotaId }, (params) => {
    if (params.date) setJourneyDate(params.date);
    if (params.quota && QUOTAS.some((q) => q.id === params.quota)) setQuotaId(params.quota);
  });

  const todayIso = new Date().toISOString().split('T')[0];

  const result = useMemo(
    () => (journeyDate ? computeBookingWindow({ journeyDate, quotaId, today: todayIso }) : null),
    [journeyDate, quotaId, todayIso]
  );

  const quotaCopy = QUOTA_LABELS[quotaId] || QUOTA_LABELS.general;

  const statusLine = (() => {
    if (!result) return '';
    if (result.status === 'journey-passed') return 'यह तारीख बीत चुकी है — आगे की कोई तारीख चुनिए।';
    if (result.status === 'open-today') return 'बुकिंग आज ही खुल रही है।';
    if (result.status === 'window-open') return 'बुकिंग खुल चुकी है — आप अभी टिकट ले सकते हैं।';
    // "1 दिन बाक़ी हैं" is wrong; Hindi needs the singular verb for one day.
    return result.daysUntilOpen === 1 ? 'अभी 1 दिन बाक़ी है।' : `अभी ${result.daysUntilOpen} दिन बाक़ी हैं।`;
  })();

  return (
    <HiPageShell
      englishHref={HREF}
      metaTitle="IRCTC बुकिंग तिथि कैलकुलेटर — टिकट कब से बुक होगी | Railmonk"
      metaDescription="ट्रेन टिकट कितने दिन पहले बुक होती है? 60 दिन का नियम, तत्काल का समय और विदेशी पर्यटक कोटा — अपनी यात्रा की तारीख डालिए और सटीक दिन तथा समय जानिए।"
      ogDescription="यात्रा की तारीख डालिए और जानिए बुकिंग किस दिन, किस समय खुलेगी।"
      eyebrow="बुकिंग"
      title="IRCTC बुकिंग तिथि कैलकुलेटर"
      subtitle="अपनी यात्रा की तारीख डालिए और जानिए कि टिकट की बुकिंग ठीक किस दिन और किस समय खुलेगी — जनरल कोटा के लिए भी और तत्काल के लिए भी।"
      breadcrumbLabel="बुकिंग तिथि कैलकुलेटर"
      schema={softwareSchema}
      faqs={FAQS}
      howTo={{
        name: 'ट्रेन टिकट की बुकिंग तिथि कैसे निकालें',
        description: 'यात्रा की तारीख और कोटा से बुकिंग खुलने का दिन और समय निकालिए।',
        steps: [
          { name: 'यात्रा की तारीख भरिए', text: 'वह तारीख डालिए जिस दिन ट्रेन अपने शुरुआती स्टेशन से चलती है।' },
          { name: 'कोटा चुनिए', text: 'जनरल, तत्काल (एसी या नॉन-एसी) या विदेशी पर्यटक — हर एक की खिड़की अलग समय पर खुलती है।' },
          { name: 'तारीख देखिए', text: 'कैलकुलेटर 60 दिन (या तत्काल के लिए 1 दिन) पीछे गिनकर सही तारीख बताता है।' },
          { name: 'समय नोट कीजिए', text: 'जनरल के लिए सुबह 8:00, तत्काल एसी के लिए 10:00 और नॉन-एसी के लिए 11:00 बजे।' },
          { name: 'पहले से तैयार रहिए', text: 'मास्टर लिस्ट और भुगतान का तरीका पहले से तैयार रखिए — लोकप्रिय ट्रेनें मिनटों में भर जाती हैं।' },
        ],
      }}
      reviewedOn="31 जुलाई 2026"
      scope="गणना रेलवे बोर्ड की वाणिज्यिक परिपत्र संख्या 10/2024 के अनुसार है, जिसके तहत 1 नवंबर 2024 से अग्रिम आरक्षण अवधि 60 दिन है। विदेशी पर्यटक कोटा 365 दिन पर अपरिवर्तित है। अंतिम पुष्टि IRCTC की आधिकारिक वेबसाइट पर करें।"
      sources={[
        { label: 'IRCTC आधिकारिक पोर्टल', url: 'https://www.irctc.co.in/' },
        { label: 'भारतीय रेल', url: 'https://indianrailways.gov.in/' },
      ]}
    >
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <div className="space-y-4">
            <div>
              <label htmlFor="hi-journey-date" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">
                यात्रा की तारीख
              </label>
              <input
                id="hi-journey-date"
                type="date"
                value={journeyDate}
                onChange={(e) => setJourneyDate(e.target.value)}
                className={controlCls}
              />
              <p className="mt-1 text-xs text-ink-muted dark:text-slate-500">
                ट्रेन के <strong>शुरुआती स्टेशन</strong> से चलने की तारीख डालिए, अपने चढ़ने के स्टेशन की नहीं।
              </p>
            </div>

            <div>
              <label htmlFor="hi-quota" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">
                कोटा
              </label>
              <select
                id="hi-quota"
                value={quotaId}
                onChange={(e) => setQuotaId(e.target.value)}
                className={controlCls}
              >
                {QUOTAS.map((q) => (
                  <option key={q.id} value={q.id}>
                    {QUOTA_LABELS[q.id]?.label || q.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-ink-muted dark:text-slate-500">{quotaCopy.hint}</p>
            </div>

            <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3 text-sm dark:border-teal-800/60 dark:bg-teal-900/20">
              <p className="font-semibold text-teal-800 dark:text-teal-300">दो अलग-अलग घड़ियाँ</p>
              <ul className="mt-1 space-y-1 text-teal-700 dark:text-teal-400">
                <li>जनरल कोटा → यात्रा से 60 दिन पहले, सुबह 8:00 बजे।</li>
                <li>तत्काल (एसी) → एक दिन पहले, सुबह 10:00 बजे।</li>
                <li>तत्काल (स्लीपर) → एक दिन पहले, सुबह 11:00 बजे।</li>
              </ul>
            </div>
          </div>
        </Card>

        <div className="min-w-0 space-y-5 lg:col-span-3" aria-live="polite">
          {result ? (
            <>
              <Card className="overflow-hidden border-brand-200 bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white dark:border-brand-700">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80">
                  <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
                  बुकिंग खुलने की तारीख
                </div>
                <p className="mt-1 font-display text-2xl font-bold leading-tight">{formatHindiDate(result.opensDate)}</p>
                <p className="mt-0.5 text-sm text-white/85">
                  {TIME_LABELS_HI[result.opensTime] || result.opensTime} से
                </p>
                <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm">{statusLine}</p>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <ResultStat label="अग्रिम अवधि" value={`${result.advanceDays} दिन`} emphasis />
                <ResultStat label="खुलने का समय" value={TIME_LABELS_HI[result.opensTime] || result.opensTime} />
              </div>

              <Card className="p-5">
                <h3 className="font-display text-base font-bold text-ink dark:text-white">इसका मतलब क्या है</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-slate-400">
                  {quotaCopy.label} के लिए खिड़की यात्रा से {result.advanceDays} दिन पहले खुलती है, और यात्रा का दिन इस
                  गिनती में शामिल नहीं होता। इसी वजह से लोग अक्सर एक दिन चूक जाते हैं।
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted dark:text-slate-400">
                  लोकप्रिय ट्रेनों में सीटें पहले कुछ मिनटों में ही भर जाती हैं। इसलिए खिड़की खुलने से थोड़ा पहले लॉग इन रहना
                  और यात्रियों का विवरण पहले से भरकर रखना ही सबसे बड़ा फ़ायदा देता है।
                </p>
              </Card>
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center p-10 text-center text-sm text-ink-muted dark:text-slate-400">
              <Train aria-hidden="true" className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
              यात्रा की तारीख डालिए और जानिए बुकिंग कब खुलेगी।
            </Card>
          )}

          {result ? (
            <ShareResult
              locale="hi"
              url={shareUrl}
              title="बुकिंग तिथि — Railmonk"
              text={`${formatHindiDate(result.journeyDate)} की यात्रा के लिए बुकिंग ${formatHindiDate(result.opensDate)} को खुलेगी।`}
            />
          ) : null}
        </div>
      </div>

      <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
        <h2 className="font-display text-xl font-bold text-ink dark:text-white">120 दिन से 60 दिन तक</h2>
        <p className="mt-3">
          1 नवंबर 2024 से पहले टिकट यात्रा से 120 दिन पहले तक बुक हो जाती थी। रेलवे बोर्ड ने इसे घटाकर 60 दिन कर दिया,
          मुख्य रूप से इसलिए कि इतनी दूर की बुकिंग में रद्दीकरण बहुत ज़्यादा होता था और सीटें अंत तक बेकार पड़ी रहती थीं।
          नतीजा यह है कि अब खिड़की छोटी है और भीड़ ज़्यादा — इसलिए तारीख का ठीक-ठीक पता होना पहले से अधिक मायने रखता है।
        </p>

        <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">
          सबसे आम ग़लती: 8 बजे और 10 बजे को मिला देना
        </h3>
        <p className="mt-3">
          सुबह 10:00 और 11:00 बजे का समय <strong>केवल तत्काल</strong> के लिए है, और तत्काल यात्रा से सिर्फ़ एक दिन पहले
          खुलता है। सामान्य 60-दिन वाली बुकिंग सुबह <strong>8:00 बजे</strong> खुलती है। हर साल बहुत से यात्री 60 दिन पहले
          सुबह 10 बजे लॉग इन करते हैं और तब तक अच्छी सीटें जा चुकी होती हैं।
        </p>

        <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">अगर टिकट वेटिंग में चली जाए</h3>
        <p className="mt-3">
          वेटिंग नंबर देखकर घबराने की ज़रूरत नहीं — पर उम्मीद कितनी रखनी है, यह कोड पर निर्भर करता है। GNWL अक्सर साफ़ हो
          जाता है, RLWL बहुत कम। इसका अंदाज़ा{' '}
          <Link href="/hi/rail/waitlist-confirmation-chances" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">
            वेटिंग लिस्ट कैलकुलेटर
          </Link>{' '}
          से लगाइए, और तत्काल का असली ख़र्च{' '}
          <Link href="/hi/rail/tatkal-charges-calculator" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">
            तत्काल शुल्क कैलकुलेटर
          </Link>{' '}
          से देख लीजिए।
        </p>
      </div>

      <NextStep
        title="तत्काल का असली ख़र्च कितना पड़ेगा?"
        body="तत्काल में बेस किराये के ऊपर जो प्रीमियम लगता है, वह श्रेणी और दूरी के हिसाब से बदलता है। भुगतान से पहले जान लीजिए।"
        href="/hi/rail/tatkal-charges-calculator"
        cta="तत्काल शुल्क देखिए"
        secondary={{ href: '/rail/irctc-calculator', label: 'Read this page in English' }}
      />
    </HiPageShell>
  );
};

export default BookingDateCalculatorHi;
