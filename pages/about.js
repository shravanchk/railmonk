import LegalPageLayout, { headingTwoStyle } from '../components/legal/LegalPageLayout';

export default function AboutPage() {
  return (
    <LegalPageLayout
      title="About Railmonk"
      description="Learn what Railmonk builds, who it helps, and how its Indian Railways tools are structured for practical travel decisions."
      canonicalPath="/about"
    >
        <p>
          Railmonk is a focused set of free tools for Indian Railways passengers. Instead of digging through fare
          circulars and refund tables, you get direct answers to practical questions: what a cancellation will
          actually refund, what Tatkal really costs, whether a TDR claim is worth filing, and which berth a seat
          number maps to.
        </p>
        <h2 style={headingTwoStyle}>What We Optimize For</h2>
        <ul>
          <li>Clear inputs and transparent rule assumptions, cited to official IRCTC and Indian Railways sources.</li>
          <li>Fast calculation flows usable on desktop and mobile, including on slow connections.</li>
          <li>Practical guidance around common mistakes — missed refund windows, wrong ticket categories, quota confusion.</li>
          <li>Honest caveats about where the official portal must have the final word.</li>
        </ul>
        <h2 style={headingTwoStyle}>Product Scope</h2>
        <p>
          Railmonk covers ticket cancellation refunds, Tatkal charges, TDR refund eligibility, berth position
          lookup, and booking-strategy guidance for Indian Railways. Every tool states the rule set and effective
          dates it is built on, so results stay verifiable against official sources.
        </p>
        <h2 style={headingTwoStyle}>Who Runs Railmonk</h2>
        <p>
          Railmonk is built and maintained by{' '}
          <a href="https://www.linkedin.com/in/ch-shravan-kumar-b6a89974/" rel="me noopener" target="_blank">
            <strong>Shravan Cherukuri</strong>
          </a>, a software engineer, together with
          the <a href="/authors/railmonk-research-team">Railmonk Research Team</a>. Calculation engines are written
          against official sources (railway refund rules, published fare tables), and the worked examples across
          the site are generated from the same engines the calculators run — not typed in by hand — so the prose
          cannot drift from the results. Corrections and questions are welcome via the{' '}
          <a href="/contact">contact page</a>.
        </p>
        <h2 style={headingTwoStyle}>Important Note</h2>
        <p>
          Railmonk is an independent informational site and is not affiliated with IRCTC or Indian Railways.
          Results are educational planning estimates; always confirm bookings, refunds, and claims on the official
          IRCTC portal before acting.
        </p>
        <p style={{ marginBottom: 0 }}>
          <a href="/">← Back to Rail Tools</a>
        </p>
    </LegalPageLayout>
  );
}
