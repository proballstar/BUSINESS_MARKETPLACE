"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, CheckCircle, XCircle, Trash2, EyeOff } from "lucide-react";

export interface AdminReport {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: { name: string | null; email: string };
  target:
    | { comment: string; rating: number; business: { name: string; slug: string } } // review
    | { name: string; slug: string; active: boolean } // business
    | null;
}

function ReportRow({ report, onChange }: { report: AdminReport; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [gone, setGone] = useState(false);

  const call = async (fn: () => Promise<Response>) => {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (res.ok) {
      setGone(true);
      onChange();
    }
  };

  const resolve = (status: "RESOLVED" | "DISMISSED") =>
    call(() => fetch(`/api/admin/reports/${report.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }));

  const removeContent = async () => {
    if (!confirm(report.targetType === "REVIEW" ? "Delete this review?" : "Unpublish this listing?")) return;
    setBusy(true);
    if (report.targetType === "REVIEW") {
      await fetch(`/api/admin/reviews/${report.targetId}`, { method: "DELETE" });
    } else {
      await fetch(`/api/admin/businesses/${report.targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });
    }
    await fetch(`/api/admin/reports/${report.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED" }),
    });
    setBusy(false);
    setGone(true);
    onChange();
  };

  if (gone) return null;

  const isReview = report.targetType === "REVIEW";
  const reviewTarget = isReview ? (report.target as { comment: string; rating: number; business: { name: string; slug: string } } | null) : null;
  const bizTarget = !isReview ? (report.target as { name: string; slug: string; active: boolean } | null) : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{report.reason}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{report.targetType}</span>
        <span className="text-xs text-gray-400">
          reported by {report.reporter.name || report.reporter.email} · {new Date(report.createdAt).toLocaleDateString()}
        </span>
      </div>

      {report.details && <p className="text-sm text-gray-600 mb-2 italic">&quot;{report.details}&quot;</p>}

      {reviewTarget ? (
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 mb-3">
          <span className="text-xs text-gray-400">Review ({reviewTarget.rating}★) on{" "}
            <Link href={`/businesses/${reviewTarget.business.slug}`} className="text-brand-600 hover:underline">{reviewTarget.business.name}</Link>:
          </span>
          <p className="mt-1">{reviewTarget.comment}</p>
        </div>
      ) : bizTarget ? (
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 mb-3">
          <span className="text-xs text-gray-400">Listing:</span>{" "}
          <Link href={`/businesses/${bizTarget.slug}`} className="text-brand-600 hover:underline">{bizTarget.name}</Link>
          {!bizTarget.active && <span className="ml-2 text-xs text-red-500">(already unpublished)</span>}
        </div>
      ) : (
        <p className="text-xs text-gray-400 mb-3">Target content no longer exists.</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {report.target && (
          <button onClick={removeContent} disabled={busy} className="flex items-center gap-1 text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
            {isReview ? <><Trash2 className="w-3.5 h-3.5" /> Delete Review</> : <><EyeOff className="w-3.5 h-3.5" /> Unpublish Listing</>}
          </button>
        )}
        <button onClick={() => resolve("RESOLVED")} disabled={busy} className="flex items-center gap-1 text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:border-green-300 hover:text-green-700 disabled:opacity-50 transition-colors">
          <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
        </button>
        <button onClick={() => resolve("DISMISSED")} disabled={busy} className="flex items-center gap-1 text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:border-gray-400 disabled:opacity-50 transition-colors">
          <XCircle className="w-3.5 h-3.5" /> Dismiss
        </button>
      </div>
    </div>
  );
}

export function AdminReportList({ initialReports }: { initialReports: AdminReport[] }) {
  const [remaining, setRemaining] = useState(initialReports.length);

  if (initialReports.length === 0 || remaining === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
        <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No open reports — all clear</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {initialReports.map((r) => (
        <ReportRow key={r.id} report={r} onChange={() => setRemaining((n) => n - 1)} />
      ))}
    </div>
  );
}
