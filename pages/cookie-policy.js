import LegalPageLayout, { headingTwoStyle } from '../components/legal/LegalPageLayout';

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      description="Cookie policy for Railmonk explaining essential cookies, analytics cookies, advertising cookies, and browser control options."
      canonicalPath="/cookie-policy"
    >
      <p>
        This Cookie Policy explains how Railmonk uses cookies and similar technologies to operate calculators, improve
        performance, and support measurement and advertising features.
      </p>

      <h2 style={headingTwoStyle}>Types of Cookies We Use</h2>
      <ul>
        <li>
          <strong>Essential cookies:</strong> Needed for core site behavior and reliable page delivery.
        </li>
        <li>
          <strong>Preference cookies:</strong> Remember settings such as display preferences where available.
        </li>
        <li>
          <strong>Analytics cookies:</strong> Help us understand aggregate usage and improve UX.
        </li>
        <li>
          <strong>Advertising cookies:</strong> Used by ad partners for ad delivery, frequency control, and
          measurement where ads are enabled.
        </li>
      </ul>

      <h2 style={headingTwoStyle}>Third-Party Technologies</h2>
      <p>
        Some cookies and identifiers may be set by third-party providers (for example, analytics or advertising
        services) under their own privacy policies.
      </p>

      <h2 style={headingTwoStyle}>Your Controls</h2>
      <ul>
        <li>You can block or delete cookies in browser settings.</li>
        <li>Blocking some categories can affect certain site features.</li>
        <li>You can review third-party controls for ad personalization where available.</li>
      </ul>

      <h2 style={headingTwoStyle}>Related Policies</h2>
      <p>
        Cookie usage is part of our broader privacy and ad-compliance framework.
      </p>
      <p>
        <a href="/privacy-policy">Privacy Policy</a> {'\u2022'} <a href="/terms-of-service">Terms of Service</a>
      </p>
      <p style={{ marginBottom: 0 }}>
        <a href="/">← Back to Rail Tools</a>
      </p>
    </LegalPageLayout>
  );
}
