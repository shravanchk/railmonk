import LegalPageLayout, { headingTwoStyle } from '../../components/legal/LegalPageLayout';

export default function TravelUtilityReviewDeskPage() {
  return (
    <LegalPageLayout
      title="Travel Utility Review Desk"
      description="Review profile for Railmonk travel and public-utility planning pages such as booking window and schedule-related tools."
      canonicalPath="/authors/travel-utility-review-desk"
      reviewedOn="March 14, 2026"
    >
      <p>
        The Travel Utility Review Desk reviews planning tools that depend on public booking rules, schedule windows, or
        other operational assumptions. The focus is clarity and practical usability for time-sensitive tasks.
      </p>
      <h2 style={headingTwoStyle}>Primary Review Areas</h2>
      <ul>
        <li>Consistency between displayed timing logic and the cited source assumptions.</li>
        <li>User-facing explanations for caveats, quota rules, and operational variability.</li>
        <li>Clear guidance on when official portals should take precedence over the tool output.</li>
      </ul>
      <p>
        Related pages: <a href="/about">About Railmonk</a> {'\u2022'}{' '}
        <a href="/authors/railmonk-research-team">Railmonk Research Team</a>
      </p>
    </LegalPageLayout>
  );
}
