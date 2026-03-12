import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events, media } from "@/lib/db/schema";
import { eq, count, sql } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Camera, Calendar, Image as ImageIcon } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  let userEvents: {
    id: string;
    name: string;
    slug: string;
    eventDate: string | null;
    isActive: boolean | null;
    createdAt: Date | null;
    mediaCount: number;
  }[] = [];

  try {
    userEvents = await db
      .select({
        id: events.id,
        name: events.name,
        slug: events.slug,
        eventDate: events.eventDate,
        isActive: events.isActive,
        createdAt: events.createdAt,
        mediaCount: count(media.id),
      })
      .from(events)
      .leftJoin(media, eq(events.id, media.eventId))
      .where(eq(events.userId, session.user.id))
      .groupBy(events.id)
      .orderBy(sql`${events.createdAt} DESC`);
  } catch {
    // DB not connected yet — show empty state
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Events</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage your event photo albums.
          </p>
        </div>
        <Link href="/dashboard/events/new">
          <Button>
            <Plus className="mr-1.5 h-4 w-4" />
            New Event
          </Button>
        </Link>
      </div>

      {userEvents.length === 0 ? (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center text-center">
            <div className="rounded-full bg-gray-100 p-4">
              <Camera className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No events yet
            </h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Create your first event to get a QR code that guests can scan to
              upload photos.
            </p>
            <Link href="/dashboard/events/new" className="mt-6">
              <Button>
                <Plus className="mr-1.5 h-4 w-4" />
                Create Your First Event
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {userEvents.map((event) => (
            <Link key={event.id} href={`/dashboard/events/${event.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900">
                      {event.name}
                    </h3>
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
                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="h-3.5 w-3.5" />
                      {event.mediaCount} photos
                    </span>
                    {event.eventDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(event.eventDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
