import { Mail, MessageSquare, ShieldAlert } from "lucide-react";
import { StaticPage, Section } from "@/components/StaticPage";

export const metadata = { title: "Contact Us – LocalSpot" };

export default function ContactPage() {
  return (
    <StaticPage title="Contact Us" subtitle="We usually respond within one business day">
      <Section heading="General support">
        <p className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-brand-600" />
          <a href="mailto:support@localspot.example" className="text-brand-600 hover:underline">support@localspot.example</a>
        </p>
        <p>Account issues, listing help, or anything else about using LocalSpot.</p>
      </Section>
      <Section heading="Contacting a business">
        <p className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-600" />
          Use the &quot;Send a Message&quot; form on the business&apos;s profile page.
        </p>
        <p>Messages go directly to the business owner — that&apos;s the fastest way to reach them.</p>
      </Section>
      <Section heading="Report a problem">
        <p className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-brand-600" />
          <a href="mailto:trust@localspot.example" className="text-brand-600 hover:underline">trust@localspot.example</a>
        </p>
        <p>For urgent trust &amp; safety issues. You can also report any review or listing using the report link on the page itself.</p>
      </Section>
    </StaticPage>
  );
}
