import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Calendar, MapPin, Users, Clock, BadgeCheck, ArrowRight, Ticket } from "lucide-react";
import { CATEGORIES } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface EventPost {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  eventDate: Date | null;
  eventEndDate: Date | null;
  eventLocation: string | null;
  capacity: number | null;
  rsvpCount: number;
  rsvpUrl: string | null;
  createdAt: Date;
  business: {
    name: string;
    slug: string;
    city: string;
    state: string;
    category: string;
    images: string;
    verified: boolean;
  };
}

async function getUpcomingEvents(): Promise<EventPost[]> {
  const posts = await prisma.businessPost.findMany({
    where: {
      type: "EVENT",
      active: true,
      OR: [{ eventDate: null }, { eventDate: { gte: new Date() } }],
    },
    include: {
      business: { select: { name: true, slug: true, city: true, state: true, category: true, images: true, verified: true } },
    },
    orderBy: { eventDate: "asc" },
    take: 40,
  });
  return posts as unknown as EventPost[];
}

function formatEventDate(date: Date | null, endDate: Date | null): string {
  if (!date) return "Date TBD";
  const d = new Date(date);
  const dateStr = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (endDate) {
    const e = new Date(endDate);
    const endTime = e.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${dateStr} · ${timeStr} – ${endTime}`;
  }
  return `${dateStr} · ${timeStr}`;
}

function isThisWeek(date: Date | null): boolean {
  if (!date) return false;
  const now = Date.now();
  const diff = new Date(date).getTime() - now;
  return diff > 0 && diff < 7 * 86400000;
}

export default async function EventsPage() {
  const events = await getUpcomingEvents();
  const thisWeek = events.filter((e) => isThisWeek(e.eventDate));
  const upcoming = events.filter((e) => !isThisWeek(e.eventDate));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-extrabold">Community Events</h1>
          </div>
          <p className="text-violet-100 text-lg max-w-xl">
            Workshops, tastings, pop-ups, classes, and local gatherings — the kind of intimate events you only find at small businesses.
          </p>
          <p className="mt-2 text-violet-200 text-sm">{events.length} upcoming events</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <p className="text-4xl mb-3">📅</p>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming events</h3>
            <p className="text-gray-500 text-sm mb-4">Local businesses haven&apos;t posted events yet.</p>
            <Link href="/auth/signup?role=business" className="text-brand-600 font-medium text-sm hover:underline">
              Host an event →
            </Link>
          </div>
        ) : (
          <>
            {thisWeek.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Happening This Week
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {thisWeek.map((event) => <EventCard key={event.id} event={event} highlighted />)}
                </div>
              </div>
            )}

            {upcoming.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Coming Up</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {upcoming.map((event) => <EventCard key={event.id} event={event} />)}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-12 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Hosting an event?</h3>
          <p className="text-violet-100 mb-6 max-w-lg mx-auto">
            Add your workshop, class, tasting, or pop-up in minutes. Get RSVPs directly and build a local following.
          </p>
          <Link href="/auth/signup?role=business" className="inline-flex items-center gap-2 bg-white text-violet-700 font-bold px-6 py-3 rounded-xl hover:bg-violet-50 transition-colors">
            <Ticket className="w-5 h-5" /> List Your Event Free
          </Link>
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, highlighted = false }: { event: EventPost; highlighted?: boolean }) {
  const images: string[] = JSON.parse(event.business.images || "[]");
  const coverImg = event.imageUrl || images[0] || null;
  const category = CATEGORIES.find((c) => c.id === event.business.category);
  const spotsLeft = event.capacity ? event.capacity - event.rsvpCount : null;
  const soldOut = spotsLeft !== null && spotsLeft <= 0;

  return (
    <div className={`bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all group ${highlighted ? "border-violet-200" : "border-gray-200"}`}>
      <div className="relative h-44 bg-gradient-to-br from-violet-100 to-indigo-100 overflow-hidden">
        {coverImg ? (
          <Image src={coverImg} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">🎉</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Date chip */}
        {event.eventDate && (
          <div className="absolute top-3 left-3 bg-white rounded-xl overflow-hidden shadow-md text-center w-12">
            <div className="bg-violet-600 text-white text-xs font-bold py-0.5">
              {new Date(event.eventDate).toLocaleString("en-US", { month: "short" }).toUpperCase()}
            </div>
            <div className="text-gray-900 font-extrabold text-lg leading-tight pb-1">
              {new Date(event.eventDate).getDate()}
            </div>
          </div>
        )}

        {soldOut && (
          <div className="absolute top-3 right-3 bg-gray-800/80 text-white text-xs font-bold px-2 py-1 rounded-full">
            Sold Out
          </div>
        )}
        {!soldOut && spotsLeft !== null && spotsLeft <= 5 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
            {spotsLeft} spots left!
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-1">{event.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{event.content}</p>

        <div className="space-y-1.5 mb-3">
          {event.eventDate && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
              {formatEventDate(event.eventDate, event.eventEndDate)}
            </div>
          )}
          {event.eventLocation && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
              {event.eventLocation}
            </div>
          )}
          {event.capacity && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
              {event.rsvpCount} / {event.capacity} attending
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 gap-2">
          <Link href={`/businesses/${event.business.slug}`} className="flex items-center gap-1.5 min-w-0 group/biz hover:text-brand-600 transition-colors">
            <div className="relative w-6 h-6 rounded overflow-hidden bg-gray-100 flex-shrink-0">
              {images[0] ? <Image src={images[0]} alt={event.business.name} fill className="object-cover" /> : <span className="text-xs flex items-center justify-center w-full h-full">🏪</span>}
            </div>
            <span className="text-xs font-medium text-gray-700 truncate group-hover/biz:text-brand-600">{event.business.name}</span>
            {event.business.verified && <BadgeCheck className="w-3 h-3 text-brand-500 flex-shrink-0" />}
          </Link>
          <Link href={`/businesses/${event.business.slug}`} className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${soldOut ? "bg-gray-100 text-gray-400" : "bg-violet-600 text-white hover:bg-violet-700"}`}>
            {soldOut ? "View" : "RSVP →"}
          </Link>
        </div>
      </div>
    </div>
  );
}
