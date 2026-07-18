"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Gift, Star, CheckCircle } from "lucide-react";

interface LoyaltyConfig {
  rewardName: string;
  stampsNeeded: number;
  description: string | null;
}

interface LoyaltyCardData {
  stamps: number;
  totalEarned: number;
  rewardsClaimed: number;
}

interface LoyaltyWidgetProps {
  businessId: string;
  businessName: string;
  initialConfig: LoyaltyConfig | null;
  initialCard: LoyaltyCardData | null;
}

export function LoyaltyWidget({ businessId, businessName, initialConfig, initialCard }: LoyaltyWidgetProps) {
  const { data: session } = useSession();
  const [card, setCard] = useState<LoyaltyCardData | null>(initialCard);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [justRedeemed, setJustRedeemed] = useState(false);

  if (!initialConfig) return null;

  const stamps = card?.stamps ?? 0;
  const needed = initialConfig.stampsNeeded;
  const progress = Math.min(stamps / needed, 1);

  const handleStamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !code.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/loyalty/stamp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, code: code.trim().toUpperCase() }),
    });
    const data = await res.json();
    if (res.ok) {
      setCard(data.card);
      setCode("");
      if (data.redeemed) setJustRedeemed(true);
    } else {
      setError(data.error || "Invalid code");
    }
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
          <Gift className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{businessName} Loyalty Rewards</h3>
          <p className="text-xs text-gray-500">{initialConfig.description || `Earn a stamp each visit`}</p>
        </div>
      </div>

      {justRedeemed ? (
        <div className="text-center py-3 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-1" />
          <p className="font-bold text-green-800 text-sm">🎉 Reward Unlocked!</p>
          <p className="text-xs text-green-700 mt-0.5">Show this to claim your <strong>{initialConfig.rewardName}</strong></p>
        </div>
      ) : (
        <>
          {/* Stamp grid */}
          <div className="flex flex-wrap gap-2 mb-3">
            {Array.from({ length: needed }, (_, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  i < stamps
                    ? "bg-brand-600 border-brand-600 text-white"
                    : "border-gray-300 bg-white text-gray-300"
                }`}
              >
                <Star className={`w-4 h-4 ${i < stamps ? "fill-white" : ""}`} />
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
            <div
              className="bg-brand-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <span>{stamps} of {needed} stamps</span>
            <span className="font-medium text-brand-700">{needed - stamps} until <strong>{initialConfig.rewardName}</strong></span>
          </div>

          {card && card.rewardsClaimed > 0 && (
            <p className="text-xs text-gray-400 mb-3">🏆 {card.rewardsClaimed} reward{card.rewardsClaimed > 1 ? "s" : ""} claimed · {card.totalEarned} total visits</p>
          )}

          {session ? (
            <form onSubmit={handleStamp}>
              <p className="text-xs text-gray-500 mb-2">Visiting? Ask the staff for a stamp code:</p>
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="6-DIGIT CODE"
                  maxLength={6}
                  className="flex-1 min-w-0 px-3 py-2 text-sm font-mono tracking-widest uppercase border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="flex-shrink-0 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "..." : "Stamp"}
                </button>
              </div>
              {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
            </form>
          ) : (
            <Link href="/auth/signin" className="block w-full text-center bg-brand-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors">
              Sign in to earn stamps
            </Link>
          )}
        </>
      )}
    </div>
  );
}
