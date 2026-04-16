"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter as useIntlRouter, usePathname as useIntlPathname } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { CreditCard, LogOut, Shield, User, Receipt, Settings, Check } from "lucide-react";

interface Props {
  userId: string;
  email: string;
  profile: {
    weight_kg?: number;
    protein_goal_g?: number;
    subscription_status?: string;
    trial_ends_at?: string;
    stripe_customer_id?: string;
    full_name?: string;
    language?: string;
    comm_style?: string;
    dietary_prefs?: string[];
    favorite_proteins?: string[];
    gender?: string;
  };
}

const PROTEIN_SOURCES = [
  { id: "chicken", label: "Chicken", emoji: "🍗" },
  { id: "eggs", label: "Eggs", emoji: "🥚" },
  { id: "greek_yogurt", label: "Greek yogurt", emoji: "🥛" },
  { id: "cottage_cheese", label: "Cottage cheese", emoji: "🧀" },
  { id: "protein_shake", label: "Protein shake", emoji: "🥤" },
  { id: "tuna", label: "Tuna", emoji: "🐟" },
  { id: "salmon", label: "Salmon", emoji: "🐠" },
  { id: "turkey", label: "Turkey", emoji: "🦃" },
  { id: "beef", label: "Beef", emoji: "🥩" },
  { id: "shrimp", label: "Shrimp", emoji: "🦐" },
  { id: "tofu", label: "Tofu", emoji: "🫘" },
  { id: "edamame", label: "Edamame", emoji: "🌱" },
  { id: "protein_bar", label: "Protein bar", emoji: "🍫" },
  { id: "lentils", label: "Lentils", emoji: "🫘" },
];

type Tab = "general" | "billing";

export function SettingsClient({ userId, email, profile }: Props) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const td = useTranslations("dashboard");
  const [tab, setTab] = useState<Tab>("general");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [portal, setPortal] = useState(false);

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [gender, setGender] = useState(profile.gender ?? "");
  const [commStyle, setCommStyle] = useState(profile.comm_style ?? "balanced");
  const [dietaryPref, setDietaryPref] = useState(profile.dietary_prefs?.[0] ?? "none");
  const [favProteins, setFavProteins] = useState<string[]>(profile.favorite_proteins ?? []);

  const router = useRouter();
  const locale = useLocale();
  const intlRouter = useIntlRouter();
  const intlPathname = useIntlPathname();
  const supabase = createClient();

  function switchLanguage(newLocale: string) {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    intlRouter.replace(intlPathname, { locale: newLocale as "en" | "es" });
  }

  const status = profile.subscription_status ?? "trial";
  const trialEnd = profile.trial_ends_at
    ? new Date(profile.trial_ends_at).toLocaleDateString()
    : null;
  const isActive = status === "active" || status === "trialing";
  const isTrial = status === "trial";

  async function handleSave() {
    setSaving(true);
    const prefs = dietaryPref && dietaryPref !== "none" ? [dietaryPref] : [];
    await supabase
      .from("profiles")
      .update({
        full_name: fullName || null,
        gender: gender || null,
        comm_style: commStyle,
        dietary_prefs: prefs,
        favorite_proteins: favProteins.length > 0 ? favProteins : null,
      })
      .eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleUpgrade() {
    setUpgrading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setUpgrading(false);
  }

  async function handlePortal() {
    setPortal(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setPortal(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }

  const statusBg =
    status === "active" || status === "trialing" ? "bg-[#CDFF00] text-obsidian" :
    status === "past_due" ? "bg-[#FFB4AB] text-obsidian" :
    status === "cancelled" ? "bg-surface text-mgray" :
    "bg-surface text-mgray";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

      {/* ── Hero Card (dark) ── */}
      <div className="bg-obsidian rounded-[14px] p-6">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-[#CDFF00]" />
          <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
        </div>
        <p className="text-white/50 mt-1 text-sm">{t("subtitle")}</p>

        {/* Tab switcher */}
        <div className="flex gap-2 mt-5 pt-4 border-t border-white/5">
          <button
            onClick={() => setTab("general")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === "general"
                ? "bg-white text-obsidian"
                : "bg-white/10 text-white/60 hover:bg-white/15"
            }`}
          >
            <User className="h-4 w-4" />
            {t("general")}
          </button>
          <button
            onClick={() => setTab("billing")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === "billing"
                ? "bg-white text-obsidian"
                : "bg-white/10 text-white/60 hover:bg-white/15"
            }`}
          >
            <Receipt className="h-4 w-4" />
            {t("billing")}
          </button>
        </div>
      </div>

      {/* ── GENERAL TAB ── */}
      {tab === "general" && (
        <div className="space-y-5">
          {/* Profile */}
          <div className="bg-white border border-black/5 rounded-[10px] p-5 space-y-4">
            <p className="text-[10px] font-medium text-mgray uppercase tracking-widest">{t("profile")}</p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-mgray">{t("name")}</label>
              <input
                placeholder={t("namePlaceholder")}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/20 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-mgray block mb-2">{t("gender")}</label>
              <div className="flex gap-2">
                {[
                  { value: "male", label: t("male") },
                  { value: "female", label: t("female") },
                  { value: "other", label: t("other") },
                  { value: "prefer_not", label: t("preferNotToSay") },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGender(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      gender === opt.value
                        ? "border-obsidian bg-obsidian text-white font-medium"
                        : "border-black/5 bg-white text-mgray hover:border-black/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-mgray">{t("emailLabel")}</label>
              <div className="px-3 py-2 bg-surface border border-black/5 rounded-lg text-sm text-mgray">
                {email}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {profile.weight_kg && (
                <div className="bg-surface rounded-lg p-3">
                  <p className="text-[10px] text-mgray uppercase tracking-widest">{t("weightLabel")}</p>
                  <p className="text-lg font-bold text-obsidian mt-0.5">{profile.weight_kg} kg</p>
                </div>
              )}
              {profile.protein_goal_g && (
                <div className="bg-surface rounded-lg p-3">
                  <p className="text-[10px] text-mgray uppercase tracking-widest">{t("proteinGoalLabel")}</p>
                  <p className="text-lg font-bold text-obsidian mt-0.5">{profile.protein_goal_g}g</p>
                </div>
              )}
            </div>
          </div>

          {/* Communication style */}
          <div className="bg-white border border-black/5 rounded-[10px] p-5 space-y-3">
            <div>
              <p className="text-[10px] font-medium text-mgray uppercase tracking-widest">{t("commStyle")}</p>
              <p className="text-xs text-mgray mt-1">{t("commStyleDesc")}</p>
            </div>
            <div className="space-y-2">
              {(["balanced", "direct", "clinical", "supportive", "motivational"] as const).map((value) => {
                const isSelected = commStyle === value;
                return (
                  <button
                    key={value}
                    onClick={() => setCommStyle(value)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-[10px] border text-sm transition-colors ${
                      isSelected
                        ? "border-obsidian bg-obsidian text-white"
                        : "border-black/5 bg-white text-mgray hover:border-black/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-[#CDFF00] flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-obsidian" />
                        </div>
                      )}
                      <span className="font-medium">{t(value)}</span>
                    </div>
                    <span className={`text-xs ${isSelected ? "text-white/60" : "text-mgray"}`}>{t(`${value}Desc`)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Food preferences */}
          <div className="bg-white border border-black/5 rounded-[10px] p-5 space-y-3">
            <div>
              <p className="text-[10px] font-medium text-mgray uppercase tracking-widest">{t("foodPreferences")}</p>
              <p className="text-xs text-mgray mt-1">{t("foodPreferencesDesc")}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-obsidian mb-2">{t("dietaryPreference")}</p>
              <div className="flex flex-wrap gap-2">
                {([
                  { value: "none", labelKey: "noRestrictions" as const },
                  { value: "vegetarian", labelKey: "vegetarian" as const },
                  { value: "vegan", labelKey: "vegan" as const },
                  { value: "pescatarian", labelKey: "pescatarian" as const },
                  { value: "dairy_free", labelKey: "dairyFree" as const },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDietaryPref(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      dietaryPref === opt.value
                        ? "border-obsidian bg-obsidian text-white font-medium"
                        : "border-black/5 bg-white text-mgray hover:border-black/10"
                    }`}
                  >
                    {td(opt.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-obsidian mb-2">{t("favoriteProteinSources")}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PROTEIN_SOURCES.map((src) => {
                  const selected = favProteins.includes(src.id);
                  return (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() => setFavProteins(prev =>
                        selected ? prev.filter(f => f !== src.id) : [...prev, src.id]
                      )}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-colors ${
                        selected
                          ? "border-obsidian bg-obsidian text-white font-medium"
                          : "border-black/5 bg-white text-mgray hover:border-black/10"
                      }`}
                    >
                      <span>{src.emoji}</span>
                      {src.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Language */}
          <div className="bg-white border border-black/5 rounded-[10px] p-5 space-y-3">
            <div>
              <p className="text-[10px] font-medium text-mgray uppercase tracking-widest">{t("language")}</p>
            </div>
            <div className="flex gap-2">
              {[
                { value: "en", label: t("english") },
                { value: "es", label: t("spanish") },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => switchLanguage(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    locale === opt.value
                      ? "border-obsidian bg-obsidian text-white font-medium"
                      : "border-black/5 bg-white text-mgray hover:border-black/10"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              saved
                ? "bg-[#CDFF00] text-obsidian"
                : "bg-obsidian text-white hover:bg-obsidian-light"
            }`}
          >
            {saving ? tc("saving") : saved ? `✓ ${tc("saved")}` : tc("save")}
          </button>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-mgray hover:text-obsidian hover:bg-surface transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            {tc("signOut")}
          </button>
        </div>
      )}

      {/* ── BILLING TAB ── */}
      {tab === "billing" && (
        <div className="space-y-5">
          {/* Plan status */}
          <div className="bg-white border border-black/5 rounded-[10px] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-medium text-mgray uppercase tracking-widest">{t("plan")}</p>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBg}`}>
                {status === "trial" ? t("freeTrial") :
                 status === "trialing" ? t("trialCardOnFile") :
                 status === "active" ? t("active") :
                 status === "past_due" ? t("paymentPastDue") :
                 status === "cancelled" ? t("cancelled") : status}
              </span>
            </div>

            {isTrial && trialEnd && (
              <p className="text-xs text-mgray mb-4">{t("trialEnds", { date: trialEnd })}</p>
            )}

            {/* Plan details */}
            {isActive && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-mgray">{t("plan")}</span>
                  <span className="font-medium text-obsidian">MuscleGuard Pro</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-mgray">{t("price")}</span>
                  <span className="font-medium text-obsidian">$14.99/month</span>
                </div>

                {profile.stripe_customer_id && (
                  <>
                    <div className="pt-2 border-t border-black/5">
                      <button
                        onClick={handlePortal}
                        disabled={portal}
                        className="w-full py-2.5 bg-obsidian text-white text-sm font-medium rounded-lg hover:bg-obsidian-light transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <CreditCard className="h-4 w-4" />
                        {portal ? t("opening") : t("manageBilling")}
                      </button>
                    </div>
                    <button
                      onClick={handlePortal}
                      disabled={portal}
                      className="text-xs text-muted hover:text-[#FFB4AB] transition-colors w-full text-center"
                    >
                      {portal ? t("opening") : t("cancelMembership")}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
