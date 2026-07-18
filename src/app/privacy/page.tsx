import { StaticPage, Section } from "@/components/StaticPage";

export const metadata = { title: "Privacy Policy – LocalSpot" };

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy" subtitle="Last updated: July 2026">
      <Section heading="What we collect">
        <p>We collect the information you give us directly: your name and email when you create an account, business details when you create a listing, and the content of reviews, questions, and inquiries you submit.</p>
        <p>We also collect basic usage data such as page views on business profiles, which we aggregate and show to business owners as anonymous counts.</p>
      </Section>
      <Section heading="How we use it">
        <p>Your information is used to operate the marketplace: showing your reviews with your first name, delivering your inquiries to the business you contacted, and letting business owners respond to you.</p>
        <p>We do not sell your personal information to third parties.</p>
      </Section>
      <Section heading="Who can see your data">
        <p>Reviews and public questions are visible to everyone alongside your display name. Inquiries are private — only the business you contacted (and platform administrators) can read them.</p>
      </Section>
      <Section heading="Your choices">
        <p>You can edit or delete your reviews at any time. To delete your account and associated data, contact us at privacy@localspot.example.</p>
      </Section>
      <Section heading="Security">
        <p>Passwords are stored using industry-standard hashing (bcrypt). Access to inquiry data is restricted to the owning business and administrators.</p>
      </Section>
      <Section heading="Contact">
        <p>Questions about this policy? Email privacy@localspot.example.</p>
      </Section>
    </StaticPage>
  );
}
