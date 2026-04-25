"use client";

import { useState } from "react";
import { Gift, Users, CheckCircle, Star } from "lucide-react";

interface LoyaltyConfig {
  rewardName: string;
  stampsNeeded: number;
  description: string | null;
  active: boolean;
}

export function LoyaltyManager({
  businessId,
  initialConfig,
}: {
  businessId: string;
  initialConfig: LoyaltyConfig | null;
}) {
  const [config, setConfig] = useState<LoyaltyConfig | null>(initialConfig);
  const [editing, setEditing] = useState(!initialConfig);
  const [form, setForm] = useState({
    rewardName: initialConfig?.rewardName || "",
    stampsNeeded: initialConfig?.stampsNeeded?.toString() || "10",
    description: initialConfig?.description || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rewardName || !form.stampsNeeded) return setErr("Required fields missing");
    setSaving(true);
    setErr("");
    const res = await fetch("/api/loyalty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, ...form }),
    });
    const data = await res.json();
    if (res.ok) {
      setConfig(data);
      setEditing(false);
    } else {
      setErr(data.error || "Failed to save");
    }
    setSaving(false);
  };

  if (config && !editing) {
    return (
      <div className="bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-200 rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900">{config.rewardName}</div>
              <div className="text-sm text-gray-500">
                {config.stampsNeeded} stamps to redeem · {config.description || "Earn a stamp per visit"}
              </div>
            </div>
          </div>
          <button onClick={() => setEditing(true)} className="text-xs text-brand-600 font-medium hover:underline flex-shrink-0">Edit</button>
        </div>

        {/* Stamp preview */}
        <div className="flex flex-wrap gap-2 mb-3">
          {Array.from({ length: Math.min(config.stampsNeeded, 12) }, (_, i) => (
            <div key={i} className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${i < 5 ? "bg-brand-600 border-brand-600 text-white" : "border-gray-300 bg-white text-gray-300"}`}>
              <Star className={`w-3.5 h-3.5 ${i < 5 ? "fill-white" : ""}`} />
            </div>
          ))}
          {config.stampsNeeded > 12 && <span className="text-xs text-gray-400 self-center">+{config.stampsNeeded - 12} more</span>}
        </div>
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Program is active — customers can earn stamps on your profile page
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
      {!config && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
          <h5 className="font-semibold text-brand-900 text-sm mb-1 flex items-center gap-2">
            <Gift className="w-4 h-4" /> Why offer a loyalty program?
          </h5>
          <ul className="text-xs text-brand-700 space-y-1">
            <li>• Repeat customers spend <strong>67% more</strong> than new ones</li>
            <li>• Digital punch cards beat paper — no cards to lose</li>
            <li>• Builds a base of regulars that large chains can&apos;t replicate</li>
            <li>• Completely free to set up and manage</li>
          </ul>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Reward Name *</label>
        <input
          value={form.rewardName}
          onChange={(e) => setForm((f) => ({ ...f, rewardName: e.target.value }))}
          placeholder="e.g. Free Coffee, 50% Off Your Next Order"
          required
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Stamps Needed to Redeem *</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="5"
            max="20"
            value={form.stampsNeeded}
            onChange={(e) => setForm((f) => ({ ...f, stampsNeeded: e.target.value }))}
            className="flex-1 accent-brand-600"
          />
          <div className="w-12 h-10 bg-brand-600 text-white font-bold rounded-lg flex items-center justify-center text-sm flex-shrink-0">
            {form.stampsNeeded}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">Customers earn 1 stamp per visit by clicking &quot;Add a Stamp&quot; on your profile</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">How to Earn Stamps (shown to customers)</label>
        <input
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="e.g. Earn 1 stamp with every purchase over $10"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {err && <p className="text-xs text-red-600">{err}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="flex-1 bg-brand-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors">
          {saving ? "Saving..." : config ? "Update Program" : "Launch Loyalty Program"}
        </button>
        {config && <button type="button" onClick={() => { setEditing(false); setErr(""); }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-gray-300 transition-colors">Cancel</button>}
      </div>
    </form>
  );
}
