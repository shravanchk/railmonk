import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
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
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
