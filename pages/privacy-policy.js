import LegalPageLayout, { headingTwoStyle } from '../components/legal/LegalPageLayout';

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="Privacy policy for Railmonk calculators covering local data processing, cookie usage, and third-party service disclosures."
      canonicalPath="/privacy-policy"
    >
      <p>
        Railmonk is designed with privacy in mind. Most calculator computations are performed locally in your browser,
        and we do not ask for account sign-up to use standard tools.
      </p>

      <h2 style={headingTwoStyle}>Information We Collect</h2>
      <ul>
        <li>Calculator inputs are generally processed in-browser and are not stored as user profiles.</li>
        <li>We may collect anonymous usage signals to improve performance and content quality.</li>
        <li>We do not intentionally collect sensitive personal financial records for account-level tracking.</li>
      </ul>

      <h2 style={headingTwoStyle}>Cookies and Tracking</h2>
      <p>We use limited cookies/identifiers for:</p>
      <ul>
        <li>Theme or experience preferences.</li>
        <li>Basic analytics for aggregate traffic understanding.</li>
        <li>Ad delivery and measurement where ads are enabled.</li>
      </ul>

      <h2 style={headingTwoStyle}>Third-Party Services</h2>
      <p>We may use third-party services such as analytics and ad platforms that process data under their own policies.</p>

      <h2 style={headingTwoStyle}>Data Security</h2>
      <p>
        Since most calculations run locally, sensitive computation context usually remains on your device. You should
        still avoid entering private personal identifiers into any public website calculator.
      </p>

      <h2 style={headingTwoStyle}>Contact</h2>
      <p>
        For privacy-related questions, email{' '}
        <a href="mailto:upaman.org@gmail.com" style={{ color: '#c2410c', fontWeight: 700, textDecoration: 'none' }}>
          upaman.org@gmail.com
        </a>.
      </p>

      <p>
        <a href="/cookie-policy">Cookie Policy</a> {'\u2022'} <a href="/terms-of-service">Terms of Service</a>
      </p>
      <p style={{ marginBottom: 0 }}>
        <a href="/">← Back to Rail Tools</a>
      </p>
    </LegalPageLayout>
  );
}
