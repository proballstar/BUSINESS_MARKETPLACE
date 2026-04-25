"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export function StarRating({
  rating,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const sizeMap = { sm: 14, md: 18, lg: 24 };
  const px = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.floor(rating);
        const partial = !filled && i < rating;
        return (
          <button
            key={i}
            type={interactive ? "button" : undefined}
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            className={cn("focus:outline-none", interactive && "cursor-pointer hover:scale-110 transition-transform")}
            aria-label={`${i + 1} star`}
          >
            <Star
              width={px}
              height={px}
              className={cn(
                filled ? "fill-accent-500 text-accent-500" : "text-gray-300",
                partial && "fill-accent-300 text-accent-400"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export function RatingSummary({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <StarRating rating={rating} size="sm" />
      <span className="font-semibold text-sm text-gray-900">{rating.toFixed(1)}</span>
      <span className="text-sm text-gray-500">({reviewCount.toLocaleString()} {reviewCount === 1 ? "review" : "reviews"})</span>
    </div>
  );
}
