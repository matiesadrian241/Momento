import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { createEventSchema } from "@/lib/validations";

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userEvents = await db
    .select()
    .from(events)
    .where(eq(events.userId, session.user.id))
    .orderBy(sql`${events.createdAt} DESC`);

  return NextResponse.json({ events: userEvents });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const slug = generateSlug(parsed.data.name);

  const [event] = await db
    .insert(events)
    .values({
      userId: session.user.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      eventDate: parsed.data.eventDate || null,
      guestsCanView: parsed.data.guestsCanView,
      slug,
    })
    .returning();

  return NextResponse.json({ event }, { status: 201 });
}
