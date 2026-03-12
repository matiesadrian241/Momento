import Link from "next/link";
import { Camera } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-gray-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link href="/" className="flex items-center gap-2 text-white">
          <Camera className="h-8 w-8" />
          <span className="text-2xl font-bold">Momento</span>
        </Link>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Every moment deserves to be shared.
          </h1>
          <p className="text-lg text-gray-400">
            Create a shared photo album for your event. Guests scan a QR code,
            upload photos instantly — no app needed.
          </p>
        </div>
        <p className="text-sm text-gray-500">
          Trusted by thousands of event organizers worldwide.
        </p>
      </div>

      <div className="flex w-full items-center justify-center px-4 lg:w-1/2">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 flex items-center gap-2 lg:hidden"
          >
            <Camera className="h-7 w-7" />
            <span className="text-xl font-bold">Momento</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
