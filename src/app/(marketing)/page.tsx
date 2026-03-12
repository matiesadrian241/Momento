import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Camera,
  QrCode,
  Upload,
  Download,
  Shield,
  Zap,
  Users,
} from "lucide-react";

export default function HomePage() {
  return (
    <>
      <section className="px-4 py-20 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-1.5 text-sm text-gray-600">
            <Camera className="h-4 w-4" />
            No app download required
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Collect every photo from
            <br />
            <span className="text-gray-400">your event in one place</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Create a shared photo album, share a QR code with your guests, and
            they can instantly upload photos from their phones. No app needed, no
            accounts required.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button size="lg" className="text-base">
                Create Your Event — Free
              </Button>
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              See how it works &darr;
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-gray-50 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            How it works
          </h2>
          <p className="mt-2 text-center text-gray-500">
            Three simple steps to collect all your event photos.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: QrCode,
                step: "1",
                title: "Create & Share",
                description:
                  "Create your event in seconds and get a unique QR code to display at your venue.",
              },
              {
                icon: Upload,
                step: "2",
                title: "Guests Upload",
                description:
                  "Guests scan the QR code and upload photos directly from their phone. No app needed.",
              },
              {
                icon: Download,
                step: "3",
                title: "Download All",
                description:
                  "Download every photo in original quality with one click after the event.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl bg-white p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-medium text-gray-400">
                  Step {item.step}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Everything you need
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: QrCode,
                title: "QR Code Sharing",
                description:
                  "Generate a unique QR code for each event. Print it, display it, or share the link.",
              },
              {
                icon: Shield,
                title: "Privacy Controls",
                description:
                  "Choose whether guests can see each other's photos or keep uploads private.",
              },
              {
                icon: Zap,
                title: "Original Quality",
                description:
                  "Photos are stored in original resolution. No compression, no quality loss.",
              },
              {
                icon: Users,
                title: "Unlimited Guests",
                description:
                  "No limit on how many guests can upload. Everyone at the event can participate.",
              },
              {
                icon: Download,
                title: "One-Click Download",
                description:
                  "Download all photos as a single ZIP file. No clicking through one by one.",
              },
              {
                icon: Camera,
                title: "No App Required",
                description:
                  "Guests just scan and upload. Works in any mobile browser, nothing to install.",
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl border border-gray-200 p-5">
                <feature.icon className="h-5 w-5 text-gray-700" />
                <h3 className="mt-3 font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-900 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to capture every moment?
          </h2>
          <p className="mt-4 text-gray-400">
            Create your first event in under a minute. Free to get started.
          </p>
          <Link href="/register" className="mt-8 inline-block">
            <Button
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100"
            >
              Get Started — It&apos;s Free
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
