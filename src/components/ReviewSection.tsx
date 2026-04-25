"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ThumbsUp, Reply, User } from "lucide-react";
import { StarRating } from "./StarRating";
import type { BusinessWithStats, ReviewWithUser } from "@/types";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function ReviewCard({ review, isOwner }: { review: ReviewWithUser; isOwner: boolean }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [ownerReply, setOwnerReply] = useState(review.ownerReply || "");
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText }),
      });
      if (res.ok) {
        setOwnerReply(replyText);
        setReplyOpen(false);
        setReplyText("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-b border-gray-100 last:border-0 pb-5 last:pb-0">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <span className="font-semibold text-sm text-gray-900">{review.user?.name || "Anonymous"}</span>
              {review.verified && <span className="ml-2 text-xs text-brand-600 font-medium">✓ Verified</span>}
            </div>
            <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
          </div>
          <StarRating rating={review.rating} size="sm" className="mt-1" />
          {review.title && <p className="font-semibold text-gray-900 text-sm mt-1">{review.title}</p>}
          <p className="text-gray-700 text-sm mt-1 leading-relaxed">{review.comment}</p>

          <div className="flex items-center gap-3 mt-2">
            <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-600 transition-colors">
              <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({review.helpful})
            </button>
            {isOwner && !ownerReply && (
              <button onClick={() => setReplyOpen(!replyOpen)} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 transition-colors">
                <Reply className="w-3.5 h-3.5" /> Reply as owner
              </button>
            )}
          </div>

          {replyOpen && (
            <form onSubmit={handleReply} className="mt-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                placeholder="Write your response as the business owner..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
              <div className="flex gap-2 mt-2">
                <button type="submit" disabled={submitting} className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50">
                  {submitting ? "Posting..." : "Post Reply"}
                </button>
                <button type="button" onClick={() => setReplyOpen(false)} className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {ownerReply && (
            <div className="mt-3 bg-brand-50 border border-brand-100 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center">
                  <Reply className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-semibold text-brand-700">Owner Response</span>
              </div>
              <p className="text-sm text-gray-700">{ownerReply}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WriteReview({ businessId, onReviewAdded }: { businessId: string; onReviewAdded: (r: ReviewWithUser) => void }) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!session) {
    return (
      <div className="bg-gray-50 rounded-xl p-5 text-center">
        <p className="text-gray-600 mb-3 text-sm">Share your experience with this business</p>
        <Link href="/auth/signin" className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
          Sign In to Write a Review
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
        <div className="text-2xl mb-2">🎉</div>
        <p className="font-semibold text-green-800">Review submitted! Thank you.</p>
        <button onClick={() => { setSuccess(false); setRating(0); setTitle(""); setComment(""); }} className="mt-3 text-sm text-brand-600 hover:underline">
          Write another review
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return setError("Please select a star rating");
    if (!comment.trim()) return setError("Please write a comment");
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, rating, title, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit review");
      } else {
        onReviewAdded(data);
        setSuccess(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-5">
      <h4 className="font-semibold text-gray-900 mb-3">Write a Review</h4>
      <div className="mb-3">
        <label className="text-sm text-gray-600 mb-1 block">Your Rating *</label>
        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
      </div>
      <div className="mb-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Review title (optional)"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div className="mb-3">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Share details about your experience..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          required
        />
      </div>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <button type="submit" disabled={submitting || rating === 0} className="bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50">
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}

export function ReviewSection({
  business,
  initialReviews,
}: {
  business: BusinessWithStats;
  initialReviews: ReviewWithUser[];
}) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<ReviewWithUser[]>(initialReviews);

  const isOwner = (session?.user as { id?: string })?.id === business.ownerId;

  const addReview = (review: ReviewWithUser) => {
    setReviews((prev) => [review, ...prev]);
  };

  return (
    <div className="space-y-6">
      <WriteReview businessId={business.id} onReviewAdded={addReview} />

      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">No reviews yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} isOwner={isOwner} />
          ))}
        </div>
      )}
    </div>
  );
}
