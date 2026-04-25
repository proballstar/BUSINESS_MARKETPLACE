import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, TrendingUp, Star, Users, Store, Zap, Search, Heart, Gift, MessageSquare, ArrowRight, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/utils";
import { SearchBar } from "@/components/SearchBar";
import { BusinessCard } from "@/components/BusinessCard";
import type { BusinessWithStats } from "@/types";

async function getFeaturedBusinesses(): Promise<BusinessWithStats[]> {
  const businesses = await prisma.business.findMany({
    where: { active: true, featured: true },
    include: { owner: { select: { name: true, email: true } } },
    orderBy: [{ premium: "desc" }, { rating: "desc" }],
    take: 6,
  });
  return businesses as unknown as BusinessWithStats[];
}

async function getTopRated(): Promise<BusinessWithStats[]> {
  const businesses = await prisma.business.findMany({
    where: { active: true, reviewCount: { gte: 3 } },
    include: { owner: { select: { name: true, email: true } } },
    orderBy: { rating: "desc" },
    take: 3,
  });
  return businesses as unknown as BusinessWithStats[];
}

async function getStats() {
  const [businessCount, reviewCount, userCount] = await Promise.all([
    prisma.business.count({ where: { active: true } }),
    prisma.review.count(),
    prisma.user.count(),
  ]);
  return { businessCount, reviewCount, userCount };
}

export default async function HomePage() {
  const [featured, topRated, stats] = await Promise.all([
    getFeaturedBusinesses(),
    getTopRated(),
    getStats(),
  ]);

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-900/80" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 text-accent-400" />
              Your local community marketplace
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Discover the Hidden Gems{" "}
              <span className="text-accent-400">in Your City</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Find amazing local restaurants, boutiques, salons, and services. Support your community, enjoy exclusive deals, and help great businesses thrive.
            </p>

            <div className="flex justify-center mb-8">
              <SearchBar size="lg" />
            </div>

            <div className="flex flex-wrap justify-center gap-3 text-sm">
              {["🍕 Restaurants", "💆 Spas", "🛍️ Boutiques", "🔧 Repair", "📚 Tutoring", "🐾 Pet Care"].map((tag) => (
                <Link
                  key={tag}
                  href={`/businesses?q=${encodeURIComponent(tag.split(" ")[1])}`}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-full transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 0C1440 0 1080 60 720 60C360 60 0 0 0 0L0 60Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-gray-50 pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto text-center">
            <div>
              <div className="text-3xl font-extrabold text-brand-600">{stats.businessCount.toLocaleString()}+</div>
              <div className="text-sm text-gray-500 mt-1">Local Businesses</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-brand-600">{stats.reviewCount.toLocaleString()}+</div>
              <div className="text-sm text-gray-500 mt-1">Customer Reviews</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-brand-600">{stats.userCount.toLocaleString()}+</div>
              <div className="text-sm text-gray-500 mt-1">Community Members</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Browse by Category ── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Browse by Category</h2>
              <p className="text-gray-500 mt-1">Find exactly what you&apos;re looking for</p>
            </div>
            <Link href="/businesses" className="hidden sm:flex items-center gap-1 text-brand-600 font-medium hover:text-brand-700 text-sm">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/businesses?category=${cat.id}`}
                className="group flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-md transition-all text-center"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-xs font-medium text-gray-700 leading-tight">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Join ── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Why Join LocalSpot?</h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto">Whether you&apos;re a local explorer or a business owner, LocalSpot has something for you.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* For Customers */}
            <div className="bg-gradient-to-br from-brand-50 to-brand-100 rounded-2xl p-8">
              <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">For Customers</h3>
              <p className="text-gray-600 mb-6">Discover your city&apos;s best-kept secrets and enjoy perks just for being part of the community.</p>
              <ul className="space-y-3">
                {[
                  { icon: Gift, text: "Exclusive deals & offers from local businesses" },
                  { icon: Star, text: "Real reviews from real community members" },
                  { icon: Heart, text: "Save favorites and build your local list" },
                  { icon: MessageSquare, text: "Connect directly with business owners" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm text-gray-700">{text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="mt-6 inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors">
                Join Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* For Businesses */}
            <div className="bg-gradient-to-br from-accent-50 to-yellow-100 rounded-2xl p-8">
              <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center mb-4">
                <Store className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">For Business Owners</h3>
              <p className="text-gray-600 mb-6">Grow your reach and attract loyal customers without a massive marketing budget.</p>
              <ul className="space-y-3">
                {[
                  { icon: TrendingUp, text: "Get found by thousands of local customers" },
                  { icon: BadgeCheck, text: "Verified badge builds trust and credibility" },
                  { icon: Zap, text: "Post deals and events to drive foot traffic" },
                  { icon: Users, text: "Analytics to understand your audience" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm text-gray-700">{text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup?role=business" className="mt-6 inline-flex items-center gap-2 bg-accent-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-600 transition-colors">
                List Your Business <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Businesses ── */}
      {featured.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Featured Businesses</h2>
                <p className="text-gray-500 mt-1">Handpicked local favorites worth visiting</p>
              </div>
              <Link href="/businesses?featured=true" className="hidden sm:flex items-center gap-1 text-brand-600 font-medium hover:text-brand-700 text-sm">
                See all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((business) => (
                <BusinessCard key={business.id} business={business} variant="grid" />
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/businesses" className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:border-brand-300 hover:text-brand-600 transition-all">
                Explore All Businesses <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Top Rated ── */}
      {topRated.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">⭐ Top Rated</h2>
                <p className="text-gray-500 mt-1">Businesses your neighbors love most</p>
              </div>
              <Link href="/businesses?sort=rating" className="hidden sm:flex items-center gap-1 text-brand-600 font-medium hover:text-brand-700 text-sm">
                See all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {topRated.map((business, i) => (
                <div key={business.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <BusinessCard business={business} variant="list" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── How It Works ── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How LocalSpot Works</h2>
            <p className="text-gray-500 mt-2">Simple, free, and built for your community</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                icon: Search,
                title: "Search & Discover",
                desc: "Browse by category, location, or keyword. Filter by rating, price, and more to find exactly what you need.",
              },
              {
                step: "2",
                icon: Star,
                title: "Read Real Reviews",
                desc: "See honest reviews from your neighbors. Check photos, hours, and contact info — all in one place.",
              },
              {
                step: "3",
                icon: Heart,
                title: "Support Local",
                desc: "Visit, review, and share. Help great businesses grow and keep your community thriving.",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-200">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-1">Step {step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community CTA ── */}
      <section className="bg-gradient-to-r from-brand-600 to-brand-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to Explore Your Community?
          </h2>
          <p className="text-brand-100 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of locals discovering amazing businesses every day. It&apos;s free to sign up and always will be.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/businesses" className="bg-white text-brand-700 font-semibold px-8 py-3 rounded-xl hover:bg-brand-50 transition-colors">
              Browse Businesses
            </Link>
            <Link href="/auth/signup" className="bg-accent-400 text-gray-900 font-semibold px-8 py-3 rounded-xl hover:bg-accent-500 transition-colors">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="bg-white py-12">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Get Local Deals in Your Inbox</h3>
          <p className="text-gray-500 text-sm mb-6">Weekly roundup of deals, new openings, and community highlights — free.</p>
          <form className="flex gap-3">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button type="submit" className="bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
