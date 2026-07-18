import { StaticPage, Section } from "@/components/StaticPage";

export const metadata = { title: "Terms of Service – LocalSpot" };

export default function TermsPage() {
  return (
    <StaticPage title="Terms of Service" subtitle="Last updated: July 2026">
      <Section heading="Using LocalSpot">
        <p>LocalSpot connects customers with local businesses. By creating an account you agree to provide accurate information and to use the platform respectfully and lawfully.</p>
      </Section>
      <Section heading="Reviews and content">
        <p>Reviews must reflect genuine personal experience. You may not review your own business, post spam, harassment, or knowingly false content. We may remove content that violates these rules and suspend repeat offenders.</p>
        <p>You retain ownership of the content you post and grant LocalSpot a license to display it on the platform.</p>
      </Section>
      <Section heading="Business listings">
        <p>Business owners are responsible for the accuracy of their listings, including hours, pricing, deals, and contact information. Listings that impersonate other businesses or promote illegal goods or services will be removed.</p>
      </Section>
      <Section heading="Inquiries">
        <p>Customer inquiries are delivered privately to the business. Businesses agree to use customer contact details only to respond to the inquiry, not for unrelated marketing.</p>
      </Section>
      <Section heading="Liability">
        <p>LocalSpot is a directory and communication platform. We do not guarantee the quality of any business&apos;s goods or services, and transactions happen directly between you and the business.</p>
      </Section>
      <Section heading="Changes">
        <p>We may update these terms; continued use after changes constitutes acceptance. Material changes will be announced on the site.</p>
      </Section>
    </StaticPage>
  );
}
