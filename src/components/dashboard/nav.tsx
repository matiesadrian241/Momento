"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Camera, LogOut, Menu, X, LayoutDashboard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardNavProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function DashboardNav({ user }: DashboardNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Camera className="h-6 w-6" />
            <span className="text-lg font-bold">Momento</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <LayoutDashboard className="h-4 w-4" />
              Events
            </Link>
          </nav>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <span className="text-sm text-gray-500">
            {user.name || user.email}
          </span>
          <Link href="/dashboard/events/new">
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              New Event
            </Button>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-200 px-4 pb-4 pt-2 md:hidden">
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4" />
              Events
            </Link>
            <Link
              href="/dashboard/events/new"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileOpen(false)}
            >
              <Plus className="h-4 w-4" />
              New Event
            </Link>
          </div>
          <div className="mt-4 border-t border-gray-200 pt-4">
            <p className="px-3 text-sm text-gray-500">
              {user.name || user.email}
            </p>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
