import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, BadgeIndianRupee, CalendarClock, ListOrdered, Zap } from 'lucide-react';
import { CalcLayout } from '../../components/calculator/CalcLayout';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Card from '../../components/ui/Card';
import LocaleHead from '../../components/i18n/LocaleHead';
import { TOOLS, localizedTitle, localizedBlurb } from '../../utils/catalog';
import { TRANSLATED } from '../../utils/i18n';

const URL = 'https://railmonk.com/hi';

// Only tools that actually have a Hindi page. The rest are linked at the bottom
// as English, honestly labelled, rather than dressed up with a Hindi title that
// leads to an English page.
const TRANSLATED_TOOLS = TOOLS.filter((tool) => TRANSLATED.includes(tool.href));
const ENGLISH_ONLY = TOOLS.filter((tool) => !TRANSLATED.includes(tool.href));

const ICONS = {
  '/rail/irctc-calculator': CalendarClock,
  '/rail/irctc-cancellation-calculator': BadgeIndianRupee,
  '/rail/waitlist-confirmation-chances': ListOrdered,
  '/rail/tatkal-charges-calculator': Zap,
};

const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Railmonk — हिंदी में रेल टूल',
  itemListElement: TRANSLATED_TOOLS.map((tool, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: tool.titleHi || tool.title,
    url: `https://railmonk.com/hi${tool.href}`,
  })),
};

export default function HindiHome() {
  return (
    <>
      <Head>
        <title>भारतीय रेल के मुफ़्त टूल — बुकिंग, रिफंड, वेटिंग और तत्काल | Railmonk</title>
        <meta
          name="description"
          content="IRCTC बुकिंग की तारीख, टिकट रद्दीकरण पर रिफंड, वेटिंग लिस्ट कन्फर्म होने की संभावना और तत्काल शुल्क — नियमों पर आधारित मुफ़्त कैलकुलेटर, हिंदी में।"
        />
        <link rel="canonical" href={URL} />
        <meta property="og:title" content="भारतीय रेल के मुफ़्त टूल — Railmonk" />
        <meta property="og:description" content="बुकिंग की तारीख, रिफंड, वेटिंग और तत्काल — सब कुछ नियमों के साथ, हिंदी में।" />
        <meta property="og:url" content={URL} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="hi_IN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="भारतीय रेल के मुफ़्त टूल — Railmonk" />
        <meta name="twitter:description" content="नियम पढ़िए, अंदाज़ा मत लगाइए।" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      </Head>
      <LocaleHead path="/" />

      <CalcLayout
        eyebrow="हिंदी"
        title="भारतीय रेल के मुफ़्त टूल"
        subtitle="बुकिंग कब खुलेगी, रद्द करने पर कितना वापस आएगा, वेटिंग कन्फर्म होगी या नहीं, और तत्काल में कितना ज़्यादा लगेगा — हर जवाब असली नियमों से निकाला हुआ, अंदाज़े से नहीं।"
      >
        <Breadcrumbs className="-mt-4 mb-6" items={[{ name: 'Home', href: '/' }, { name: 'हिंदी' }]} />

        <div className="grid gap-4 sm:grid-cols-2">
          {TRANSLATED_TOOLS.map((tool) => {
            const Icon = ICONS[tool.href] || CalendarClock;
            return (
              <Card key={tool.href} href={`/hi${tool.href}`} className="group p-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <h2 className="mt-3 font-display text-lg font-bold text-ink dark:text-white">
                  {localizedTitle(tool, 'hi')}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted dark:text-slate-400">
                  {localizedBlurb(tool, 'hi')}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-300">
                  टूल खोलिए
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">यह साइट क्या करती है</h2>
          <p className="mt-3">
            रेलवे के नियम मौजूद हैं, पर वे परिपत्रों और लंबे पन्नों में बिखरे रहते हैं। यहाँ वही नियम कैलकुलेटर में बदले गए
            हैं — आप अपनी तारीख, किराया या वेटिंग नंबर डालते हैं और सीधा जवाब मिलता है, साथ में यह भी कि वह जवाब किस नियम
            से निकला। हर पृष्ठ पर स्रोत और समीक्षा की तारीख दी रहती है, ताकि आप देख सकें कि जानकारी कितनी ताज़ा है।
          </p>
          <p className="mt-3">
            एक बात साफ़ कर दें: यहाँ लाइव जानकारी नहीं मिलेगी। PNR की मौजूदा स्थिति, ट्रेन कहाँ पहुँची है, या किस ट्रेन में
            कितनी सीटें ख़ाली हैं — इसके लिए{' '}
            <a href="https://www.irctc.co.in/" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">
              IRCTC की आधिकारिक वेबसाइट
            </a>{' '}
            ही देखिए। ये टूल उन सवालों के लिए हैं जो नियमों और तारीख़ों से तय होते हैं।
          </p>
        </div>

        <section className="mt-12" aria-labelledby="hi-english-tools">
          <h2 id="hi-english-tools" className="font-display text-xl font-bold text-ink dark:text-white">
            बाक़ी टूल — फ़िलहाल अंग्रेज़ी में
          </h2>
          <p className="mt-2 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
            इन पृष्ठों का हिंदी अनुवाद अभी बाक़ी है। गणना वही रहती है, बस भाषा अंग्रेज़ी है।
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ENGLISH_ONLY.map((tool) => (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  lang="en"
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-white px-3.5 py-3 text-sm text-ink-soft transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700/70 dark:bg-slate-800/70 dark:text-slate-300"
                >
                  {tool.title}
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </CalcLayout>
    </>
  );
}
