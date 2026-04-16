"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTransition } from "react";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale() {
    const nextLocale = locale === "en" ? "es" : "en";
    startTransition(() => {
      document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=31536000`;
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <button
      onClick={switchLocale}
      disabled={isPending}
      className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-mgray hover:text-obsidian hover:bg-surface transition-colors disabled:opacity-50"
      aria-label="Switch language"
    >
      <Globe className="h-3.5 w-3.5" />
      {locale === "en" ? "ES" : "EN"}
    </button>
  );
}
