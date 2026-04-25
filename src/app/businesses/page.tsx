import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/utils";
import { BusinessCard } from "@/components/BusinessCard";
import { SearchBar } from "@/components/SearchBar";
import { SlidersHorizontal, Grid, List } from "lucide-react";
import Link from "next/link";
import type { BusinessWithStats } from "@/types";

interface SearchParams {
  q?: string;
  category?: string;
  city?: string;
  rating?: string;
  sort?: string;
  featured?: string;
  view?: string;
  page?: string;
}

async function getBusinesses(params: SearchParams): Promise<{ businesses: BusinessWithStats[]; total: number }> {
  const page = Math.max(1, parseInt(params.page || "1"));
  const perPage = 12;
  const skip = (page - 1) * perPage;

  const where: Record<string, unknown> = { active: true };

  if (params.q) {
    where.OR = [
      { name: { contains: params.q } },
      { description: { contains: params.q } },
      { tags: { contains: params.q } },
      { subcategory: { contains: params.q } },
    ];
  }
  if (params.category) where.category = params.category;
  if (params.city) where.city = { contains: params.city };
  if (params.rating) where.rating = { gte: parseFloat(params.rating) };
  if (params.featured === "true") where.featured = true;

  let orderBy: Record<string, string> = { featured: "desc" };
  if (params.sort === "rating") orderBy = { rating: "desc" };
  else if (params.sort === "reviews") orderBy = { reviewCount: "desc" };
  else if (params.sort === "newest") orderBy = { createdAt: "desc" };
  else if (params.sort === "name") orderBy = { name: "asc" };

  const [businesses, total] = await Promise.all([
    prisma.business.findMany({
      where,
      include: { owner: { select: { name: true, email: true } } },
      orderBy,
      skip,
      take: perPage,
    }),
    prisma.business.count({ where }),
  ]);

  return { businesses: businesses as unknown as BusinessWithStats[], total };
}

export default async function BusinessesPage({ searchParams }: { searchParams: SearchParams }) {
  const { businesses, total } = await getBusinesses(searchParams);
  const view = searchParams.view || "grid";
  const page = parseInt(searchParams.page || "1");
  const totalPages = Math.ceil(total / 12);

  const activeCategory = CATEGORIES.find((c) => c.id === searchParams.category);

  const buildUrl = (overrides: Partial<SearchParams>) => {
    const p = { ...searchParams, ...overrides };
    const qs = new URLSearchParams();
    Object.entries(p).forEach(([k, v]) => v && qs.set(k, String(v)));
    return `/businesses?${qs.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeCategory ? `${activeCategory.icon} ${activeCategory.label}` : searchParams.q ? `Results for "${searchParams.q}"` : "All Local Businesses"}
              </h1>
              <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} business{total !== 1 ? "es" : ""} found</p>
            </div>
            <Suspense>
              <SearchBar size="sm" defaultQuery={searchParams.q} defaultLocation={searchParams.city} />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-60 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                <h2 className="font-semibold text-gray-900 text-sm">Filters</h2>
              </div>

              {/* Category */}
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</h3>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href={buildUrl({ category: undefined, page: "1" })}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${!searchParams.category ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      All Categories
                    </Link>
                  </li>
                  {CATEGORIES.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={buildUrl({ category: cat.id, page: "1" })}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${searchParams.category === cat.id ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                      >
                        <span>{cat.icon}</span> {cat.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Minimum Rating */}
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Minimum Rating</h3>
                <ul className="space-y-1">
                  {[
                    { value: "", label: "Any Rating" },
                    { value: "4.5", label: "4.5+ ⭐⭐⭐⭐⭐" },
                    { value: "4", label: "4.0+ ⭐⭐⭐⭐" },
                    { value: "3", label: "3.0+ ⭐⭐⭐" },
                  ].map((opt) => (
                    <li key={opt.value}>
                      <Link
                        href={buildUrl({ rating: opt.value || undefined, page: "1" })}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${(searchParams.rating || "") === opt.value ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                      >
                        {opt.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Featured */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quality</h3>
                <Link
                  href={buildUrl({ featured: searchParams.featured === "true" ? undefined : "true", page: "1" })}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${searchParams.featured === "true" ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  ✨ Featured Only
                </Link>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Sort + View toggle */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                {[
                  { value: "", label: "Recommended" },
                  { value: "rating", label: "Top Rated" },
                  { value: "reviews", label: "Most Reviewed" },
                  { value: "newest", label: "Newest" },
                  { value: "name", label: "A–Z" },
                ].map((opt) => (
                  <Link
                    key={opt.value}
                    href={buildUrl({ sort: opt.value || undefined, page: "1" })}
                    className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${(searchParams.sort || "") === opt.value ? "bg-brand-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-brand-300"}`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                <Link href={buildUrl({ view: "grid" })} className={`p-1.5 rounded-md transition-colors ${view !== "list" ? "bg-brand-600 text-white" : "text-gray-400 hover:text-gray-700"}`}>
                  <Grid className="w-4 h-4" />
                </Link>
                <Link href={buildUrl({ view: "list" })} className={`p-1.5 rounded-md transition-colors ${view === "list" ? "bg-brand-600 text-white" : "text-gray-400 hover:text-gray-700"}`}>
                  <List className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {businesses.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-xl border border-gray-200">
                <p className="text-4xl mb-3">🔍</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No businesses found</h3>
                <p className="text-gray-500 text-sm mb-6">Try adjusting your filters or search terms</p>
                <Link href="/businesses" className="text-brand-600 font-medium text-sm hover:underline">Clear all filters</Link>
              </div>
            ) : view === "list" ? (
              <div className="space-y-3">
                {businesses.map((b) => <BusinessCard key={b.id} business={b} variant="list" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {businesses.map((b) => <BusinessCard key={b.id} business={b} variant="grid" />)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link href={buildUrl({ page: String(page - 1) })} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-brand-300 transition-colors">
                    ← Previous
                  </Link>
                )}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <Link key={p} href={buildUrl({ page: String(p) })} className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm transition-colors ${p === page ? "bg-brand-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:border-brand-300"}`}>
                      {p}
                    </Link>
                  );
                })}
                {page < totalPages && (
                  <Link href={buildUrl({ page: String(page + 1) })} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-brand-300 transition-colors">
                    Next →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
