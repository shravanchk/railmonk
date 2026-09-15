import GlossaryTermPage from '../../../components/rail/GlossaryTermPage';
import { TERMS } from '../../../utils/glossary';

// One statically exported page per glossary term; the sitemap test expands
// this route from the same list.
export async function getStaticPaths() {
  return { paths: TERMS.map((t) => ({ params: { term: t.slug } })), fallback: false };
}

export async function getStaticProps({ params }) {
  return { props: { slug: params.term } };
}

export default function RoutePage({ slug }) {
  return <GlossaryTermPage slug={slug} />;
}
