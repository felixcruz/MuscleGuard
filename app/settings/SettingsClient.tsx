"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

const DIETARY_OPTIONS = [
  { value: "none", label: "No restrictions" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "dairy_free", label: "Dairy-free" },
];

const STATUS_LABELS: Record<string, string> = {
  trial: "Free trial",
  trialing: "Trial (card on file)",
  active: "Active",
  past_due: "Payment past due",
  cancelled: "Cancelled",
};

const COMM_STYLES = [
  { value: "balanced",     label: "Balanced",     desc: "Mix of motivation and facts" },
  { value: "direct",       label: "Direct",       desc: "Short, no-fluff responses" },
  { value: "clinical",     label: "Clinical",     desc: "Data-driven, evidence-based" },
  { value: "supportive",   label: "Supportive",   desc: "Warm and encouraging" },
  { value: "motivational", label: "Motivational", desc: "High-energy, push harder" },
];

type Tab = "general" | "billing";

export function SettingsClient({ userId, email, profile }: Props) {
  const [tab, setTab] = useState<Tab>("general");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [portal, setPortal] = useState(false);

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [commStyle, setCommStyle] = useState(profile.comm_style ?? "balanced");
  const [dietaryPref, setDietaryPref] = useState(profile.dietary_prefs?.[0] ?? "none");
  const [favProteins, setFavProteins] = useState<string[]>(profile.favorite_proteins ?? []);

  const router = useRouter();
  const supabase = createClient();

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
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>
        <p className="text-white/50 mt-1 text-sm">Manage your profile, preferences, and billing.</p>

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
            General
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
            Billing
          </button>
        </div>
      </div>

      {/* ── GENERAL TAB ── */}
      {tab === "general" && (
        <div className="space-y-5">
          {/* Profile */}
          <div className="bg-white border border-black/5 rounded-[10px] p-5 space-y-4">
            <p className="text-[10px] font-medium text-mgray uppercase tracking-widest">Profile</p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-mgray">Name</label>
              <input
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/20 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-mgray">Email</label>
              <div className="px-3 py-2 bg-surface border border-black/5 rounded-lg text-sm text-mgray">
                {email}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {profile.weight_kg && (
                <div className="bg-surface rounded-lg p-3">
                  <p className="text-[10px] text-mgray uppercase tracking-widest">Weight</p>
                  <p className="text-lg font-bold text-obsidian mt-0.5">{profile.weight_kg} kg</p>
                </div>
              )}
              {profile.protein_goal_g && (
                <div className="bg-surface rounded-lg p-3">
                  <p className="text-[10px] text-mgray uppercase tracking-widest">Protein goal</p>
                  <p className="text-lg font-bold text-obsidian mt-0.5">{profile.protein_goal_g}g</p>
                </div>
              )}
            </div>
          </div>

          {/* Communication style */}
          <div className="bg-white border border-black/5 rounded-[10px] p-5 space-y-3">
            <div>
              <p className="text-[10px] font-medium text-mgray uppercase tracking-widest">Communication style</p>
              <p className="text-xs text-mgray mt-1">How the app talks to you across all sections.</p>
            </div>
            <div className="space-y-2">
              {COMM_STYLES.map((s) => {
                const isSelected = commStyle === s.value;
                return (
                  <button
                    key={s.value}
                    onClick={() => setCommStyle(s.value)}
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
                      <span className="font-medium">{s.label}</span>
                    </div>
                    <span className={`text-xs ${isSelected ? "text-white/60" : "text-mgray"}`}>{s.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Food preferences */}
          <div className="bg-white border border-black/5 rounded-[10px] p-5 space-y-3">
            <div>
              <p className="text-[10px] font-medium text-mgray uppercase tracking-widest">Food preferences</p>
              <p className="text-xs text-mgray mt-1">Used to personalize your quick meal suggestions.</p>
            </div>

            <div>
              <p className="text-xs font-medium text-obsidian mb-2">Dietary preference</p>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((opt) => (
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
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-obsidian mb-2">Favorite protein sources</p>
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
            {saving ? "Saving…" : saved ? "✓ Saved!" : "Save changes"}
          </button>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-mgray hover:text-obsidian hover:bg-surface transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}

      {/* ── BILLING TAB ── */}
      {tab === "billing" && (
        <div className="space-y-5">
          {/* Plan status */}
          <div className="bg-white border border-black/5 rounded-[10px] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-medium text-mgray uppercase tracking-widest">Plan</p>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBg}`}>
                {STATUS_LABELS[status] ?? status}
              </span>
            </div>

            {isTrial && trialEnd && (
              <p className="text-xs text-mgray mb-4">Trial ends {trialEnd}</p>
            )}

            {/* Upgrade CTA (non-active users) */}
            {!isActive && (
              <div className="bg-obsidian rounded-[10px] p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-[#CDFF00] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">MuscleGuard Pro</p>
                    <p className="text-sm text-white/50">$14.99/month · Cancel anytime</p>
                    <ul className="text-sm text-white/70 mt-3 space-y-1.5">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-[#CDFF00]" /> Unlimited protein tracking
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-[#CDFF00]" /> Smart meal generation
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-[#CDFF00]" /> Muscle loss alerts
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-[#CDFF00]" /> Personalized training plan
                      </li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="w-full py-2.5 bg-[#CDFF00] text-obsidian text-sm font-medium rounded-lg hover:bg-[#b8e600] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="h-4 w-4" />
                  {upgrading ? "Redirecting…" : "Upgrade to Pro"}
                </button>
              </div>
            )}

            {/* Active plan actions */}
            {isActive && profile.stripe_customer_id && (
              <div className="space-y-3">
                <button
                  onClick={handlePortal}
                  disabled={portal}
                  className="w-full py-2.5 bg-obsidian text-white text-sm font-medium rounded-lg hover:bg-obsidian-light transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="h-4 w-4" />
                  {portal ? "Opening…" : "Manage billing"}
                </button>
                <button
                  onClick={handlePortal}
                  disabled={portal}
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-[#FFB4AB] hover:bg-[#FFB4AB]/10 transition-colors disabled:opacity-50"
                >
                  {portal ? "Opening…" : "Cancel plan"}
                </button>
                <p className="text-xs text-center text-mgray">
                  Cancellation is handled securely via Stripe. Your access continues until the end of the billing period.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
