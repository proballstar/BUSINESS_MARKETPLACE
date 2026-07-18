"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export function PublishToggle({ businessId, initialActive }: { businessId: string; initialActive: boolean }) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    setSaving(true);
    const res = await fetch(`/api/businesses/${businessId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    if (res.ok) {
      setActive(!active);
      router.refresh();
    }
    setSaving(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-50 ${
        active
          ? "border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-700"
          : "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
      }`}
      title={active ? "Hide your listing from customers" : "Make your listing visible again"}
    >
      {active ? <><EyeOff className="w-3.5 h-3.5" /> Unpublish</> : <><Eye className="w-3.5 h-3.5" /> Publish</>}
    </button>
  );
}
