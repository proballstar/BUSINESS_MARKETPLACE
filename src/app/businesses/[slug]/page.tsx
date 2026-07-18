import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, formatPhone, isBusinessOpen } from "@/lib/utils";
import { StarRating, RatingSummary } from "@/components/StarRating";
import { ReviewSection } from "@/components/ReviewSection";
import { ContactForm } from "@/components/ContactForm";
import { BusinessFeed } from "@/components/BusinessFeed";
import { LoyaltyWidget } from "@/components/LoyaltyCard";
import { QandASection } from "@/components/QandA";
import { ReportButton } from "@/components/ReportButton";
import {
  MapPin, Phone, Globe, Mail, Clock, BadgeCheck, Sparkles,
  Facebook, Instagram, Twitter, Linkedin, ExternalLink,
  Users, Eye, Calendar, ChevronRight, Tag, Star, Gift, HelpCircle, Megaphone,
} from "lucide-react";
import type { BusinessWithStats } from "@/types";

async function getBusiness(slug: string) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  const business = await prisma.business.findUnique({
    where: { slug, active: true },
    include: {
      owner: { select: { name: true, email: true } },
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      posts: {
        where: { active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        take: 20,
      },
      questions: {
        include: { user: { select: { name: true } } },
        orderBy: [{ answeredAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      },
      loyaltyConfig: true,
    },
  });

  if (business) {
    await prisma.business.update({ where: { id: business.id }, data: { viewCount: { increment: 1 } } });
  }

  let loyaltyCard = null;
  if (userId && business?.loyaltyConfig) {
    loyaltyCard = await prisma.loyaltyCard.findUnique({
      where: { businessId_userId: { businessId: business.id, userId } },
    });
  }

  const isOwner = userId === business?.ownerId;
  return { business, loyaltyCard, isOwner, userId };
}

async function getRelated(businessId: string, category: string): Promise<BusinessWithStats[]> {
  const businesses = await prisma.business.findMany({
    where: { category, active: true, id: { not: businessId } },
    include: { owner: { select: { name: true, email: true } } },
    orderBy: { rating: "desc" },
    take: 3,
  });
  return businesses as unknown as BusinessWithStats[];
}

function HoursTable({ hoursJson }: { hoursJson: string }) {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const labels: Record<string, string> = { monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday" };
  const today = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()];
  let hours: Record<string, { open: string; close: string; closed?: boolean }> = {};
  try { hours = JSON.parse(hoursJson); } catch {}
  if (!Object.keys(hours).length) return null;
  const fmt = (t: string) => { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };
  return (
    <table className="w-full text-sm">
      <tbody>{days.map((d) => {
        const h = hours[d];
        const isToday = d === today;
        return (
          <tr key={d} className={isToday ? "font-semibold text-gray-900" : "text-gray-600"}>
            <td className="py-1.5 pr-4 w-28">{labels[d]}{isToday && <span className="ml-1 text-xs font-normal text-brand-600">(today)</span>}</td>
            <td className="py-1.5">{(!h || h.closed) ? <span className="text-red-500">Closed</span> : <span className="text-green-700">{fmt(h.open)} – {fmt(h.close)}</span>}</td>
          </tr>
        );
      })}</tbody>
    </table>
  );
}

function RatingBreakdown({ reviews }: { reviews: { rating: number }[] }) {
  if (!reviews.length) return null;
  const counts = [5, 4, 3, 2, 1].map((r) => ({ rating: r, count: reviews.filter((rv) => rv.rating === r).length }));
  const max = Math.max(...counts.map((c) => c.count), 1);
  return (
    <div className="space-y-1.5">
      {counts.map(({ rating, count }) => (
        <div key={rating} className="flex items-center gap-2 text-sm">
          <span className="w-3 text-right text-gray-500">{rating}</span>
          <StarRating rating={1} max={1} size="sm" />
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="bg-accent-400 h-2 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
          </div>
          <span className="w-4 text-gray-500 text-xs">{count}</span>
        </div>
      ))}
    </div>
  );
}

function TeamSection({ teamJson }: { teamJson: string }) {
  let team: { name: string; role: string; bio?: string; imageUrl?: string }[] = [];
  try { team = JSON.parse(teamJson); } catch {}
  if (!team.length) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-900 text-lg mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-brand-600" /> Meet the Team
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {team.map((member, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
              {member.imageUrl ? (
                <Image src={member.imageUrl} alt={member.name} width={48} height={48} className="object-cover w-full h-full" />
              ) : (
                member.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">{member.name}</div>
              <div className="text-xs text-brand-600 font-medium">{member.role}</div>
              {member.bio && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{member.bio}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function BusinessProfilePage({ params }: { params: { slug: string } }) {
  const { business, loyaltyCard, isOwner } = await getBusiness(params.slug);
  if (!business) notFound();

  const related = await getRelated(business.id, business.category);

  const images: string[] = JSON.parse(business.images || "[]");
  const tags: string[] = JSON.parse(business.tags || "[]");
  const socialLinks: Record<string, string> = JSON.parse(business.socialLinks || "{}");
  const category = CATEGORIES.find((c) => c.id === business.category);
  const { open, label: hoursLabel } = isBusinessOpen(business.hoursJson);
  const b = business as unknown as {
    reviews: Parameters<typeof ReviewSection>[0]["initialReviews"];
    posts: Parameters<typeof BusinessFeed>[0]["posts"];
    questions: Parameters<typeof QandASection>[0]["initialQuestions"];
    loyaltyConfig: Parameters<typeof LoyaltyWidget>[0]["initialConfig"] | null;
  };
  const reviews = b.reviews || [];
  const posts = b.posts || [];
  const questions = b.questions || [];
  const loyaltyConfig = b.loyaltyConfig;

  const socialIcons: Record<string, React.ReactNode> = {
    facebook: <Facebook className="w-4 h-4" />,
    instagram: <Instagram className="w-4 h-4" />,
    twitter: <Twitter className="w-4 h-4" />,
    linkedin: <Linkedin className="w-4 h-4" />,
  };

  const hasDeals = posts.some((p: unknown) => (p as {type:string}).type === "DEAL");
  const hasEvents = posts.some((p: unknown) => (p as {type:string}).type === "EVENT");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-brand-600">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/businesses" className="hover:text-brand-600">Businesses</Link>
            {category && <><ChevronRight className="w-3.5 h-3.5" /><Link href={`/businesses?category=${category.id}`} className="hover:text-brand-600">{category.label}</Link></>}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium truncate">{business.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Photo Gallery */}
            {images.length > 0 ? (
              <div className={`grid gap-2 rounded-2xl overflow-hidden ${images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {images.slice(0, 3).map((img, i) => (
                  <div key={i} className={`relative ${i === 0 && images.length >= 3 ? "row-span-2 col-span-2 h-72" : "h-36"}`}>
                    <Image src={img} alt={`${business.name} photo ${i + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative h-64 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-6xl opacity-30">🏢</div>
            )}

            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{business.name}</h1>
                    {business.verified && <div className="flex items-center gap-1 bg-brand-50 text-brand-700 px-2 py-1 rounded-full"><BadgeCheck className="w-4 h-4" /><span className="text-xs font-semibold">Verified</span></div>}
                    {business.featured && <div className="flex items-center gap-1 bg-accent-100 text-accent-700 px-2 py-1 rounded-full"><Sparkles className="w-4 h-4" /><span className="text-xs font-semibold">Featured</span></div>}
                  </div>
                  {business.tagline && <p className="text-gray-600 mt-1 text-lg">{business.tagline}</p>}
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <RatingSummary rating={business.rating} reviewCount={business.reviewCount} />
                    {category && <Link href={`/businesses?category=${category.id}`} className={`text-sm font-medium px-2 py-0.5 rounded-full ${category.color}`}>{category.icon} {category.label}</Link>}
                    {business.priceRange && <span className="text-sm text-gray-500 font-medium">{business.priceRange}</span>}
                    {hasDeals && <Link href="#updates" className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full"><Tag className="w-3 h-3" /> Active Deal</Link>}
                    {hasEvents && <Link href="#updates" className="flex items-center gap-1 text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full"><Calendar className="w-3 h-3" /> Event Coming Up</Link>}
                  </div>
                  {hoursLabel && (
                    <div className={`flex items-center gap-1.5 mt-2 text-sm font-medium ${open ? "text-green-600" : "text-red-500"}`}>
                      <Clock className="w-4 h-4" /> {hoursLabel}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {isOwner && <Link href={`/dashboard/edit?id=${business.id}`} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">Edit Listing</Link>}
                  {!isOwner && <ReportButton targetType="BUSINESS" targetId={business.id} label="Report listing" />}
                </div>
              </div>

              {/* Quick stats */}
              <div className="mt-5 grid grid-cols-3 gap-4 pt-5 border-t border-gray-100">
                <div className="text-center"><div className="text-xl font-bold text-gray-900">{business.viewCount.toLocaleString()}</div><div className="text-xs text-gray-500 flex items-center justify-center gap-1"><Eye className="w-3 h-3" /> Views</div></div>
                <div className="text-center"><div className="text-xl font-bold text-gray-900">{business.reviewCount}</div><div className="text-xs text-gray-500 flex items-center justify-center gap-1"><Star className="w-3 h-3" /> Reviews</div></div>
                {business.yearFounded && <div className="text-center"><div className="text-xl font-bold text-gray-900">{new Date().getFullYear() - business.yearFounded}</div><div className="text-xs text-gray-500 flex items-center justify-center gap-1"><Calendar className="w-3 h-3" /> Yrs in Business</div></div>}
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 text-lg mb-3">About {business.name}</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{business.description}</p>
              {tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Tag className="w-4 h-4 text-gray-400 mt-0.5" />
                  {tags.map((tag) => (
                    <Link key={tag} href={`/businesses?q=${encodeURIComponent(tag)}`} className="text-sm bg-gray-100 hover:bg-brand-50 hover:text-brand-700 text-gray-600 px-3 py-1 rounded-full transition-colors">{tag}</Link>
                  ))}
                </div>
              )}
              {(business.employeeCount || business.yearFounded) && (
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                  {business.yearFounded && <div><div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Founded</div><div className="text-sm font-medium text-gray-900">{business.yearFounded}</div></div>}
                  {business.employeeCount && <div><div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Team Size</div><div className="flex items-center gap-1 text-sm font-medium text-gray-900"><Users className="w-4 h-4 text-gray-400" /> {business.employeeCount}</div></div>}
                </div>
              )}
            </div>

            {/* Meet the Team */}
            <TeamSection teamJson={business.teamJson || "[]"} />

            {/* Deals, Events & Updates */}
            <div className="bg-white rounded-xl border border-gray-200 p-6" id="updates">
              <h2 className="font-semibold text-gray-900 text-lg mb-4 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-brand-600" /> Updates, Deals & Events
              </h2>
              <BusinessFeed posts={posts} isOwner={isOwner} />
            </div>

            {/* Q&A */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 text-lg mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-brand-600" /> Questions & Answers
                <span className="text-sm font-normal text-gray-400 ml-auto">{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
              </h2>
              <QandASection
                businessId={business.id}
                isOwner={isOwner}
                initialQuestions={questions}
              />
            </div>

            {/* Business Hours */}
            {business.hoursJson && business.hoursJson !== "{}" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 text-lg mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-600" /> Business Hours
                </h2>
                <HoursTable hoursJson={business.hoursJson} />
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg">Customer Reviews</h2>
                  <RatingSummary rating={business.rating} reviewCount={business.reviewCount} />
                </div>
                {reviews.length > 0 && <RatingBreakdown reviews={reviews as { rating: number }[]} />}
              </div>
              <ReviewSection business={business as unknown as BusinessWithStats} initialReviews={reviews} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 flex-shrink-0 space-y-5">
            {/* Loyalty Card */}
            {loyaltyConfig && (
              <LoyaltyWidget
                businessId={business.id}
                businessName={business.name}
                initialConfig={loyaltyConfig}
                initialCard={loyaltyCard as Parameters<typeof LoyaltyWidget>[0]["initialCard"]}
              />
            )}

            {/* Contact */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <div>{business.address}</div>
                    <div>{business.city}, {business.state} {business.zip}</div>
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(`${business.address}, ${business.city}, ${business.state}`)}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline text-xs mt-1 flex items-center gap-1">
                      Get Directions <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                {business.phone && <a href={`tel:${business.phone}`} className="flex items-center gap-3 text-sm text-gray-700 hover:text-brand-600 transition-colors"><Phone className="w-4 h-4 text-brand-600 flex-shrink-0" />{formatPhone(business.phone)}</a>}
                {business.email && <a href={`mailto:${business.email}`} className="flex items-center gap-3 text-sm text-gray-700 hover:text-brand-600 transition-colors"><Mail className="w-4 h-4 text-brand-600 flex-shrink-0" /><span className="truncate">{business.email}</span></a>}
                {business.website && <a href={business.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-brand-600 hover:underline"><Globe className="w-4 h-4 flex-shrink-0" /><span className="truncate">{new URL(business.website).hostname}</span><ExternalLink className="w-3 h-3 ml-auto flex-shrink-0" /></a>}
              </div>
              {Object.keys(socialLinks).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Follow Us</div>
                  <div className="flex gap-2">
                    {Object.entries(socialLinks).map(([platform, url]) => url ? (
                      <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-100 hover:bg-brand-100 hover:text-brand-600 rounded-lg flex items-center justify-center text-gray-500 transition-colors" aria-label={platform}>
                        {socialIcons[platform] || <ExternalLink className="w-4 h-4" />}
                      </a>
                    ) : null)}
                  </div>
                </div>
              )}
              {business.phone && <a href={`tel:${business.phone}`} className="mt-4 flex items-center justify-center gap-2 w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors"><Phone className="w-4 h-4" /> Call Now</a>}
            </div>

            {/* Message form */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Mail className="w-5 h-5 text-brand-600" /> Send a Message</h3>
              <ContactForm businessId={business.id} businessName={business.name} />
            </div>

            {/* Active deals in sidebar */}
            {hasDeals && (
              <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-rose-500" /> Active Deals
                </h3>
                {(posts as {type:string;title:string;discountText:string|null;expiresAt:Date|null}[]).filter((p) => p.type === "DEAL").slice(0, 2).map((deal, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
                    <div className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0 mt-1.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{deal.title}</p>
                      {deal.discountText && <p className="text-xs text-rose-600 font-bold">{deal.discountText}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upcoming events in sidebar */}
            {hasEvents && (
              <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-violet-600" /> Upcoming Events
                </h3>
                {(posts as {type:string;title:string;eventDate:Date|null}[]).filter((p) => p.type === "EVENT").slice(0, 2).map((event, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
                    <div className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0 mt-1.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      {event.eventDate && <p className="text-xs text-violet-600">{new Date(event.eventDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Related */}
            {related.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Similar Businesses</h3>
                <div className="space-y-3">
                  {related.map((b) => (
                    <Link key={b.id} href={`/businesses/${b.slug}`} className="flex items-center gap-3 group">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        {JSON.parse(b.images || "[]")[0] ? <Image src={JSON.parse(b.images)[0]} alt={b.name} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">🏢</div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 group-hover:text-brand-600 truncate">{b.name}</div>
                        <RatingSummary rating={b.rating} reviewCount={b.reviewCount} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
