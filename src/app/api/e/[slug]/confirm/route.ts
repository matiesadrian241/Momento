import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, media } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const event = await db.query.events.findFirst({
    where: eq(events.slug, slug),
  });

  if (!event || !event.isActive) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const body = await request.json();
  const { key, fileName, contentType, fileSize, guestName } = body;

  if (!key || !fileName || !contentType || !fileSize) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const [newMedia] = await db
    .insert(media)
    .values({
      eventId: event.id,
      originalKey: key,
      fileName,
      mimeType: contentType,
      fileSize,
      guestName: guestName || null,
    })
    .returning();

  return NextResponse.json({ media: newMedia }, { status: 201 });
}
