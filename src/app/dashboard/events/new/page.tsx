import { Metadata } from "next";
import { CreateEventForm } from "./create-event-form";

export const metadata: Metadata = {
  title: "Create Event — Momento",
  description: "Create a new event photo album",
};

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
        <p className="mt-1 text-sm text-gray-500">
          Set up a photo album for your event. You&apos;ll get a QR code to share
          with guests.
        </p>
      </div>
      <CreateEventForm />
    </div>
  );
}
