import LegalPageLayout, { headingTwoStyle } from '../components/legal/LegalPageLayout';

export default function ContactPage() {
  return (
    <LegalPageLayout
      title="Contact Railmonk"
      description="Contact Railmonk for corrections, calculator feedback, partnership requests, and product support."
      canonicalPath="/contact"
    >
        <p>
          For correction requests, methodology questions, or product feedback, please email:
        </p>
        <p style={{ marginTop: 0 }}>
          <a href="mailto:upaman.org@gmail.com" style={{ color: '#c2410c', fontWeight: 700, textDecoration: 'none' }}>
            upaman.org@gmail.com
          </a>
        </p>
        <h2 style={headingTwoStyle}>Please Include</h2>
        <ul>
          <li>Page URL and calculator/tool name.</li>
          <li>Issue summary or requested change.</li>
          <li>Input example and expected vs observed output (for calculation issues).</li>
        </ul>
        <p>
          We prioritize corrections for refund-rule and charge-table accuracy, since those affect real money decisions.
        </p>
        <p>
          <a href="/about">About Railmonk</a> {'\u2022'} <a href="/authors/railmonk-research-team">Railmonk Research Team</a>
        </p>
        <p style={{ marginBottom: 0 }}>
          <a href="/">← Back to Rail Tools</a>
        </p>
    </LegalPageLayout>
  );
}
