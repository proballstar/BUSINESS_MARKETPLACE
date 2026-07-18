"use client";

import { useState } from "react";
import { Mail, Phone, Archive, CheckCircle, Inbox, Reply, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InquiryItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  createdAt: string;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  NEW:      { label: "New",      color: "bg-blue-100 text-blue-700" },
  READ:     { label: "Read",     color: "bg-gray-100 text-gray-600" },
  REPLIED:  { label: "Replied",  color: "bg-green-100 text-green-700" },
  ARCHIVED: { label: "Archived", color: "bg-amber-100 text-amber-700" },
  CLOSED:   { label: "Closed",   color: "bg-gray-200 text-gray-500" },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function InquiryCard({ inquiry, businessName }: { inquiry: InquiryItem; businessName: string }) {
  const [status, setStatus] = useState(inquiry.status);
  const [expanded, setExpanded] = useState(inquiry.status === "NEW");
  const [saving, setSaving] = useState(false);
  const meta = STATUS_META[status] || STATUS_META.NEW;

  const setStatusRemote = async (next: string) => {
    setSaving(true);
    const res = await fetch(`/api/inquiries/${inquiry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) setStatus(next);
    setSaving(false);
  };

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && status === "NEW") setStatusRemote("READ");
  };

  const mailtoHref = `mailto:${inquiry.email}?subject=${encodeURIComponent(
    `Re: ${inquiry.subject || `Your inquiry to ${businessName}`}`
  )}`;

  return (
    <div className={cn("border rounded-xl overflow-hidden", status === "NEW" ? "border-blue-200 bg-blue-50/40" : "border-gray-200 bg-white")}>
      <button onClick={toggleExpand} className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors">
        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0", meta.color)}>{meta.label}</span>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-900">{inquiry.name}</span>
          {inquiry.subject && <span className="text-sm text-gray-500"> · {inquiry.subject}</span>}
          {!expanded && <p className="text-xs text-gray-400 truncate">{inquiry.message}</p>}
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(inquiry.createdAt)}</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-sm text-gray-700 whitespace-pre-line bg-white border border-gray-100 rounded-lg p-3">{inquiry.message}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
            <a href={mailtoHref} className="flex items-center gap-1 text-brand-600 hover:underline"><Mail className="w-3.5 h-3.5" /> {inquiry.email}</a>
            {inquiry.phone && <a href={`tel:${inquiry.phone}`} className="flex items-center gap-1 text-brand-600 hover:underline"><Phone className="w-3.5 h-3.5" /> {inquiry.phone}</a>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={mailtoHref}
              onClick={() => setStatusRemote("REPLIED")}
              className="flex items-center gap-1.5 text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
            >
              <Reply className="w-3.5 h-3.5" /> Reply by Email
            </a>
            {status !== "REPLIED" && (
              <button disabled={saving} onClick={() => setStatusRemote("REPLIED")} className="flex items-center gap-1 text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:border-green-300 hover:text-green-700 transition-colors disabled:opacity-50">
                <CheckCircle className="w-3.5 h-3.5" /> Mark Replied
              </button>
            )}
            {status !== "ARCHIVED" && (
              <button disabled={saving} onClick={() => setStatusRemote("ARCHIVED")} className="flex items-center gap-1 text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:border-amber-300 hover:text-amber-700 transition-colors disabled:opacity-50">
                <Archive className="w-3.5 h-3.5" /> Archive
              </button>
            )}
            {status !== "CLOSED" && (
              <button disabled={saving} onClick={() => setStatusRemote("CLOSED")} className="flex items-center gap-1 text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50">
                <XCircle className="w-3.5 h-3.5" /> Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function InquiryManager({
  businessName,
  initialInquiries,
}: {
  businessName: string;
  initialInquiries: InquiryItem[];
}) {
  const [filter, setFilter] = useState<string>("ACTIVE");

  const filtered = initialInquiries.filter((i) => {
    if (filter === "ACTIVE") return !["ARCHIVED", "CLOSED"].includes(i.status);
    if (filter === "ALL") return true;
    return i.status === filter;
  });

  if (initialInquiries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Inbox className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No inquiries yet — they&apos;ll appear here when customers message you</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {["ACTIVE", "NEW", "REPLIED", "ARCHIVED", "CLOSED", "ALL"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full transition-colors",
              filter === f ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {f === "ACTIVE" ? "Active" : f === "ALL" ? "All" : STATUS_META[f]?.label || f}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nothing in this view</p>
        ) : (
          filtered.map((inq) => <InquiryCard key={inq.id} inquiry={inq} businessName={businessName} />)
        )}
      </div>
    </div>
  );
}
