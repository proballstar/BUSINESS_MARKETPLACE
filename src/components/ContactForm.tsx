"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface ContactFormProps {
  businessId: string;
  businessName: string;
}

export function ContactForm({ businessId, businessName }: ContactFormProps) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return setError("Please fill in all required fields");
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, businessId }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send message");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="text-3xl mb-2">✅</div>
        <p className="font-semibold text-green-800 text-sm">Message sent to {businessName}!</p>
        <p className="text-gray-500 text-xs mt-1">They&apos;ll get back to you soon.</p>
        <button onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }} className="mt-3 text-xs text-brand-600 hover:underline">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Your name *"
        required
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <input
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Your email *"
        required
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <input
        name="phone"
        value={form.phone}
        onChange={handleChange}
        placeholder="Phone (optional)"
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <select
        name="subject"
        value={form.subject}
        onChange={handleChange}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-600"
      >
        <option value="">Select a subject...</option>
        <option>General Inquiry</option>
        <option>Request a Quote</option>
        <option>Make a Reservation</option>
        <option>Hours & Location</option>
        <option>Other</option>
      </select>
      <textarea
        name="message"
        value={form.message}
        onChange={handleChange}
        rows={3}
        placeholder="Your message *"
        required
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
      />
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        {submitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
