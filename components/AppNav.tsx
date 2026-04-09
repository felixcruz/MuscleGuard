"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, LayoutDashboard, Sparkles, Dumbbell, TrendingUp, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Today", icon: LayoutDashboard },
  { href: "/meals", label: "Meals", icon: Sparkles },
  { href: "/training", label: "Training", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Top bar (desktop) */}
      <header className="hidden sm:flex items-center justify-between px-6 py-3 border-b bg-white sticky top-0 z-10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-brand-600" />
          <span className="font-semibold text-gray-800">MuscleGuard</span>
        </Link>
        <nav className="flex gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Bottom tab bar (mobile) */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t z-10">
        <div className="flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors",
                  active ? "text-brand-600 font-medium" : "text-gray-400"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
