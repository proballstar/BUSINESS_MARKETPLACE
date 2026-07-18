import Link from "next/link";
import { StaticPage, Section } from "@/components/StaticPage";

export const metadata = { title: "How It Works – LocalSpot" };

export default function HowItWorksPage() {
  return (
    <StaticPage title="How LocalSpot Works" subtitle="Three steps for customers, three steps for owners">
      <Section heading="For customers">
        <p><strong>1. Search & discover.</strong> Browse by category, city, or keyword. Filter by rating and price to find exactly what you need.</p>
        <p><strong>2. Evaluate.</strong> Check photos, opening hours, reviews from neighbors, and the owner&apos;s answers to community questions.</p>
        <p><strong>3. Get in touch.</strong> Send an inquiry straight from the profile — the owner receives it in their dashboard and replies to your email.</p>
      </Section>
      <Section heading="For business owners">
        <p><strong>1. Create your listing.</strong> Sign up free, add your details, photos, hours, and services. Publish when ready — unpublish anytime.</p>
        <p><strong>2. Build trust.</strong> Collect reviews, reply publicly, and answer customer questions to showcase your expertise.</p>
        <p><strong>3. Manage leads.</strong> Every inquiry lands in your dashboard where you can track it from new to replied to closed.</p>
      </Section>
      <Section heading="Ready to start?">
        <p>
          <Link href="/businesses" className="text-brand-600 font-medium hover:underline">Browse businesses →</Link>
          {"  ·  "}
          <Link href="/auth/signup?role=business" className="text-brand-600 font-medium hover:underline">List your business →</Link>
        </p>
      </Section>
    </StaticPage>
  );
}
