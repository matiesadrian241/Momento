import { Metadata } from "next";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { GuestUploadDropzone } from "@/components/upload/guest-upload-dropzone";
import { Camera } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  let event;
  try {
    const { slug } = await params;
    event = await db.query.events.findFirst({
      where: eq(events.slug, slug),
    });
  } catch {
    return { title: "Upload Photos — Momento" };
  }
  return {
    title: event ? `${event.name} — Upload Photos` : "Upload Photos — Momento",
    description: event?.description || "Upload your photos to the shared album",
  };
}

export default async function GuestUploadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let event;
  try {
    event = await db.query.events.findFirst({
      where: eq(events.slug, slug),
    });
  } catch {
    notFound();
  }

  if (!event || !event.isActive) notFound();

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-900">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            {event.name}
          </h1>
          {event.description && (
            <p className="mt-2 text-gray-600">{event.description}</p>
          )}
        </div>

        <div className="mt-8">
          <GuestUploadDropzone slug={slug} />
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          Powered by Momento — Event photo sharing made simple.
        </p>
      </div>
    </main>
  );
}
