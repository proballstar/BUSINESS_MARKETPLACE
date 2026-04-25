import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BadgeCheck, Eye, Star, MessageSquare, TrendingUp, Plus, Edit, ExternalLink, Sparkles, Tag, Calendar, Megaphone, Gift, HelpCircle } from "lucide-react";
import { PostManager } from "@/components/PostManager";
import { LoyaltyManager } from "@/components/LoyaltyManager";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin?callbackUrl=/dashboard");
  const userId = (session.user as { id?: string }).id!;

  const businesses = await prisma.business.findMany({
    where: { ownerId: userId },
    include: {
      _count: { select: { reviews: true, inquiries: true, posts: true, questions: { where: { answer: null } } } },
      posts: {
        where: { active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        take: 20,
        include: { _count: { select: { rsvps: true } } },
      },
      loyaltyConfig: true,
      loyaltyCards: { select: { id: true } },
      questions: { where: { answer: null }, select: { id: true, question: true, createdAt: true, user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 5 },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalViews = businesses.reduce((s, b) => s + b.viewCount, 0);
  const totalReviews = businesses.reduce((s, b) => s + b.reviewCount, 0);
  const totalInquiries = businesses.reduce((s, b) => s + b.inquiryCount, 0);
  const avgRating = businesses.length ? businesses.reduce((s, b) => s + b.rating, 0) / businesses.length : 0;
  const pendingQs = businesses.reduce((s, b) => s + b._count.questions, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Manage listings, posts, loyalty programs, and inquiries</p>
          </div>
          <Link href="/dashboard/edit" className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Business
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {businesses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <div className="text-5xl mb-4">🏪</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No listings yet</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">List your business and start reaching thousands of local customers — free.</p>
            <Link href="/dashboard/edit" className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors"><Plus className="w-5 h-5" /> List Your Business</Link>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
              {[
                { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye, color: "text-blue-600 bg-blue-50" },
                { label: "Reviews", value: totalReviews.toLocaleString(), icon: Star, color: "text-yellow-600 bg-yellow-50" },
                { label: "Avg. Rating", value: avgRating.toFixed(1), icon: TrendingUp, color: "text-green-600 bg-green-50" },
                { label: "Inquiries", value: totalInquiries.toLocaleString(), icon: MessageSquare, color: "text-purple-600 bg-purple-50" },
                { label: "Pending Q&A", value: pendingQs.toString(), icon: HelpCircle, color: pendingQs > 0 ? "text-rose-600 bg-rose-50" : "text-gray-400 bg-gray-50" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${color}`}><Icon className="w-5 h-5" /></div>
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Each business */}
            {businesses.map((business) => {
              const images: string[] = JSON.parse(business.images || "[]");
              const pendingQuestions = business.questions;
              const loyaltySignups = business.loyaltyCards.length;

              return (
                <div key={business.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
                  {/* Business header */}
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative w-full sm:w-44 h-36 flex-shrink-0 bg-gray-100">
                      {images[0] ? <Image src={images[0]} alt={business.name} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">🏢</div>}
                    </div>
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-lg">{business.name}</h3>
                            {business.verified && <BadgeCheck className="w-5 h-5 text-brand-500" aria-label="Verified" />}
                            {business.featured && <span className="flex items-center gap-1 text-xs font-medium bg-accent-100 text-accent-700 px-2 py-0.5 rounded-full"><Sparkles className="w-3 h-3" /> Featured</span>}
                            {!business.active && <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Inactive</span>}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">{business.city}, {business.state} · {business.category}</p>
                          <div className="flex items-center gap-1 mt-1 text-sm">
                            <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
                            <span className="font-medium">{business.rating.toFixed(1)}</span>
                            <span className="text-gray-500">({business.reviewCount} reviews)</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/businesses/${business.slug}`} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:border-brand-300 text-gray-600 transition-colors"><ExternalLink className="w-3.5 h-3.5" /> View</Link>
                          <Link href={`/dashboard/edit?id=${business.id}`} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"><Edit className="w-3.5 h-3.5" /> Edit</Link>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
                        <div className="text-center"><div className="font-bold text-gray-900">{business.viewCount.toLocaleString()}</div><div className="text-xs text-gray-500">Views</div></div>
                        <div className="text-center"><div className="font-bold text-gray-900">{business._count.posts}</div><div className="text-xs text-gray-500">Posts</div></div>
                        <div className="text-center"><div className="font-bold text-gray-900">{loyaltySignups}</div><div className="text-xs text-gray-500">Loyalty Members</div></div>
                        <div className="text-center"><div className={`font-bold ${pendingQuestions.length > 0 ? "text-rose-600" : "text-gray-900"}`}>{pendingQuestions.length}</div><div className="text-xs text-gray-500">Pending Q&As</div></div>
                      </div>
                    </div>
                  </div>

                  {/* Pending Q&A answers */}
                  {pendingQuestions.length > 0 && (
                    <div className="border-t border-gray-100 p-5 bg-amber-50">
                      <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2 mb-3">
                        <HelpCircle className="w-4 h-4" /> {pendingQuestions.length} Question{pendingQuestions.length > 1 ? "s" : ""} Awaiting Your Answer
                      </h4>
                      <div className="space-y-2">
                        {pendingQuestions.map((q) => (
                          <div key={q.id} className="bg-white rounded-lg border border-amber-200 p-3 text-sm">
                            <span className="text-gray-500 text-xs">{q.user.name || "Customer"} asked: </span>
                            <span className="font-medium text-gray-900">{q.question}</span>
                          </div>
                        ))}
                      </div>
                      <Link href={`/businesses/${business.slug}#updates`} className="mt-3 inline-flex items-center gap-1 text-sm text-amber-700 font-medium hover:underline">
                        Answer on your profile page →
                      </Link>
                    </div>
                  )}

                  {/* Posts manager */}
                  <div className="border-t border-gray-100">
                    <div className="p-5">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-brand-600" /> Posts — Updates, Deals & Events
                        <span className="text-xs font-normal text-gray-400 ml-1">Customers see these on your profile and on the Deals/Events pages</span>
                      </h4>
                      <PostManager
                        businessId={business.id}
                        initialPosts={business.posts as unknown as Parameters<typeof PostManager>[0]["initialPosts"]}
                      />
                    </div>
                  </div>

                  {/* Loyalty Program manager */}
                  <div className="border-t border-gray-100 p-5">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Gift className="w-4 h-4 text-brand-600" /> Loyalty Rewards Program
                      {loyaltySignups > 0 && <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">{loyaltySignups} members enrolled</span>}
                    </h4>
                    <LoyaltyManager
                      businessId={business.id}
                      initialConfig={business.loyaltyConfig as Parameters<typeof LoyaltyManager>[0]["initialConfig"]}
                    />
                  </div>
                </div>
              );
            })}

            {/* Upgrade CTA */}
            <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-2xl p-6 text-white">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-accent-400" /> Upgrade to Featured</h3>
                  <p className="text-brand-100 text-sm mt-1">Appear at the top of search results, on the homepage, and get a featured badge. 5× more visibility.</p>
                </div>
                <Link href="/premium" className="flex-shrink-0 bg-accent-400 text-gray-900 font-bold px-6 py-2.5 rounded-xl hover:bg-accent-500 transition-colors text-sm">Learn More</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
