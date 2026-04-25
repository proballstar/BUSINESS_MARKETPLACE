import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Globe, BadgeCheck, Star, Sparkles, Clock } from "lucide-react";
import { cn, CATEGORIES, isBusinessOpen, formatPhone } from "@/lib/utils";
import { RatingSummary } from "./StarRating";
import type { BusinessWithStats } from "@/types";

interface BusinessCardProps {
  business: BusinessWithStats;
  variant?: "grid" | "list";
}

export function BusinessCard({ business, variant = "grid" }: BusinessCardProps) {
  const images: string[] = JSON.parse(business.images || "[]");
  const tags: string[] = JSON.parse(business.tags || "[]");
  const category = CATEGORIES.find((c) => c.id === business.category);
  const { open, label: hoursLabel } = isBusinessOpen(business.hoursJson);
  const coverImage = images[0] || `https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80`;

  if (variant === "list") {
    return (
      <Link href={`/businesses/${business.slug}`} className="block group">
        <div className="bg-white rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-md transition-all duration-200 flex gap-4 p-4">
          <div className="relative w-36 h-28 rounded-lg overflow-hidden flex-shrink-0">
            <Image src={coverImage} alt={business.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 text-lg truncate group-hover:text-brand-600 transition-colors">
                    {business.name}
                  </h3>
                  {business.verified && <BadgeCheck className="w-5 h-5 text-brand-500 flex-shrink-0" />}
                  {business.featured && (
                    <span className="flex items-center gap-1 text-xs font-medium bg-accent-100 text-accent-600 px-2 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3" /> Featured
                    </span>
                  )}
                </div>
                <RatingSummary rating={business.rating} reviewCount={business.reviewCount} />
              </div>
              {business.priceRange && (
                <span className="text-sm font-medium text-gray-500 flex-shrink-0">{business.priceRange}</span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{business.description}</p>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {category && (
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", category.color)}>
                  {category.icon} {category.label}
                </span>
              )}
              {hoursLabel && (
                <span className={cn("flex items-center gap-1 text-xs font-medium", open ? "text-green-600" : "text-gray-500")}>
                  <Clock className="w-3 h-3" /> {hoursLabel}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" /> {business.city}, {business.state}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/businesses/${business.slug}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-lg transition-all duration-200 overflow-hidden h-full flex flex-col">
        <div className="relative h-48 overflow-hidden">
          <Image src={coverImage} alt={business.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            {business.featured && (
              <span className="flex items-center gap-1 text-xs font-medium bg-accent-400 text-white px-2 py-0.5 rounded-full shadow">
                <Sparkles className="w-3 h-3" /> Featured
              </span>
            )}
            {business.premium && (
              <span className="text-xs font-bold bg-white text-brand-700 px-2 py-0.5 rounded-full shadow">
                Premium
              </span>
            )}
          </div>
          {business.priceRange && (
            <span className="absolute top-3 right-3 text-xs font-bold bg-white/90 text-gray-700 px-2 py-0.5 rounded-full shadow">
              {business.priceRange}
            </span>
          )}
          {category && (
            <span className={cn("absolute bottom-3 left-3 text-xs font-medium px-2 py-0.5 rounded-full", category.color)}>
              {category.icon} {category.label}
            </span>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-base leading-tight group-hover:text-brand-600 transition-colors">
              {business.name}
            </h3>
            {business.verified && (
              <BadgeCheck className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" aria-label="Verified Business" />
            )}
          </div>

          <RatingSummary rating={business.rating} reviewCount={business.reviewCount} />

          <p className="text-sm text-gray-600 mt-2 line-clamp-2 flex-1">{business.description}</p>

          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{business.address}, {business.city}, {business.state}</span>
            </div>
            {business.phone && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formatPhone(business.phone)}</span>
              </div>
            )}
            {hoursLabel && (
              <div className={cn("flex items-center gap-1.5 text-xs font-medium", open ? "text-green-600" : "text-gray-500")}>
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{hoursLabel}</span>
              </div>
            )}
          </div>

          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
