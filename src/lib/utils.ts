import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function isBusinessOpen(hoursJson: string): { open: boolean; label: string } {
  try {
    const hours: Record<string, { open: string; close: string; closed?: boolean }> = JSON.parse(hoursJson);
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const now = new Date();
    const dayName = days[now.getDay()];
    const todayHours = hours[dayName];

    if (!todayHours || todayHours.closed) return { open: false, label: "Closed today" };

    const [openH, openM] = todayHours.open.split(":").map(Number);
    const [closeH, closeM] = todayHours.close.split(":").map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      return { open: true, label: `Open · Closes ${formatTime(todayHours.close)}` };
    }
    if (currentMinutes < openMinutes) {
      return { open: false, label: `Closed · Opens ${formatTime(todayHours.open)}` };
    }
    return { open: false, label: "Closed for today" };
  } catch {
    return { open: false, label: "" };
  }
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export const CATEGORIES = [
  { id: "restaurant", label: "Restaurants", icon: "🍽️", color: "bg-orange-100 text-orange-700" },
  { id: "retail", label: "Retail & Shopping", icon: "🛍️", color: "bg-pink-100 text-pink-700" },
  { id: "health", label: "Health & Wellness", icon: "💪", color: "bg-green-100 text-green-700" },
  { id: "beauty", label: "Beauty & Spa", icon: "💅", color: "bg-purple-100 text-purple-700" },
  { id: "home", label: "Home Services", icon: "🏠", color: "bg-blue-100 text-blue-700" },
  { id: "automotive", label: "Automotive", icon: "🚗", color: "bg-gray-100 text-gray-700" },
  { id: "professional", label: "Professional Services", icon: "💼", color: "bg-indigo-100 text-indigo-700" },
  { id: "education", label: "Education & Tutoring", icon: "📚", color: "bg-yellow-100 text-yellow-700" },
  { id: "fitness", label: "Fitness & Sports", icon: "⚽", color: "bg-red-100 text-red-700" },
  { id: "pet", label: "Pet Services", icon: "🐾", color: "bg-teal-100 text-teal-700" },
  { id: "technology", label: "Technology", icon: "💻", color: "bg-cyan-100 text-cyan-700" },
  { id: "events", label: "Events & Entertainment", icon: "🎉", color: "bg-fuchsia-100 text-fuchsia-700" },
];

export const PRICE_RANGES = [
  { value: "$", label: "$ – Budget-friendly" },
  { value: "$$", label: "$$ – Moderate" },
  { value: "$$$", label: "$$$ – Upscale" },
  { value: "$$$$", label: "$$$$ – Luxury" },
];
