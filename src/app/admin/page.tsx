import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShieldAlert, Users, Store, Star } from "lucide-react";
import { AdminReportList, type AdminReport } from "@/components/AdminReportList";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id) redirect("/auth/signin?callbackUrl=/admin");
  if (user.role !== "ADMIN") redirect("/");

  const [reports, userCount, businessCount, reviewCount] = await Promise.all([
    prisma.report.findMany({
      where: { status: "OPEN" },
      include: { reporter: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.user.count(),
    prisma.business.count(),
    prisma.review.count(),
  ]);

  const enriched: AdminReport[] = await Promise.all(
    reports.map(async (r) => {
      let target: AdminReport["target"] = null;
      if (r.targetType === "REVIEW") {
        const review = await prisma.review.findUnique({
          where: { id: r.targetId },
          select: { comment: true, rating: true, business: { select: { name: true, slug: true } } },
        });
        target = review;
      } else {
        const biz = await prisma.business.findUnique({
          where: { id: r.targetId },
          select: { name: true, slug: true, active: true },
        });
        target = biz;
      }
      return {
        id: r.id,
        targetType: r.targetType,
        targetId: r.targetId,
        reason: r.reason,
        details: r.details,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        reporter: r.reporter,
        target,
      };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" /> Admin — Trust &amp; Safety
          </h1>
          <p className="text-gray-500 text-sm mt-1">Review reports, remove abusive content, manage accounts</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Users", value: userCount, icon: Users },
            { label: "Businesses", value: businessCount, icon: Store },
            { label: "Reviews", value: reviewCount, icon: Star },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <Icon className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        <h2 className="font-semibold text-gray-900 mb-4">
          Open Reports {enriched.length > 0 && <span className="text-sm font-normal text-red-600">({enriched.length})</span>}
        </h2>
        <AdminReportList initialReports={enriched} />
      </div>
    </div>
  );
}
