import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isAdmin } from "@/lib/api-auth";

// Admin: list reports (default OPEN)
export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  if (!isAdmin(auth.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "OPEN";

  const reports = await prisma.report.findMany({
    where: status === "ALL" ? {} : { status },
    include: { reporter: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Attach target snapshots for context
  const enriched = await Promise.all(
    reports.map(async (r) => {
      if (r.targetType === "REVIEW") {
        const review = await prisma.review.findUnique({
          where: { id: r.targetId },
          select: { comment: true, rating: true, business: { select: { name: true, slug: true } } },
        });
        return { ...r, target: review };
      }
      const business = await prisma.business.findUnique({
        where: { id: r.targetId },
        select: { name: true, slug: true, active: true },
      });
      return { ...r, target: business };
    })
  );

  return NextResponse.json(enriched);
}
