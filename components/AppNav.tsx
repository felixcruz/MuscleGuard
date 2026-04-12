"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, LayoutDashboard, Sparkles, Dumbbell, TrendingUp, BarChart2, Settings, Pill } from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV = [
  { href: "/dashboard", label: "Today", icon: LayoutDashboard },
  { href: "/meals", label: "Meals", icon: Sparkles },
  { href: "/training", label: "Training", icon: Dumbbell },
  { href: "/medication", label: "Medication", icon: Pill },
  { href: "/progress", label: "Progress", icon: TrendingUp },
];

const DESKTOP_NAV = [
  ...MOBILE_NAV,
  { href: "/reports", label: "Reports", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Top bar (desktop) */}
      <header className="hidden sm:flex items-center justify-between px-6 py-3 border-b border-black/5 bg-white/90 backdrop-blur-md sticky top-0 z-10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-obsidian" />
          <span className="font-semibold tracking-tight text-obsidian">MuscleGuard</span>
        </Link>
        <nav className="flex gap-1">
          {DESKTOP_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                  active
                    ? "bg-surface text-obsidian font-medium"
                    : "text-mgray hover:text-obsidian hover:bg-surface"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Bottom tab bar (mobile) — 5 tabs */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-black/5 z-10">
        <div className="flex">
          {MOBILE_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors",
                  active ? "text-obsidian font-medium" : "text-muted"
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
