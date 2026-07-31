import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ListOrdered, TrendingUp } from 'lucide-react';
import { ResultStat } from '../calculator/CalcLayout';
import Card from '../ui/Card';
import ShareResult from '../rail/ShareResult';
import NextStep from '../rail/NextStep';
import useShareableInputs from '../rail/useShareableInputs';
import HiPageShell from './HiPageShell';
import { buildSoftwareApplicationSchema } from '../../utils/schema';
import { WL_TYPES, estimateChances } from '../../utils/engines/waitlistChances';

const HREF = '/rail/waitlist-confirmation-chances';

const controlCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.95rem] text-ink ' +
  'shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 ' +
  'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

// What each code means, in Hindi. The behaviour these describe is the same the
// engine scores — only the language differs.
const WL_COPY_HI = {
  GNWL: {
    name: 'जनरल वेटिंग लिस्ट',
    meaning:
      'तब मिलती है जब यात्रा ट्रेन के शुरुआती स्टेशन से या उसके आसपास से शुरू होती है। इसका कोटा सबसे बड़ा होता है, इसलिए पूरी ट्रेन के रद्दीकरण का फ़ायदा इसी को मिलता है — कन्फर्म होने की संभावना सबसे अधिक इसी में रहती है।',
  },
  RLWL: {
    name: 'रिमोट लोकेशन वेटिंग लिस्ट',
    meaning:
      'बीच के स्टेशनों के बीच की यात्रा पर मिलती है। यह केवल उसी छोटे-से रिमोट कोटे के रद्दीकरण से साफ़ होती है, इसलिए उतना ही नंबर होने पर भी GNWL के मुक़ाबले काफ़ी कम कन्फर्म होती है।',
  },
  PQWL: {
    name: 'पूल्ड कोटा वेटिंग लिस्ट',
    meaning:
      'एक ही छोटे कोटे को कई बीच के स्टेशन आपस में बाँटते हैं। इतने स्टेशनों के बीच बँटा हुआ कोटा होने के कारण PQWL सबसे कमज़ोर वेटिंग लिस्टों में गिनी जाती है।',
  },
  RSWL: {
    name: 'रोडसाइड स्टेशन वेटिंग लिस्ट',
    meaning:
      'शुरुआती स्टेशन से रास्ते के किसी छोटे स्टेशन तक की बुकिंग पर मिलती है। कोटा सीमित होता है और उसमें रद्दीकरण भी कम होते हैं, इसलिए यह GNWL से धीमी चलती है।',
  },
  TQWL: {
    name: 'तत्काल वेटिंग लिस्ट',
    meaning:
      'तत्काल कोटे की वेटिंग (पुराने PNR में CKWL दिखती थी)। कन्फर्म तत्काल टिकट पर रिफंड नहीं मिलता, इसलिए लोग उसे रद्द ही नहीं करते और यह लिस्ट लगभग नहीं खिसकती। चार्ट बनते समय ख़ाली तत्काल बर्थ पहले GNWL को दी जाती हैं।',
  },
  RAC: {
    name: 'रिज़र्वेशन अगेंस्ट कैंसिलेशन',
    meaning:
      'यह वेटिंग नहीं है — RAC में यात्रा की गारंटी होती है। शुरुआत में एक साइड-लोअर बर्थ दो यात्रियों के बीच साझा होती है, और यात्रा के दौरान जैसे-जैसे कन्फर्म यात्री रद्द करते हैं, पूरी बर्थ मिल जाती है।',
  },
};

const BAND_COPY_HI = {
  'very-high': { label: 'कन्फर्म होने की बहुत अच्छी संभावना', pct: 'अनुमानतः 80–95%' },
  high: { label: 'अच्छी संभावना', pct: 'अनुमानतः 60–80%' },
  moderate: { label: 'कह नहीं सकते — दोनों तरफ़ जा सकता है', pct: 'अनुमानतः 40–60%' },
  low: { label: 'कन्फर्म होने की कम संभावना', pct: 'अनुमानतः 20–40%' },
  'very-low': { label: 'कन्फर्म होने की बहुत कम संभावना', pct: 'अनुमानतः 20% से कम' },
};

// Same thresholds as the engine, said in Hindi — rendered from the keys the
// engine returns, so these can never disagree about which case applied.
const FACTOR_COPY_HI = {
  'wl-front': 'नंबर क़तार में सबसे आगे है — कुछ ही रद्दीकरण काफ़ी होंगे।',
  'wl-typical': 'यह नंबर सामान्यतः साफ़ हो जाने वाली गहराई में है, बशर्ते समय बचा हो।',
  'wl-deep': 'इस नंबर के लिए लगातार रद्दीकरण चाहिए, तभी बात बनेगी।',
  'wl-very-deep': 'नंबर क़तार में बहुत पीछे है — ज़्यादातर ट्रेनों में एक ही कोटे में इतने रद्दीकरण नहीं होते।',
  'lead-long': 'यात्रा में अभी काफ़ी समय है, इसलिए रद्दीकरण जमा होने का पूरा मौक़ा है।',
  'lead-medium': 'यात्रा में ठीक-ठाक समय बचा है, हलचल की गुंजाइश है।',
  'lead-short': 'अब ज़्यादातर हलचल चार्ट बनते समय ही होगी।',
  'lead-imminent': 'यात्रा बहुत नज़दीक है — अब मुख्य उम्मीद अंतिम चार्ट पर बची है, जब बचे हुए कोटे खुलते हैं।',
  peak: 'त्योहार या छुट्टियों के मौसम में रद्दीकरण बहुत घट जाते हैं, इसलिए वेटिंग सामान्य से कम खिसकती है।',
  tqwl: 'तत्काल में रद्दीकरण लगभग नहीं होते, और चार्ट बनते समय ख़ाली तत्काल बर्थ पहले GNWL को जाती हैं।',
  rac: 'RAC में यात्रा तो पक्की है — यहाँ अनुमान पूरी बर्थ मिलने का लगाया जा रहा है।',
};

const FAQS = [
  {
    question: 'GNWL और RLWL में क्या अंतर है?',
    answer:
      'GNWL तब मिलती है जब यात्रा ट्रेन के शुरुआती स्टेशन से शुरू होती है और इसका कोटा सबसे बड़ा होता है, इसलिए यह सबसे तेज़ साफ़ होती है। RLWL बीच के स्टेशनों के लिए होती है और केवल उसी छोटे कोटे के रद्दीकरण से खिसकती है। यही वजह है कि GNWL 40 अक्सर कन्फर्म हो जाती है जबकि RLWL 10 अटकी रह सकती है।',
  },
  {
    question: 'क्या वेटिंग टिकट पर यात्रा की जा सकती है?',
    answer:
      'ई-टिकट पर नहीं। पूरी तरह वेटिंग रह गई ई-टिकट चार्ट बनते ही अपने आप रद्द हो जाती है और पैसा वापस आ जाता है — उस पर यात्रा करना अनधिकृत माना जाता है। काउंटर से ली गई वेटिंग टिकट पर स्थिति अलग है, पर उसमें भी आरक्षित कोच में बर्थ का अधिकार नहीं मिलता।',
  },
  {
    question: 'RAC का मतलब क्या है और क्या यह सुरक्षित है?',
    answer:
      'RAC वेटिंग नहीं है — इसमें यात्रा पक्की होती है। शुरुआत में एक साइड-लोअर बर्थ दो यात्रियों में साझा होती है, और यात्रा के दौरान कन्फर्म यात्रियों के रद्द करने या न आने पर पूरी बर्थ मिल जाती है। ध्यान रखें कि RAC टिकट चार्ट बनने पर अपने आप रद्द नहीं होती, इसलिए यात्रा न करनी हो तो प्रस्थान से कम से कम आधे घंटे पहले ख़ुद रद्द कीजिए।',
  },
  {
    question: 'TQWL इतनी धीमी क्यों चलती है?',
    answer:
      'क्योंकि कन्फर्म तत्काल टिकट रद्द करने पर कोई रिफंड नहीं मिलता, इसलिए कोई उसे रद्द ही नहीं करता। ऊपर से चार्ट बनते समय ख़ाली तत्काल बर्थ पहले GNWL वालों को दी जाती हैं। इसीलिए तत्काल वेटिंग पर भरोसा करके यात्रा की योजना बनाना जोखिम भरा है।',
  },
  {
    question: 'क्या यह अनुमान पक्का है?',
    answer:
      'नहीं, और हम इसे पक्का बताने का दावा भी नहीं करते। भारतीय रेल हर ट्रेन के लिए कन्फर्मेशन की दर प्रकाशित नहीं करती। यह अनुमान कोटे के व्यवहार, आपके नंबर, बचे हुए दिनों और मौसम को जोड़कर एक दिशा बताता है — निर्णय लेने में मदद के लिए, गारंटी के रूप में नहीं।',
  },
];

const softwareSchema = buildSoftwareApplicationSchema({
  name: 'वेटिंग लिस्ट कन्फर्मेशन अनुमान',
  url: `https://railmonk.com/hi${HREF}`,
  description: 'GNWL, RLWL, PQWL और TQWL का मतलब समझिए और जानिए कि आपकी टिकट कन्फर्म होने की कितनी संभावना है।',
  applicationCategory: 'TravelApplication',
  featureList: ['वेटिंग कोड की व्याख्या', 'कन्फर्मेशन का अनुमान', 'चार्ट बनने पर क्या होगा', 'RAC के नियम'],
});

const WaitlistChancesHi = () => {
  const [wlCode, setWlCode] = useState('GNWL');
  const [wlNumber, setWlNumber] = useState('');
  const [daysToJourney, setDaysToJourney] = useState('7');
  const [peakSeason, setPeakSeason] = useState(false);

  const shareUrl = useShareableInputs(
    { code: wlCode, no: wlNumber, days: daysToJourney, peak: peakSeason ? '1' : '' },
    (params) => {
      if (params.code && WL_TYPES.some((t) => t.code === params.code)) setWlCode(params.code);
      if (params.no) setWlNumber(params.no);
      if (params.days) setDaysToJourney(params.days);
      if (params.peak === '1') setPeakSeason(true);
    }
  );

  const result = useMemo(() => {
    if (!wlNumber) return null;
    return estimateChances({
      wlCode,
      wlNumber: Number(wlNumber),
      daysToJourney: Number(daysToJourney) || 0,
      peakSeason,
    });
  }, [wlCode, wlNumber, daysToJourney, peakSeason]);

  const copy = WL_COPY_HI[wlCode];
  const band = result ? BAND_COPY_HI[result.band] : null;

  return (
    <HiPageShell
      englishHref={HREF}
      metaTitle="वेटिंग टिकट कन्फर्म होगी या नहीं — GNWL, RLWL, PQWL, TQWL | Railmonk"
      metaDescription="अपना वेटिंग कोड और नंबर डालिए और जानिए कन्फर्म होने की कितनी संभावना है। GNWL, RLWL, PQWL, RSWL, TQWL और RAC — हर कोड का मतलब हिंदी में।"
      ogDescription="वेटिंग कोड और नंबर डालिए, कन्फर्मेशन की संभावना जानिए।"
      eyebrow="वेटिंग लिस्ट और RAC"
      title="वेटिंग लिस्ट कन्फर्म होने की संभावना"
      subtitle="PNR पर लिखा कोड ही असली कहानी बताता है। अपना कोड और नंबर डालिए और एक ईमानदार अनुमान लीजिए कि टिकट कन्फर्म होगी या नहीं — और अगर नहीं, तो क्या करना चाहिए।"
      breadcrumbLabel="वेटिंग लिस्ट संभावना"
      schema={softwareSchema}
      faqs={FAQS}
      howTo={{
        name: 'वेटिंग लिस्ट कन्फर्म होने की संभावना कैसे जानें',
        description: 'PNR के कोड और नंबर से कन्फर्मेशन का अनुमान लगाइए।',
        steps: [
          { name: 'कोड पहचानिए', text: 'PNR पर GNWL, RLWL, PQWL, RSWL, TQWL या RAC में से कोई एक लिखा होता है।' },
          { name: 'नंबर डालिए', text: 'कोड के आगे लिखा अंक ही क़तार में आपकी जगह बताता है।' },
          { name: 'बचे दिन भरिए', text: 'यात्रा में जितने दिन बचे हैं, रद्दीकरण जमा होने का उतना ही मौक़ा है।' },
          { name: 'मौसम बताइए', text: 'त्योहार या छुट्टियों में रद्दीकरण घटते हैं और वेटिंग कम खिसकती है।' },
          { name: 'विकल्प तय कीजिए', text: 'संभावना कम दिखे तो तत्काल, दूसरी ट्रेन या VIKALP पर समय रहते सोचिए।' },
        ],
      }}
      reviewedOn="31 जुलाई 2026"
      scope="कोड की व्याख्या और चार्ट बनने पर होने वाला व्यवहार भारतीय रेल के कोटा नियमों पर आधारित तथ्य हैं। कन्फर्मेशन की संभावना एक अनुमान है — भारतीय रेल हर ट्रेन के लिए कन्फर्मेशन दर प्रकाशित नहीं करती, इसलिए इसे दिशा समझिए, गारंटी नहीं।"
      sources={[
        { label: 'IRCTC आधिकारिक पोर्टल', url: 'https://www.irctc.co.in/' },
        { label: 'PNR स्थिति — रेलवे पूछताछ', url: 'https://enquiry.indianrail.gov.in/' },
      ]}
    >
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <div className="space-y-4">
            <div>
              <label htmlFor="hi-wl-code" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">
                वेटिंग का कोड
              </label>
              <select id="hi-wl-code" value={wlCode} onChange={(e) => setWlCode(e.target.value)} className={controlCls}>
                {WL_TYPES.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.code} — {WL_COPY_HI[t.code].name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-ink-muted dark:text-slate-500">{copy.meaning}</p>
            </div>

            <div>
              <label htmlFor="hi-wl-number" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">
                वेटिंग नंबर
              </label>
              <input
                id="hi-wl-number"
                type="number"
                inputMode="numeric"
                min="1"
                placeholder="जैसे 24"
                value={wlNumber}
                onChange={(e) => setWlNumber(e.target.value)}
                className={controlCls}
              />
            </div>

            <div>
              <label htmlFor="hi-days" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">
                यात्रा में कितने दिन बाक़ी हैं
              </label>
              <input
                id="hi-days"
                type="number"
                inputMode="numeric"
                min="0"
                value={daysToJourney}
                onChange={(e) => setDaysToJourney(e.target.value)}
                className={controlCls}
              />
            </div>

            <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
              <input
                type="checkbox"
                checked={peakSeason}
                onChange={(e) => setPeakSeason(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-ink-soft dark:text-slate-300">
                त्योहार या छुट्टियों का मौसम
                <span className="mt-0.5 block text-xs text-ink-muted dark:text-slate-500">
                  दिवाली, छठ, होली, गर्मी की छुट्टियाँ — इनमें रद्दीकरण बहुत कम होते हैं।
                </span>
              </span>
            </label>
          </div>
        </Card>

        <div className="min-w-0 space-y-5 lg:col-span-3" aria-live="polite">
          {result ? (
            <>
              <Card className="overflow-hidden border-brand-200 bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white dark:border-brand-700">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80">
                  <TrendingUp aria-hidden="true" className="h-3.5 w-3.5" />
                  अनुमान
                </div>
                <p className="mt-1 font-display text-2xl font-bold leading-tight">{band.label}</p>
                <p className="mt-0.5 text-sm text-white/85">{band.pct}</p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white/90" style={{ width: `${result.score}%` }} />
                </div>
                <p className="mt-2 text-xs text-white/75">
                  यह एक अनुमान है, वादा नहीं — भारतीय रेल हर ट्रेन के आँकड़े प्रकाशित नहीं करती।
                </p>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <ResultStat label="कोड" value={`${wlCode} ${wlNumber}`} emphasis />
                <ResultStat label="यात्रा में बाक़ी" value={`${daysToJourney} दिन`} />
              </div>

              <Card className="p-5">
                <h3 className="font-display text-base font-bold text-ink dark:text-white">यह अनुमान किस आधार पर है</h3>
                <ul className="mt-3 space-y-2 text-sm text-ink-muted dark:text-slate-400">
                  {(result.factorKeys || []).map((key) => (
                    <li key={key} className="flex gap-2">
                      <span aria-hidden="true" className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                      <span>{FACTOR_COPY_HI[key]}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-5">
                <h3 className="font-display text-base font-bold text-ink dark:text-white">चार्ट बनने पर क्या होगा</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-slate-400">
                  {wlCode === 'RAC'
                    ? 'RAC टिकट चार्ट बनने पर अपने आप रद्द नहीं होती। यात्रा न करनी हो तो प्रस्थान से कम से कम आधे घंटे पहले ख़ुद रद्द कीजिए, वरना पूरा किराया चला जाएगा।'
                    : 'चार्ट बनने तक टिकट पूरी तरह वेटिंग रह गई तो ई-टिकट अपने आप रद्द हो जाएगी और क्लर्केज काटकर बाक़ी रकम उसी खाते में लौट आएगी। इसके लिए TDR भरने की ज़रूरत नहीं।'}
                </p>
              </Card>
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center p-10 text-center text-sm text-ink-muted dark:text-slate-400">
              <ListOrdered aria-hidden="true" className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
              अपना वेटिंग नंबर डालिए और कन्फर्म होने की संभावना देखिए।
            </Card>
          )}

          {result ? (
            <ShareResult
              locale="hi"
              url={shareUrl}
              title="वेटिंग लिस्ट संभावना — Railmonk"
              text={`${wlCode} ${wlNumber}: ${band.label}`}
            />
          ) : null}
        </div>
      </div>

      <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
        <h2 className="font-display text-xl font-bold text-ink dark:text-white">नंबर से ज़्यादा कोड मायने रखता है</h2>
        <p className="mt-3">
          लोग वेटिंग नंबर देखकर घबराते या निश्चिंत होते हैं, जबकि असली जानकारी उसके आगे लिखे कोड में होती है। GNWL 40 अक्सर
          कन्फर्म हो जाती है, क्योंकि पूरी ट्रेन के रद्दीकरण उसी कोटे में लौटते हैं। वहीं PQWL 8 कई बार अटकी रह जाती है,
          क्योंकि उस छोटे-से कोटे को कई स्टेशन आपस में बाँटते हैं। इसलिए दो टिकटों की तुलना सिर्फ़ नंबर से करना ग़लत नतीजे
          देता है।
        </p>

        <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">
          अगर संभावना कम दिख रही हो तो
        </h3>
        <p className="mt-3">
          इंतज़ार करने के बजाय समय रहते विकल्प देखिए। VIKALP योजना में आप सात वैकल्पिक ट्रेनें चुन सकते हैं और चार्ट बनने के
          बाद भी वेटिंग रह जाने पर बिना अतिरिक्त शुल्क के दूसरी ट्रेन में जगह मिल सकती है। तत्काल यात्रा से एक दिन पहले
          खुलता है और उसका असली ख़र्च{' '}
          <Link href="/hi/rail/tatkal-charges-calculator" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">
            तत्काल शुल्क कैलकुलेटर
          </Link>{' '}
          से पहले ही देखा जा सकता है।
        </p>

        <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">RAC को वेटिंग मत समझिए</h3>
        <p className="mt-3">
          RAC मिलने का मतलब है कि आपकी यात्रा पक्की है — शुरुआत में साझा साइड-लोअर बर्थ पर, और आगे चलकर अक्सर पूरी बर्थ पर।
          एक अंतर ज़रूर याद रखिए: वेटिंग ई-टिकट चार्ट बनने पर अपने आप रद्द हो जाती है, पर RAC टिकट नहीं। यात्रा नहीं करनी तो
          उसे ख़ुद रद्द करना पड़ता है, वरना पूरा किराया चला जाता है।
        </p>
      </div>

      <NextStep
        title="चार्ट कब बनेगा?"
        body="चार्ट बनते ही वेटिंग खिसकना बंद हो जाती है। जानिए आपकी ट्रेन का पहला और अंतिम चार्ट किस समय बनेगा।"
        href="/rail/chart-preparation-time"
        cta="चार्ट का समय देखिए"
        secondary={{ href: '/rail/waitlist-confirmation-chances', label: 'Read this page in English' }}
      />
    </HiPageShell>
  );
};

export default WaitlistChancesHi;
