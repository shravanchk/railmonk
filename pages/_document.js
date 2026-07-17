import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Google Analytics: create a GA4 property for railmonk.com and add its
            G-XXXX tag here. (Upaman's tag was intentionally removed so railmonk
            traffic doesn't pollute that property.) */}
        <meta charSet="utf-8" />
        <meta name="google-adsense-account" content="ca-pub-3543327769912677" />
        <meta name="theme-color" content="#1a2332" />
        <link rel="icon" type="image/svg+xml" href="/railmonk-logo.svg?v=1" />
        <link rel="shortcut icon" type="image/svg+xml" href="/railmonk-logo.svg?v=1" />
        <link rel="apple-touch-icon" href="/railmonk-logo.svg?v=1" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
