import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Tag, Clock, BadgeCheck, ArrowRight, Zap } from "lucide-react";
import { CATEGORIES } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PostWithBusiness {
  id: string;
  type: string;
  title: string;
  content: string;
  imageUrl: string | null;
  discountText: string | null;
  discountCode: string | null;
  originalPrice: string | null;
  salePrice: string | null;
  expiresAt: Date | null;
  pinned: boolean;
  createdAt: Date;
  business: {
    name: string;
    slug: string;
    city: string;
    state: string;
    category: string;
    images: string;
    verified: boolean;
  };
}

async function getActiveDeals(): Promise<PostWithBusiness[]> {
  const posts = await prisma.businessPost.findMany({
    where: {
      type: "DEAL",
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: {
      business: { select: { name: true, slug: true, city: true, state: true, category: true, images: true, verified: true } },
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 40,
  });
  return posts as unknown as PostWithBusiness[];
}

function timeRemaining(expiresAt: Date | null): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 1) return `${days} days left`;
  if (hours > 0) return `${hours}h left`;
  return "Ending soon!";
}

export default async function DealsPage() {
  const deals = await getActiveDeals();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-rose-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-extrabold">Local Deals & Offers</h1>
          </div>
          <p className="text-orange-100 text-lg max-w-xl">
            Flash deals, limited-time offers, and exclusive discounts — straight from local business owners. No corporate coupons, just real savings from real people.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            {deals.length} active deals right now
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {deals.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <p className="text-4xl mb-3">🏷️</p>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No active deals right now</h3>
            <p className="text-gray-500 text-sm mb-4">Check back soon — local businesses post deals all the time.</p>
            <Link href="/auth/signup?role=business" className="text-brand-600 font-medium text-sm hover:underline">
              Own a business? Post a deal →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {deals.map((deal) => {
              const images: string[] = JSON.parse(deal.business.images || "[]");
              const coverImg = deal.imageUrl || images[0] || null;
              const category = CATEGORIES.find((c) => c.id === deal.business.category);
              const timeLeft = timeRemaining(deal.expiresAt);
              const isExpiringSoon = deal.expiresAt &&
                new Date(deal.expiresAt).getTime() - Date.now() < 86400000;

              return (
                <div key={deal.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all group">
                  {/* Cover */}
                  <div className="relative h-40 bg-gradient-to-br from-orange-100 to-rose-100 overflow-hidden">
                    {coverImg ? (
                      <Image src={coverImg} alt={deal.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">🏷️</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                    {/* Discount badge */}
                    {deal.discountText && (
                      <div className="absolute top-3 left-3 bg-rose-500 text-white font-bold text-sm px-3 py-1 rounded-full shadow-lg">
                        {deal.discountText}
                      </div>
                    )}

                    {/* Expiry countdown */}
                    {timeLeft && (
                      <div className={`absolute top-3 right-3 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${isExpiringSoon ? "bg-red-500 text-white animate-pulse" : "bg-black/60 text-white"}`}>
                        <Clock className="w-3 h-3" /> {timeLeft}
                      </div>
                    )}

                    {deal.pinned && (
                      <div className="absolute bottom-3 left-3 bg-amber-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
                        ⭐ Staff Pick
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-base leading-snug mb-1">{deal.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{deal.content}</p>

                    {/* Pricing */}
                    {(deal.originalPrice || deal.salePrice) && (
                      <div className="flex items-center gap-2 mb-3">
                        {deal.salePrice && <span className="text-lg font-bold text-rose-600">{deal.salePrice}</span>}
                        {deal.originalPrice && <span className="text-sm text-gray-400 line-through">{deal.originalPrice}</span>}
                      </div>
                    )}

                    {/* Coupon code */}
                    {deal.discountCode && (
                      <div className="flex items-center gap-2 mb-3 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                        <Tag className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600">Use code:</span>
                        <code className="text-sm font-bold text-orange-700 tracking-wider">{deal.discountCode}</code>
                      </div>
                    )}

                    {/* Business info */}
                    <Link href={`/businesses/${deal.business.slug}`} className="flex items-center gap-2 pt-3 border-t border-gray-100 hover:text-brand-600 transition-colors group/biz">
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {images[0] ? (
                          <Image src={images[0]} alt={deal.business.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm">🏪</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-gray-800 truncate group-hover/biz:text-brand-600">{deal.business.name}</span>
                          {deal.business.verified && <BadgeCheck className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />}
                        </div>
                        <div className="text-xs text-gray-400">{deal.business.city}, {deal.business.state} {category ? `· ${category.icon} ${category.label}` : ""}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover/biz:text-brand-500 flex-shrink-0" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA for business owners */}
        <div className="mt-12 bg-gradient-to-r from-orange-500 to-rose-500 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Got a deal to share?</h3>
          <p className="text-orange-100 mb-6 max-w-lg mx-auto">
            Post flash deals in seconds — no marketing team, no corporate sign-off. Just you and your customers.
          </p>
          <Link href="/auth/signup?role=business" className="inline-flex items-center gap-2 bg-white text-rose-600 font-bold px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors">
            <Zap className="w-5 h-5" /> Post a Deal Free
          </Link>
        </div>
      </div>
    </div>
  );
}
