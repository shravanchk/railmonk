import React from 'react';
import Head from 'next/head';
import { alternatesFor } from '../../utils/i18n';

/**
 * hreflang alternates for a page that exists in both languages.
 *
 * Emitted on both sides of a pair, which is what the spec requires — an
 * alternate that is not reciprocated is ignored. `path` is always the English
 * route, so a page passes its own identity regardless of which language it is.
 *
 * Renders nothing for untranslated pages, deliberately: annotating a page with
 * an alternate that does not exist is a worse signal than no annotation.
 */
export default function LocaleHead({ path }) {
  const alternates = alternatesFor(path);
  if (!alternates.length) return null;

  return (
    <Head>
      {alternates.map((alt) => (
        <link key={`alt-${alt.hreflang}`} rel="alternate" hrefLang={alt.hreflang} href={alt.href} />
      ))}
    </Head>
  );
}
