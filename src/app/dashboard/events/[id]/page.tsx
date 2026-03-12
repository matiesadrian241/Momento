import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events, media } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventQRCode } from "@/components/dashboard/event-qr-code";
import {
  Image as ImageIcon,
  Calendar,
  ExternalLink,
  ArrowLeft,
  Download,
} from "lucide-react";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  let event;
  let mediaCount = 0;

  try {
    event = await db.query.events.findFirst({
      where: and(eq(events.id, id), eq(events.userId, session.user.id)),
    });

    if (!event) notFound();

    const [result] = await db
      .select({ count: count() })
      .from(media)
      .where(eq(media.eventId, id));
    mediaCount = result?.count ?? 0;
  } catch {
    notFound();
  }

  const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/e/${event.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
              {event.description && (
                <p className="mt-1 text-gray-500">{event.description}</p>
              )}
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <ImageIcon className="h-4 w-4" />
                  {mediaCount} photos
                </span>
                {event.eventDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(event.eventDate).toLocaleDateString()}
                  </span>
                )}
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    event.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {event.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Photo Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              {mediaCount === 0 ? (
                <div className="py-8 text-center">
                  <ImageIcon className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">
                    No photos uploaded yet. Share the QR code with your guests to
                    get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    {mediaCount} photo{mediaCount !== 1 ? "s" : ""} uploaded by
                    guests.
                  </p>
                  <Button variant="secondary">
                    <Download className="mr-1.5 h-4 w-4" />
                    Download All ({mediaCount})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="w-full shrink-0 space-y-4 lg:w-80">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Share with Guests</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <EventQRCode url={uploadUrl} />
              <div className="w-full rounded-lg bg-gray-50 p-3">
                <p className="break-all text-center text-xs text-gray-500">
                  {uploadUrl}
                </p>
              </div>
              <a
                href={uploadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open upload page
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Guests can view photos</span>
                <span className="font-medium">
                  {event.guestsCanView ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="font-medium">
                  {event.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
