"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2, Globe, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import { CATEGORIES, PRICE_RANGES } from "@/lib/utils";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed",
  thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
};

const DEFAULT_HOURS = Object.fromEntries(
  DAYS.map((d) => [d, { open: "09:00", close: "17:00", closed: d === "sunday" }])
);

interface HoursEntry { open: string; close: string; closed: boolean }
interface TeamMember { name: string; role: string; bio: string; imageUrl: string }

function EditBusinessForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [activeTab, setActiveTab] = useState<"basic" | "contact" | "hours" | "media" | "team" | "social">("basic");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "", tagline: "", description: "", category: "", subcategory: "",
    priceRange: "", yearFounded: "", employeeCount: "",
    address: "", city: "", state: "", zip: "",
    phone: "", email: "", website: "",
    tags: [] as string[],
    images: [] as string[],
    team: [] as TeamMember[],
    socialLinks: { facebook: "", instagram: "", twitter: "", linkedin: "" },
    hoursJson: DEFAULT_HOURS as Record<string, HoursEntry>,
  });
  const [newMember, setNewMember] = useState<TeamMember>({ name: "", role: "", bio: "", imageUrl: "" });

  const [newTag, setNewTag] = useState("");
  const [newImage, setNewImage] = useState("");

  const loadBusiness = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/businesses/${id}`);
      if (res.ok) {
        const b = await res.json();
        setForm({
          name: b.name || "",
          tagline: b.tagline || "",
          description: b.description || "",
          category: b.category || "",
          subcategory: b.subcategory || "",
          priceRange: b.priceRange || "",
          yearFounded: b.yearFounded ? String(b.yearFounded) : "",
          employeeCount: b.employeeCount || "",
          address: b.address || "",
          city: b.city || "",
          state: b.state || "",
          zip: b.zip || "",
          phone: b.phone || "",
          email: b.email || "",
          website: b.website || "",
          tags: JSON.parse(b.tags || "[]"),
          images: JSON.parse(b.images || "[]"),
          team: JSON.parse(b.teamJson || "[]"),
          socialLinks: { facebook: "", instagram: "", twitter: "", linkedin: "", ...JSON.parse(b.socialLinks || "{}") },
          hoursJson: { ...DEFAULT_HOURS, ...JSON.parse(b.hoursJson || "{}") },
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (editId) loadBusiness(editId);
  }, [editId, loadBusiness]);

  if (status === "unauthenticated") {
    router.push("/auth/signin?callbackUrl=/dashboard/edit");
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleHoursChange = (day: string, field: "open" | "close" | "closed", value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      hoursJson: { ...prev.hoursJson, [day]: { ...prev.hoursJson[day], [field]: value } },
    }));
  };

  const handleSocialChange = (platform: string, value: string) => {
    setForm((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, [platform]: value } }));
  };

  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const addImage = () => {
    if (newImage.trim() && !form.images.includes(newImage.trim())) {
      setForm((prev) => ({ ...prev, images: [...prev.images, newImage.trim()] }));
      setNewImage("");
    }
  };

  const removeImage = (url: string) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((i) => i !== url) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.category || !form.address || !form.city || !form.state) {
      setError("Please fill in all required fields");
      setActiveTab("basic");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload = { ...form, hoursJson: form.hoursJson, socialLinks: form.socialLinks, teamJson: form.team };
      const url = editId ? `/api/businesses/${editId}` : "/api/businesses";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/dashboard"), 1500);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading business data...</div>
      </div>
    );
  }

  const addTeamMember = () => {
    if (!newMember.name.trim() || !newMember.role.trim()) return;
    setForm((prev) => ({ ...prev, team: [...prev.team, { ...newMember }] }));
    setNewMember({ name: "", role: "", bio: "", imageUrl: "" });
  };

  const removeTeamMember = (i: number) => {
    setForm((prev) => ({ ...prev, team: prev.team.filter((_, idx) => idx !== i) }));
  };

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "contact", label: "Contact & Location" },
    { id: "hours", label: "Hours" },
    { id: "media", label: "Photos & Tags" },
    { id: "team", label: "Meet the Team" },
    { id: "social", label: "Social Links" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-gray-900 text-lg">{editId ? "Edit Business" : "List Your Business"}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-white text-brand-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          {/* Basic Info */}
          {activeTab === "basic" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Joe's Coffee" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                <input name="tagline" value={form.tagline} onChange={handleChange} placeholder="A short catchy line about your business" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={5} required placeholder="Tell customers what makes your business special..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select name="category" value={form.category} onChange={handleChange} required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">Select category...</option>
                    {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                  <select name="priceRange" value={form.priceRange} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">Select...</option>
                    {PRICE_RANGES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year Founded</label>
                  <input name="yearFounded" type="number" value={form.yearFounded} onChange={handleChange} placeholder="e.g. 2015" min="1900" max={new Date().getFullYear()} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team Size</label>
                  <select name="employeeCount" value={form.employeeCount} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">Select...</option>
                    {["1-5", "6-10", "11-25", "26-50", "51-100", "100+"].map((v) => <option key={v} value={v}>{v} employees</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Contact & Location */}
          {activeTab === "contact" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                <input name="address" value={form.address} onChange={handleChange} required placeholder="123 Main St" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input name="city" value={form.city} onChange={handleChange} required placeholder="New York" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input name="state" value={form.state} onChange={handleChange} required placeholder="NY" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                <input name="zip" value={form.zip} onChange={handleChange} placeholder="10001" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="(555) 123-4567" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="hello@yourbusiness.com" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input name="website" value={form.website} onChange={handleChange} placeholder="https://yourwebsite.com" className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
            </>
          )}

          {/* Hours */}
          {activeTab === "hours" && (
            <div className="space-y-3">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-3">
                  <div className="w-10 text-sm font-medium text-gray-700">{DAY_LABELS[day]}</div>
                  <input
                    type="checkbox"
                    checked={!form.hoursJson[day]?.closed}
                    onChange={(e) => handleHoursChange(day, "closed", !e.target.checked)}
                    className="w-4 h-4 text-brand-600"
                  />
                  {!form.hoursJson[day]?.closed ? (
                    <>
                      <input type="time" value={form.hoursJson[day]?.open || "09:00"} onChange={(e) => handleHoursChange(day, "open", e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                      <span className="text-gray-400 text-sm">to</span>
                      <input type="time" value={form.hoursJson[day]?.close || "17:00"} onChange={(e) => handleHoursChange(day, "close", e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </>
                  ) : (
                    <span className="text-sm text-red-500">Closed</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Media & Tags */}
          {activeTab === "media" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Photos (paste image URLs)</label>
                <div className="flex gap-2 mb-3">
                  <input value={newImage} onChange={(e) => setNewImage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImage())} placeholder="https://images.unsplash.com/..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  <button type="button" onClick={addImage} className="px-3 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {form.images.length > 0 && (
                  <div className="space-y-2">
                    {form.images.map((url) => (
                      <div key={url} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                        <img src={url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />
                        <span className="flex-1 text-xs text-gray-600 truncate">{url}</span>
                        <button type="button" onClick={() => removeImage(url)} className="text-red-500 hover:text-red-700 flex-shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags / Keywords</label>
                <div className="flex gap-2 mb-3">
                  <input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="e.g. organic, family-friendly" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  <button type="button" onClick={addTag} className="px-3 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 bg-brand-50 text-brand-700 px-2 py-1 rounded-full text-sm">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="text-brand-400 hover:text-brand-700">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Meet the Team */}
          {activeTab === "team" && (
            <>
              <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-brand-800 font-medium">👥 Show the real people behind your business</p>
                <p className="text-xs text-brand-600 mt-1">Customers connect more with businesses when they can see who they&apos;re dealing with. Large chains can&apos;t do this authentically — you can.</p>
              </div>

              {/* Existing members */}
              {form.team.length > 0 && (
                <div className="space-y-3 mb-4">
                  {form.team.map((member, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                        <p className="text-xs text-brand-600">{member.role}</p>
                        {member.bio && <p className="text-xs text-gray-500 truncate">{member.bio}</p>}
                      </div>
                      <button type="button" onClick={() => removeTeamMember(i)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new member */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <h5 className="text-sm font-semibold text-gray-900">Add Team Member</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                    <input value={newMember.name} onChange={(e) => setNewMember((m) => ({ ...m, name: e.target.value }))} placeholder="Jane Smith" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Role *</label>
                    <input value={newMember.role} onChange={(e) => setNewMember((m) => ({ ...m, role: e.target.value }))} placeholder="Head Chef, Owner, etc." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Short Bio</label>
                  <input value={newMember.bio} onChange={(e) => setNewMember((m) => ({ ...m, bio: e.target.value }))} placeholder="10 years of experience, passionate about..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Photo URL</label>
                  <input value={newMember.imageUrl} onChange={(e) => setNewMember((m) => ({ ...m, imageUrl: e.target.value }))} placeholder="https://..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <button
                  type="button"
                  onClick={addTeamMember}
                  disabled={!newMember.name.trim() || !newMember.role.trim()}
                  className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Member
                </button>
              </div>
            </>
          )}

          {/* Social Links */}
          {activeTab === "social" && (
            <div className="space-y-4">
              {[
                { key: "facebook", icon: Facebook, placeholder: "https://facebook.com/yourbusiness" },
                { key: "instagram", icon: Instagram, placeholder: "https://instagram.com/yourbusiness" },
                { key: "twitter", icon: Twitter, placeholder: "https://twitter.com/yourbusiness" },
                { key: "linkedin", icon: Linkedin, placeholder: "https://linkedin.com/company/yourbusiness" },
              ].map(({ key, icon: Icon, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{key}</label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={form.socialLinks[key as keyof typeof form.socialLinks]}
                      onChange={(e) => handleSocialChange(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">✅ Business saved! Redirecting to dashboard...</div>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-brand-600 text-white py-2.5 rounded-lg font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 text-sm"
            >
              {saving ? "Saving..." : editId ? "Update Business" : "List My Business"}
            </button>
            <Link href="/dashboard" className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-gray-300 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditBusinessPage() {
  return (
    <Suspense>
      <EditBusinessForm />
    </Suspense>
  );
}
