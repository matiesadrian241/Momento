import Link from "next/link";
import { Camera } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Camera className="h-6 w-6" />
            <span className="text-lg font-bold">Momento</span>
          </Link>
          <div className="flex items-center gap-3">
            {session?.user ? (
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link href="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Camera className="h-4 w-4" />
              <span>Momento — Event photo sharing made simple.</span>
            </div>
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Momento. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
