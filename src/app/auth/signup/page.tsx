"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Eye, EyeOff, Mail, Lock, User, Store, Check } from "lucide-react";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "business" ? "BUSINESS_OWNER" : "CUSTOMER";

  const [role, setRole] = useState(defaultRole);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) return setError("Password must be at least 8 characters");
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
      } else {
        router.push("/auth/signin?registered=true");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl text-gray-900">Local<span className="text-brand-600">Spot</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Join LocalSpot</h1>
          <p className="text-gray-500 mt-1">Free forever. No credit card required.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole("CUSTOMER")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${role === "CUSTOMER" ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300"}`}
            >
              <User className={`w-6 h-6 ${role === "CUSTOMER" ? "text-brand-600" : "text-gray-400"}`} />
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900">I&apos;m a Customer</div>
                <div className="text-xs text-gray-500 mt-0.5">Discover local businesses</div>
              </div>
              {role === "CUSTOMER" && <Check className="w-4 h-4 text-brand-600" />}
            </button>
            <button
              type="button"
              onClick={() => setRole("BUSINESS_OWNER")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${role === "BUSINESS_OWNER" ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300"}`}
            >
              <Store className={`w-6 h-6 ${role === "BUSINESS_OWNER" ? "text-brand-600" : "text-gray-400"}`} />
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900">I&apos;m a Business Owner</div>
                <div className="text-xs text-gray-500 mt-0.5">List & grow my business</div>
              </div>
              {role === "BUSINESS_OWNER" && <Check className="w-4 h-4 text-brand-600" />}
            </button>
          </div>

          {role === "BUSINESS_OWNER" && (
            <div className="bg-accent-50 border border-accent-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
              🎉 <strong>Free listing</strong> — Get your business in front of thousands of local customers. No subscription needed to start.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Jane Smith"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="password"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Min. 8 characters"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? "Creating account..." : "Create Free Account"}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="underline">Terms</Link> and{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-brand-600 font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        </div>

        {/* Value props */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-gray-500">
          {["✅ Always Free", "🔒 Secure", "🚀 Instant Access"].map((item) => (
            <div key={item} className="bg-white/60 backdrop-blur-sm rounded-lg py-2 px-1">{item}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
