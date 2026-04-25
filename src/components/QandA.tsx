"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { HelpCircle, CheckCircle, ChevronDown, ChevronUp, User, Send } from "lucide-react";

export interface QuestionItem {
  id: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  helpful: number;
  createdAt: string;
  user: { name: string | null };
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function QuestionCard({ q, isOwner }: { q: QuestionItem; isOwner: boolean }) {
  const [expanded, setExpanded] = useState(!!q.answer);
  const [answerOpen, setAnswerOpen] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [answer, setAnswer] = useState(q.answer);
  const [submitting, setSubmitting] = useState(false);

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/questions/${q.id}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: answerText }),
    });
    if (res.ok) {
      const data = await res.json();
      setAnswer(data.answer);
      setAnswerOpen(false);
    }
    setSubmitting(false);
  };

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <HelpCircle className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm">{q.question}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Asked by {q.user.name || "Anonymous"} · {timeAgo(q.createdAt)}
            {answer && <span className="text-green-600 font-medium ml-2">✓ Answered</span>}
          </p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {answer ? (
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-brand-600" />
                <span className="text-xs font-semibold text-brand-700">Owner&apos;s Answer</span>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">{answer}</p>
            </div>
          ) : isOwner ? (
            answerOpen ? (
              <form onSubmit={submitAnswer} className="space-y-2">
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Write your answer..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={submitting} className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50">
                    {submitting ? "Posting..." : "Post Answer"}
                  </button>
                  <button type="button" onClick={() => setAnswerOpen(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                </div>
              </form>
            ) : (
              <button onClick={() => setAnswerOpen(true)} className="text-sm text-brand-600 font-medium hover:underline">
                Answer this question →
              </button>
            )
          ) : (
            <p className="text-sm text-gray-400 italic">Waiting for owner response...</p>
          )}
        </div>
      )}
    </div>
  );
}

export function QandASection({
  businessId,
  isOwner,
  initialQuestions,
}: {
  businessId: string;
  isOwner: boolean;
  initialQuestions: QuestionItem[];
}) {
  const { data: session } = useSession();
  const [questions, setQuestions] = useState<QuestionItem[]>(initialQuestions);
  const [newQ, setNewQ] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQ.trim()) return;
    setErr("");
    setSubmitting(true);
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, question: newQ }),
    });
    const data = await res.json();
    if (res.ok) {
      setQuestions((prev) => [data, ...prev]);
      setNewQ("");
    } else {
      setErr(data.error || "Failed to submit");
    }
    setSubmitting(false);
  };

  const answered = questions.filter((q) => q.answer);
  const pending = questions.filter((q) => !q.answer);

  return (
    <div className="space-y-4">
      {/* Ask a question */}
      {!isOwner && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-brand-600" /> Ask the Owner
          </h4>
          {session ? (
            <form onSubmit={submitQuestion} className="flex gap-2">
              <input
                value={newQ}
                onChange={(e) => setNewQ(e.target.value)}
                placeholder="E.g. Do you offer gluten-free options?"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
              <button type="submit" disabled={submitting || !newQ.trim()} className="flex-shrink-0 bg-brand-600 text-white px-3 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-500 flex-1">Sign in to ask the business owner a question directly.</p>
              <Link href="/auth/signin" className="flex-shrink-0 text-sm bg-brand-600 text-white px-3 py-2 rounded-lg hover:bg-brand-700 transition-colors">Sign in</Link>
            </div>
          )}
          {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
        </div>
      )}

      {questions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No questions yet — be the first to ask!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {answered.map((q) => <QuestionCard key={q.id} q={q} isOwner={isOwner} />)}
          {pending.length > 0 && (
            <>
              {answered.length > 0 && <div className="text-xs text-gray-400 font-medium pt-2">Awaiting answer</div>}
              {pending.map((q) => <QuestionCard key={q.id} q={q} isOwner={isOwner} />)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
