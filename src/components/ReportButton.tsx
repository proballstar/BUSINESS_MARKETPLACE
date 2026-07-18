"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Flag } from "lucide-react";

const REASONS = [
  { value: "SPAM", label: "Spam or advertising" },
  { value: "INAPPROPRIATE", label: "Inappropriate content" },
  { value: "FAKE", label: "Fake or misleading" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "OTHER", label: "Other" },
];

export function ReportButton({
  targetType,
  targetId,
  label = "Report",
}: {
  targetType: "REVIEW" | "BUSINESS";
  targetId: string;
  label?: string;
}) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("SPAM");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  if (!session) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, reason, details: details || undefined }),
    });
    if (res.ok) {
      setState("done");
    } else {
      const data = await res.json();
      setErrMsg(data.error || "Failed to submit report");
      setState("error");
    }
  };

  if (state === "done") {
    return <span className="text-xs text-green-600">✓ Reported — our team will review it</span>;
  }

  return open ? (
    <form onSubmit={submit} className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2 w-full">
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
      >
        {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        rows={2}
        placeholder="Optional details..."
        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none bg-white"
      />
      {state === "error" && <p className="text-xs text-red-600">{errMsg}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={state === "sending"} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
          {state === "sending" ? "Submitting..." : "Submit Report"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
      </div>
    </form>
  ) : (
    <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
      <Flag className="w-3 h-3" /> {label}
    </button>
  );
}
