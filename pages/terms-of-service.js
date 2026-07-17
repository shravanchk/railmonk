import LegalPageLayout, { headingTwoStyle } from '../components/legal/LegalPageLayout';

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description="Terms of service for using Railmonk calculators, including limitations, liability, and user responsibilities."
      canonicalPath="/terms-of-service"
    >
      <p>
        By using Railmonk calculators and guides, you agree to these terms. If you do not agree, discontinue use of the
        website and tools.
      </p>

      <h2 style={headingTwoStyle}>Service Scope</h2>
      <p>
        Railmonk provides informational calculators and educational decision-support content. Outputs are estimates and
        are not legal, tax, investment, or accounting advice.
      </p>

      <h2 style={headingTwoStyle}>User Responsibilities</h2>
      <ul>
        <li>Use tools lawfully and responsibly.</li>
        <li>Verify important results independently before financial commitments.</li>
        <li>Consult qualified professionals for regulated or high-risk decisions.</li>
      </ul>

      <h2 style={headingTwoStyle}>Accuracy and Availability</h2>
      <p>
        We aim for accurate formulas and timely updates, but do not guarantee uninterrupted access or error-free
        results at all times.
      </p>

      <h2 style={headingTwoStyle}>Limitation of Liability</h2>
      <p>
        Railmonk is not liable for direct or indirect losses arising from reliance on calculator outputs or related
        content.
      </p>

      <h2 style={headingTwoStyle}>Changes to Terms</h2>
      <p>We may update these terms periodically. Continued use of the site implies acceptance of updated terms.</p>

      <h2 style={headingTwoStyle}>Contact</h2>
      <p>
        For terms-related questions, email{' '}
        <a href="mailto:upaman.org@gmail.com" style={{ color: '#c2410c', fontWeight: 700, textDecoration: 'none' }}>
          upaman.org@gmail.com
        </a>.
      </p>

      <p>
        <a href="/privacy-policy">Privacy Policy</a> {'\u2022'} <a href="/cookie-policy">Cookie Policy</a>
      </p>
      <p style={{ marginBottom: 0 }}>
        <a href="/">← Back to Rail Tools</a>
      </p>
    </LegalPageLayout>
  );
}
