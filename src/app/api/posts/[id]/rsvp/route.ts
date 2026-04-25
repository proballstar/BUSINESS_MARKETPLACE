import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { name, email } = await req.json();
  if (!name || !email) return NextResponse.json({ error: "Name and email required" }, { status: 400 });

  const post = await prisma.businessPost.findUnique({ where: { id: params.id } });
  if (!post || post.type !== "EVENT") return NextResponse.json({ error: "Event not found" }, { status: 404 });

  if (post.capacity) {
    const count = await prisma.postRsvp.count({ where: { postId: params.id } });
    if (count >= post.capacity) return NextResponse.json({ error: "Event is fully booked" }, { status: 409 });
  }

  try {
    const rsvp = await prisma.postRsvp.create({
      data: { postId: params.id, name, email },
    });
    await prisma.businessPost.update({
      where: { id: params.id },
      data: { rsvpCount: { increment: 1 } },
    });
    return NextResponse.json(rsvp, { status: 201 });
  } catch {
    return NextResponse.json({ error: "You already registered for this event" }, { status: 409 });
  }
}
