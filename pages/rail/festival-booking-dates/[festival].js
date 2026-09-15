import FestivalBookingPage from '../../../components/rail/FestivalBookingPage';
import { FESTIVALS } from '../../../utils/festivals';

// One statically exported page per festival. Adding an entry to
// utils/festivals.js is enough to publish a new one — the sitemap test expands
// this route from the same list, so it cannot ship unlisted.
export async function getStaticPaths() {
  return {
    paths: FESTIVALS.map((f) => ({ params: { festival: f.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  return { props: { slug: params.festival } };
}

export default function RoutePage({ slug }) {
  return <FestivalBookingPage slug={slug} />;
}
