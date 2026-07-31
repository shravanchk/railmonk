import NextDocument, { Html, Head, Main, NextScript } from 'next/document';
import { localeFromPath, getLocale } from '../utils/i18n';

export default function Document({ locale = 'en' }) {
  const isHindi = locale === 'hi';
  return (
    <Html lang={getLocale(locale).htmlLang}>
      <Head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-7XZQLXDYQ1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-7XZQLXDYQ1');
            `
          }}
        />
        <meta charSet="utf-8" />
        <meta name="google-adsense-account" content="ca-pub-3543327769912677" />
        <meta name="theme-color" content="#1a2332" />
        <link rel="icon" type="image/svg+xml" href="/railmonk-logo.svg?v=1" />
        <link rel="shortcut icon" type="image/svg+xml" href="/railmonk-logo.svg?v=1" />
        <link rel="apple-touch-icon" href="/railmonk-logo.svg?v=1" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Both families in one request: Source Sans 3 for body, Manrope for
            display headings. Previously Manrope was pulled in by an @import in
            globals.css, which the browser could not discover until the CSS had
            already been fetched. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Devanagari only where it is read. Neither Source Sans 3 nor Manrope
            covers the script, so Hindi pages would otherwise fall back to
            whatever the device happens to have. English pages do not pay for
            a font they will never render a glyph from. */}
        {isHindi ? (
          <link
            href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        ) : null}
      </Head>
      <body className={isHindi ? 'lang-hi' : undefined}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

// Static export renders _document once per route, so the path is known at build
// time — which is what lets a /hi page ship with lang="hi" in the HTML itself
// rather than having it patched on by script after hydration.
Document.getInitialProps = async (ctx) => {
  const initialProps = await NextDocument.getInitialProps(ctx);
  return { ...initialProps, locale: localeFromPath(ctx.pathname) };
};
