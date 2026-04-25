import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, formatPhone, isBusinessOpen } from "@/lib/utils";
import { StarRating, RatingSummary } from "@/components/StarRating";
import { ReviewSection } from "@/components/ReviewSection";
import { ContactForm } from "@/components/ContactForm";
import {
  MapPin, Phone, Globe, Mail, Clock, BadgeCheck, Sparkles,
  Facebook, Instagram, Twitter, Linkedin, ExternalLink, Share2,
  Users, Eye, Calendar, ChevronRight, Tag,
} from "lucide-react";
import type { BusinessWithStats } from "@/types";

async function getBusiness(slug: string): Promise<BusinessWithStats | null> {
  const business = await prisma.business.findUnique({
    where: { slug, active: true },
    include: {
      owner: { select: { name: true, email: true } },
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (business) {
    await prisma.business.update({
      where: { id: business.id },
      data: { viewCount: { increment: 1 } },
    });
  }

  return business as unknown as BusinessWithStats | null;
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
  const dayLabels: Record<string, string> = {
    monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
    thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
  };
  const today = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()];

  let hours: Record<string, { open: string; close: string; closed?: boolean }> = {};
  try { hours = JSON.parse(hoursJson); } catch {}

  if (Object.keys(hours).length === 0) return null;

  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  return (
    <table className="w-full text-sm">
      <tbody>
        {days.map((day) => {
          const h = hours[day];
          const isToday = day === today;
          return (
            <tr key={day} className={isToday ? "font-semibold text-gray-900" : "text-gray-600"}>
              <td className="py-1.5 pr-4 w-28">
                {dayLabels[day]}
                {isToday && <span className="ml-2 text-xs font-normal text-brand-600">(today)</span>}
              </td>
              <td className="py-1.5">
                {!h || h.closed ? (
                  <span className="text-red-500">Closed</span>
                ) : (
                  <span className="text-green-700">{fmt(h.open)} – {fmt(h.close)}</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function RatingBreakdown({ reviews }: { reviews: { rating: number }[] }) {
  if (reviews.length === 0) return null;
  const counts = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: reviews.filter((rev) => rev.rating === r).length,
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);
  return (
    <div className="space-y-1.5">
      {counts.map(({ rating, count }) => (
        <div key={rating} className="flex items-center gap-2 text-sm">
          <span className="w-3 text-right text-gray-500">{rating}</span>
          <StarRating rating={1} max={1} size="sm" />
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-accent-400 h-2 rounded-full transition-all"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="w-4 text-gray-500 text-xs">{count}</span>
        </div>
      ))}
    </div>
  );
}

export default async function BusinessProfilePage({ params }: { params: { slug: string } }) {
  const business = await getBusiness(params.slug);
  if (!business) notFound();

  const [related] = await Promise.all([getRelated(business.id, business.category)]);

  const images: string[] = JSON.parse(business.images || "[]");
  const tags: string[] = JSON.parse(business.tags || "[]");
  const socialLinks: Record<string, string> = JSON.parse(business.socialLinks || "{}");
  const category = CATEGORIES.find((c) => c.id === business.category);
  const { open, label: hoursLabel } = isBusinessOpen(business.hoursJson);
  const reviews = business.reviews || [];

  const socialIcons: Record<string, React.ReactNode> = {
    facebook: <Facebook className="w-4 h-4" />,
    instagram: <Instagram className="w-4 h-4" />,
    twitter: <Twitter className="w-4 h-4" />,
    linkedin: <Linkedin className="w-4 h-4" />,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-brand-600">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/businesses" className="hover:text-brand-600">Businesses</Link>
            {category && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href={`/businesses?category=${category.id}`} className="hover:text-brand-600">{category.label}</Link>
              </>
            )}
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
              <div className="relative h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-400 to-brand-700">
                <div className="absolute inset-0 flex items-center justify-center text-white text-6xl opacity-30">🏢</div>
              </div>
            )}

            {/* Business Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{business.name}</h1>
                    {business.verified && (
                      <div className="flex items-center gap-1 bg-brand-50 text-brand-700 px-2 py-1 rounded-full">
                        <BadgeCheck className="w-4 h-4" />
                        <span className="text-xs font-semibold">Verified</span>
                      </div>
                    )}
                    {business.featured && (
                      <div className="flex items-center gap-1 bg-accent-100 text-accent-700 px-2 py-1 rounded-full">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-semibold">Featured</span>
                      </div>
                    )}
                  </div>
                  {business.tagline && <p className="text-gray-600 mt-1 text-lg">{business.tagline}</p>}
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <RatingSummary rating={business.rating} reviewCount={business.reviewCount} />
                    {category && (
                      <Link href={`/businesses?category=${category.id}`} className={`text-sm font-medium px-2 py-0.5 rounded-full ${category.color}`}>
                        {category.icon} {category.label}
                      </Link>
                    )}
                    {business.priceRange && <span className="text-sm text-gray-500 font-medium">{business.priceRange}</span>}
                  </div>
                  {hoursLabel && (
                    <div className={`flex items-center gap-1.5 mt-2 text-sm font-medium ${open ? "text-green-600" : "text-red-500"}`}>
                      <Clock className="w-4 h-4" />
                      {hoursLabel}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:border-brand-300 transition-colors">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
              </div>

              {/* Quick stats */}
              <div className="mt-5 grid grid-cols-3 gap-4 pt-5 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{business.viewCount.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 flex items-center justify-center gap-1"><Eye className="w-3 h-3" /> Total Views</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{business.reviewCount}</div>
                  <div className="text-xs text-gray-500 flex items-center justify-center gap-1"><StarRating rating={1} max={1} size="sm" /> Reviews</div>
                </div>
                {business.yearFounded && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{new Date().getFullYear() - business.yearFounded}</div>
                    <div className="text-xs text-gray-500 flex items-center justify-center gap-1"><Calendar className="w-3 h-3" /> Years in Business</div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 text-lg mb-3">About {business.name}</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{business.description}</p>

              {tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Tag className="w-4 h-4 text-gray-400 mt-0.5" />
                  {tags.map((tag) => (
                    <Link key={tag} href={`/businesses?q=${encodeURIComponent(tag)}`} className="text-sm bg-gray-100 hover:bg-brand-50 hover:text-brand-700 text-gray-600 px-3 py-1 rounded-full transition-colors">
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              {(business.employeeCount || business.yearFounded) && (
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                  {business.yearFounded && (
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Founded</div>
                      <div className="text-sm font-medium text-gray-900">{business.yearFounded}</div>
                    </div>
                  )}
                  {business.employeeCount && (
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Team Size</div>
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                        <Users className="w-4 h-4 text-gray-400" /> {business.employeeCount}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Hours */}
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
                {reviews.length > 0 && <RatingBreakdown reviews={reviews} />}
              </div>
              <ReviewSection business={business} initialReviews={reviews} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 flex-shrink-0 space-y-5">
            {/* Contact Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <div>{business.address}</div>
                    <div>{business.city}, {business.state} {business.zip}</div>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(`${business.address}, ${business.city}, ${business.state}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:underline text-xs mt-1 flex items-center gap-1"
                    >
                      Get Directions <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                {business.phone && (
                  <a href={`tel:${business.phone}`} className="flex items-center gap-3 text-sm text-gray-700 hover:text-brand-600 transition-colors">
                    <Phone className="w-4 h-4 text-brand-600 flex-shrink-0" />
                    {formatPhone(business.phone)}
                  </a>
                )}
                {business.email && (
                  <a href={`mailto:${business.email}`} className="flex items-center gap-3 text-sm text-gray-700 hover:text-brand-600 transition-colors">
                    <Mail className="w-4 h-4 text-brand-600 flex-shrink-0" />
                    <span className="truncate">{business.email}</span>
                  </a>
                )}
                {business.website && (
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-brand-600 hover:underline">
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{new URL(business.website).hostname}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0 ml-auto" />
                  </a>
                )}
              </div>

              {/* Social Links */}
              {Object.keys(socialLinks).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Follow Us</div>
                  <div className="flex gap-2">
                    {Object.entries(socialLinks).map(([platform, url]) => url && (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 bg-gray-100 hover:bg-brand-100 hover:text-brand-600 rounded-lg flex items-center justify-center text-gray-500 transition-colors"
                        aria-label={platform}
                      >
                        {socialIcons[platform] || <ExternalLink className="w-4 h-4" />}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {business.phone && (
                <a href={`tel:${business.phone}`} className="mt-4 flex items-center justify-center gap-2 w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors">
                  <Phone className="w-4 h-4" /> Call Now
                </a>
              )}
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand-600" /> Send a Message
              </h3>
              <ContactForm businessId={business.id} businessName={business.name} />
            </div>

            {/* Related Businesses */}
            {related.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Similar Businesses</h3>
                <div className="space-y-3">
                  {related.map((b) => (
                    <Link key={b.id} href={`/businesses/${b.slug}`} className="flex items-center gap-3 group">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        {JSON.parse(b.images || "[]")[0] ? (
                          <Image src={JSON.parse(b.images)[0]} alt={b.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">🏢</div>
                        )}
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
