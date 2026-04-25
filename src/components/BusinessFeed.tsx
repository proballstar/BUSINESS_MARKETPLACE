"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Tag, Calendar, Clock, MapPin, Users, MessageSquare, Zap, Megaphone, ExternalLink } from "lucide-react";

interface PostBusiness {
  name: string;
  slug: string;
  city: string;
  state: string;
}

export interface FeedPost {
  id: string;
  type: string; // "UPDATE" | "DEAL" | "EVENT"
  title: string;
  content: string;
  imageUrl: string | null;
  discountText: string | null;
  discountCode: string | null;
  originalPrice: string | null;
  salePrice: string | null;
  eventDate: string | null;
  eventEndDate: string | null;
  eventLocation: string | null;
  capacity: number | null;
  rsvpCount: number;
  rsvpUrl: string | null;
  expiresAt: string | null;
  pinned: boolean;
  active: boolean;
  createdAt: string;
  business?: PostBusiness;
  // owner-facing
  isOwner?: boolean;
  onDelete?: (id: string) => void;
}

const TYPE_CONFIG = {
  UPDATE: { icon: Megaphone, label: "Update", color: "bg-blue-100 text-blue-700", border: "border-blue-200" },
  DEAL:   { icon: Tag,       label: "Deal",   color: "bg-rose-100 text-rose-700",  border: "border-rose-200" },
  EVENT:  { icon: Calendar,  label: "Event",  color: "bg-violet-100 text-violet-700", border: "border-violet-200" },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function timeLeft(exp: string | null): string | null {
  if (!exp) return null;
  const ms = new Date(exp).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(h / 24);
  if (d >= 1) return `${d}d left`;
  return `${h}h left`;
}

export function PostCard({ post, isOwner = false, onDelete }: { post: FeedPost; isOwner?: boolean; onDelete?: (id: string) => void }) {
  const config = TYPE_CONFIG[post.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.UPDATE;
  const Icon = config.icon;
  const expLabel = timeLeft(post.expiresAt);
  const isExpiringSoon = post.expiresAt && new Date(post.expiresAt).getTime() - Date.now() < 86400000;

  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    setDeleting(true);
    await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    onDelete?.(post.id);
  };

  return (
    <div className={`bg-white rounded-xl border ${config.border} overflow-hidden`}>
      {post.imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <Image src={post.imageUrl} alt={post.title} fill className="object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${config.color}`}>
              <Icon className="w-3 h-3" /> {config.label}
            </span>
            {post.pinned && <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">📌 Pinned</span>}
            {expLabel && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${isExpiringSoon ? "bg-red-100 text-red-600 animate-pulse" : "bg-gray-100 text-gray-500"}`}>
                <Clock className="w-3 h-3" /> {expLabel}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(post.createdAt)}</span>
        </div>

        <h3 className="font-bold text-gray-900 text-base mb-1">{post.title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-3 whitespace-pre-line">{post.content}</p>

        {/* Deal extras */}
        {post.type === "DEAL" && (
          <div className="space-y-2 mb-3">
            {(post.originalPrice || post.salePrice) && (
              <div className="flex items-center gap-2">
                {post.salePrice && <span className="text-lg font-bold text-rose-600">{post.salePrice}</span>}
                {post.originalPrice && <span className="text-sm text-gray-400 line-through">{post.originalPrice}</span>}
              </div>
            )}
            {post.discountCode && (
              <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">
                <Tag className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-xs text-gray-600">Code:</span>
                <code className="text-sm font-bold text-orange-700 tracking-wider">{post.discountCode}</code>
              </div>
            )}
          </div>
        )}

        {/* Event extras */}
        {post.type === "EVENT" && (
          <div className="space-y-1.5 mb-3">
            {post.eventDate && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-violet-500 flex-shrink-0" />
                {new Date(post.eventDate).toLocaleString("en-US", {
                  weekday: "long", month: "long", day: "numeric",
                  hour: "numeric", minute: "2-digit",
                })}
              </div>
            )}
            {post.eventLocation && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-violet-500 flex-shrink-0" />
                {post.eventLocation}
              </div>
            )}
            {post.capacity && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Users className="w-4 h-4 text-violet-500 flex-shrink-0" />
                {post.rsvpCount} / {post.capacity} attending
                {post.capacity - post.rsvpCount <= 5 && post.capacity - post.rsvpCount > 0 && (
                  <span className="text-xs text-red-500 font-semibold ml-1">({post.capacity - post.rsvpCount} spots left!)</span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {post.type === "EVENT" && (
            <RsvpButton postId={post.id} />
          )}
          {post.rsvpUrl && (
            <a href={post.rsvpUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
              External RSVP <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {isOwner && (
            <button onClick={handleDelete} disabled={deleting} className="ml-auto text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50">
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RsvpButton({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    const res = await fetch(`/api/posts/${postId}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setDone(true);
    else setErr(data.error || "Failed");
  };

  if (done) return <span className="text-xs text-green-600 font-semibold">✅ You&apos;re registered!</span>;

  return open ? (
    <form onSubmit={submit} className="flex flex-col gap-2 w-full mt-2 bg-violet-50 rounded-lg p-3">
      <div className="grid grid-cols-2 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Your email" required className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500" />
      </div>
      {err && <p className="text-xs text-red-500">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 disabled:opacity-50">
          {loading ? "Registering..." : "Confirm RSVP"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
      </div>
    </form>
  ) : (
    <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 transition-colors">
      <Calendar className="w-3.5 h-3.5" /> RSVP to this event
    </button>
  );
}

export function BusinessFeed({
  posts,
  isOwner = false,
}: {
  posts: FeedPost[];
  isOwner?: boolean;
}) {
  const [items, setItems] = useState(posts);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No updates yet</p>
        {isOwner && <p className="text-xs mt-1 text-brand-500">Post your first update, deal, or event above ↑</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isOwner={isOwner}
          onDelete={(id) => setItems((prev) => prev.filter((p) => p.id !== id))}
        />
      ))}
    </div>
  );
}
