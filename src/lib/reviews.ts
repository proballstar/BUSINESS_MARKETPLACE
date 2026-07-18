import { prisma } from "./prisma";

/** Recomputes and stores a business's average rating and review count. */
export async function recalcBusinessRating(businessId: string) {
  const { _avg, _count } = await prisma.review.aggregate({
    where: { businessId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.business.update({
    where: { id: businessId },
    data: { rating: _avg.rating || 0, reviewCount: _count.rating },
  });
}
