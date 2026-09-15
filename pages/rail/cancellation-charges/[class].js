import CancellationChargesPage from '../../../components/rail/CancellationChargesPage';
import { CLASS_PAGES } from '../../../utils/cancellationCharges';

// One statically exported page per charge class; the sitemap test expands
// this route from the same list.
export async function getStaticPaths() {
  return { paths: CLASS_PAGES.map((p) => ({ params: { class: p.slug } })), fallback: false };
}

export async function getStaticProps({ params }) {
  return { props: { slug: params.class } };
}

export default function RoutePage({ slug }) {
  return <CancellationChargesPage slug={slug} />;
}
