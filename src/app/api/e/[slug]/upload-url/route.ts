import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUploadPresignedUrl } from "@/lib/r2";

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
  const { fileName, contentType } = body;

  if (!fileName || !contentType) {
    return NextResponse.json(
      { error: "fileName and contentType are required" },
      { status: 400 }
    );
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "video/mp4",
    "video/quicktime",
  ];

  if (!allowedTypes.includes(contentType)) {
    return NextResponse.json(
      { error: "File type not supported" },
      { status: 400 }
    );
  }

  const { url, key } = await getUploadPresignedUrl(
    event.id,
    fileName,
    contentType
  );

  return NextResponse.json({ url, key });
}
