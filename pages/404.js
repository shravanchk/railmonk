import Head from 'next/head';
import NotFoundPage from '../components/NotFoundPage';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found | Railmonk</title>
        <meta name="description" content="The page you requested could not be found." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <NotFoundPage />
    </>
  );
}
