import Link from "next/link";
import { StaticPage, Section } from "@/components/StaticPage";

export const metadata = { title: "About Us – LocalSpot" };

export default function AboutPage() {
  return (
    <StaticPage title="About LocalSpot" subtitle="Helping neighborhoods and small businesses thrive together">
      <Section heading="Our mission">
        <p>Small businesses are the heart of every community — but getting discovered is harder than ever. LocalSpot levels the playing field by giving every local shop, restaurant, and service the kind of online presence that used to require a marketing team.</p>
      </Section>
      <Section heading="What makes us different">
        <p>We focus on the things small businesses do better than chains: real people, honest answers, spontaneous deals, and community events. Owners answer your questions directly, respond to reviews personally, and post offers without corporate approval chains.</p>
      </Section>
      <Section heading="For customers">
        <p>Discover verified local businesses, read genuine reviews from neighbors, message owners directly, and support the places that make your neighborhood unique. It&apos;s free, always.</p>
      </Section>
      <Section heading="For business owners">
        <p>List your business in minutes, manage customer inquiries in one dashboard, respond to reviews, and reach thousands of nearby customers — no subscription required.</p>
        <p>
          <Link href="/auth/signup?role=business" className="text-brand-600 font-medium hover:underline">List your business →</Link>
        </p>
      </Section>
    </StaticPage>
  );
}
