import LegalPageLayout, { headingTwoStyle } from '../../components/legal/LegalPageLayout';

export default function RailmonkResearchTeamPage() {
  return (
    <LegalPageLayout
      title="Railmonk Research Team"
      description="Editorial profile for the Railmonk Research Team covering rail tool assumptions, refund-rule research, and source synthesis."
      canonicalPath="/authors/railmonk-research-team"
      reviewedOn="March 14, 2026"
    >
      <p>
        The Railmonk Research Team prepares planning content, calculation assumptions, and supporting guides for the
        site&apos;s Indian Railways tools. The team focuses on turning dense official rule tables into practical,
        transparent models. It is led by{' '}
        <a href="https://www.linkedin.com/in/ch-shravan-kumar-b6a89974/" rel="me noopener" target="_blank">
          <strong>Shravan Cherukuri</strong>
        </a>, the software engineer who builds and maintains Railmonk (see <a href="/about">About Railmonk</a>).
      </p>
      <h2 style={headingTwoStyle}>Scope of Work</h2>
      <ul>
        <li>Translate official refund rules, fare circulars, and coach layouts into usable calculator assumptions.</li>
        <li>Draft supporting guides that explain the decisions behind cancellation, Tatkal, TDR, and berth tools.</li>
        <li>Flag known limitations so users understand where official confirmation is still required.</li>
      </ul>
      <h2 style={headingTwoStyle}>Editorial Standards</h2>
      <p>
        Research content is written for educational planning use. It is reviewed before publication and updated when
        refund rules, charge tables, or coach configurations materially change.
      </p>
      <p>
        Related pages: <a href="/about">About Railmonk</a> {'•'}{' '}
        <a href="/authors/travel-utility-review-desk">Travel Utility Review Desk</a>
      </p>
    </LegalPageLayout>
  );
}
