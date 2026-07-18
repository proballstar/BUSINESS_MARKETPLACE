import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rsvpSchema, parseBody } from "@/lib/validation";
import { rateLimit, getClientIp, LIMITS } from "@/lib/rate-limit";
import { tooManyRequests } from "@/lib/api-auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ip = getClientIp(req);
  const rl = rateLimit(`rsvp:${ip}`, LIMITS.rsvp.limit, LIMITS.rsvp.windowMs);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = parseBody(rsvpSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { name, email } = parsed.data;

  const post = await prisma.businessPost.findFirst({
    where: { id: params.id, type: "EVENT", active: true, business: { active: true } },
  });
  if (!post) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (post.eventDate && post.eventDate < new Date()) {
    return NextResponse.json({ error: "This event has already taken place" }, { status: 400 });
  }

  try {
    // Transaction so a duplicate insert never bumps the counter, and
    // capacity is checked against the authoritative row count.
    const result = await prisma.$transaction(async (tx) => {
      if (post.capacity) {
        const count = await tx.postRsvp.count({ where: { postId: params.id } });
        if (count >= post.capacity) return { full: true as const };
      }
      await tx.postRsvp.create({ data: { postId: params.id, name, email } });
      const rsvpCount = await tx.postRsvp.count({ where: { postId: params.id } });
      await tx.businessPost.update({ where: { id: params.id }, data: { rsvpCount } });
      return { full: false as const, rsvpCount };
    });

    if (result.full) {
      return NextResponse.json({ error: "Event is fully booked" }, { status: 409 });
    }
    return NextResponse.json({ success: true, rsvpCount: result.rsvpCount }, { status: 201 });
  } catch {
    // unique(postId, email) violation
    return NextResponse.json({ error: "You already registered for this event" }, { status: 409 });
  }
}
