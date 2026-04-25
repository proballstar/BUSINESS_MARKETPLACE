"use client";

import { useState } from "react";
import { Tag, Calendar, Megaphone, Plus, Trash2, X } from "lucide-react";
import { BusinessFeed, type FeedPost } from "./BusinessFeed";

const TYPES = [
  { id: "UPDATE", label: "Update", icon: Megaphone, desc: "News, announcements, behind-the-scenes", color: "bg-blue-50 border-blue-200 text-blue-700" },
  { id: "DEAL",   label: "Deal",   icon: Tag,       desc: "Flash deals, discounts, promo codes", color: "bg-rose-50 border-rose-200 text-rose-700" },
  { id: "EVENT",  label: "Event",  icon: Calendar,  desc: "Workshops, tastings, classes, pop-ups", color: "bg-violet-50 border-violet-200 text-violet-700" },
];

interface PostForm {
  type: string;
  title: string;
  content: string;
  imageUrl: string;
  discountText: string;
  discountCode: string;
  originalPrice: string;
  salePrice: string;
  eventDate: string;
  eventEndDate: string;
  eventLocation: string;
  capacity: string;
  rsvpUrl: string;
  expiresAt: string;
  pinned: boolean;
}

const BLANK: PostForm = {
  type: "UPDATE", title: "", content: "", imageUrl: "",
  discountText: "", discountCode: "", originalPrice: "", salePrice: "",
  eventDate: "", eventEndDate: "", eventLocation: "", capacity: "", rsvpUrl: "",
  expiresAt: "", pinned: false,
};

export function PostManager({
  businessId,
  initialPosts,
}: {
  businessId: string;
  initialPosts: FeedPost[];
}) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PostForm>({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = (k: keyof PostForm, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return setErr("Title and content are required");
    setErr("");
    setSaving(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, ...form, capacity: form.capacity ? parseInt(form.capacity) : undefined }),
    });
    const data = await res.json();
    if (res.ok) {
      setPosts((prev) => [data, ...prev]);
      setForm({ ...BLANK });
      setOpen(false);
    } else {
      setErr(data.error || "Failed to post");
    }
    setSaving(false);
  };

  return (
    <div>
      {/* New Post button */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors mb-4"
        >
          <Plus className="w-4 h-4" /> Create Post
        </button>
      ) : (
        <form onSubmit={submit} className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-5 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h5 className="font-semibold text-gray-900">New Post</h5>
            <button type="button" onClick={() => { setOpen(false); setErr(""); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>

          {/* Type selector */}
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map(({ id, label, icon: Icon, desc, color }) => (
              <button
                key={id}
                type="button"
                onClick={() => set("type", id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${form.type === id ? color + " border-current" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{label}</span>
                <span className="text-xs leading-tight opacity-70 hidden sm:block">{desc}</span>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder={form.type === "DEAL" ? "20% Off All Sandwiches Today!" : form.type === "EVENT" ? "Wine Tasting Evening" : "Fresh Batch Just Out of the Oven"} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Details *</label>
            <textarea value={form.content} onChange={(e) => set("content", e.target.value)} required rows={3} placeholder="Tell your customers more..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Photo URL (optional)</label>
            <input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          {/* Deal extras */}
          {form.type === "DEAL" && (
            <div className="grid grid-cols-2 gap-3 bg-rose-50 rounded-xl p-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Discount Text</label>
                <input value={form.discountText} onChange={(e) => set("discountText", e.target.value)} placeholder="20% off, BOGO, etc." className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Promo Code</label>
                <input value={form.discountCode} onChange={(e) => set("discountCode", e.target.value)} placeholder="SUMMER20" className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white uppercase" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Original Price</label>
                <input value={form.originalPrice} onChange={(e) => set("originalPrice", e.target.value)} placeholder="$25.00" className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sale Price</label>
                <input value={form.salePrice} onChange={(e) => set("salePrice", e.target.value)} placeholder="$20.00" className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Expires At (optional)</label>
                <input type="datetime-local" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white" />
              </div>
            </div>
          )}

          {/* Event extras */}
          {form.type === "EVENT" && (
            <div className="grid grid-cols-2 gap-3 bg-violet-50 rounded-xl p-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Event Date & Time *</label>
                <input type="datetime-local" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                <input type="datetime-local" value={form.eventEndDate} onChange={(e) => set("eventEndDate", e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 bg-white" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Location (if different from business)</label>
                <input value={form.eventLocation} onChange={(e) => set("eventLocation", e.target.value)} placeholder="e.g. Our back patio, Riverside Park, etc." className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Capacity</label>
                <input type="number" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="20" className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">External RSVP Link</label>
                <input value={form.rsvpUrl} onChange={(e) => set("rsvpUrl", e.target.value)} placeholder="https://eventbrite.com/..." className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 bg-white" />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input type="checkbox" id="pinned" checked={form.pinned} onChange={(e) => set("pinned", e.target.checked)} className="w-4 h-4 text-brand-600" />
            <label htmlFor="pinned" className="text-xs text-gray-600">📌 Pin to top of feed</label>
          </div>

          {err && <p className="text-xs text-red-600">{err}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="flex-1 bg-brand-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50">
              {saving ? "Publishing..." : "Publish Post"}
            </button>
            <button type="button" onClick={() => { setOpen(false); setErr(""); }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-gray-300 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      <BusinessFeed posts={posts} isOwner={true} />
    </div>
  );
}
