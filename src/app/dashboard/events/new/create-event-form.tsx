"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { createEventSchema, type CreateEventInput } from "@/lib/validations";

export function CreateEventForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CreateEventInput, string>>
  >({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      eventDate: (formData.get("eventDate") as string) || undefined,
      guestsCanView: formData.get("guestsCanView") === "on",
    };

    const parsed = createEventSchema.safeParse(data);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        name: errors.name?.[0],
        description: errors.description?.[0],
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Failed to create event.");
        return;
      }

      const { event } = await res.json();
      router.push(`/dashboard/events/${event.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <Input
            id="name"
            name="name"
            label="Event Name"
            placeholder="Sarah & Tom's Wedding"
            error={fieldErrors.name}
          />

          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Share photos from our special day!"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <Input
            id="eventDate"
            name="eventDate"
            type="date"
            label="Event Date (optional)"
          />

          <div className="flex items-center gap-2">
            <input
              id="guestsCanView"
              name="guestsCanView"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <label
              htmlFor="guestsCanView"
              className="text-sm text-gray-700"
            >
              Allow guests to view all uploaded photos
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" size="lg" isLoading={isLoading}>
              Create Event
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
