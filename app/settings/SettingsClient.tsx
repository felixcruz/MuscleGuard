"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CreditCard, LogOut, Shield } from "lucide-react";

interface Props {
  userId: string;
  email: string;
  profile: {
    weight_kg?: number;
    target_weight_kg?: number;
    protein_goal_g?: number;
    subscription_status?: string;
    trial_ends_at?: string;
    stripe_customer_id?: string;
    full_name?: string;
    language?: string;
    comm_style?: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  trial: "Free trial",
  active: "Active",
  past_due: "Payment past due",
  cancelled: "Cancelled",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  trial: "secondary",
  active: "default",
  past_due: "destructive",
  cancelled: "outline",
};

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

const COMM_STYLES = [
  { value: "balanced", label: "Balanced", desc: "Mix of motivation and facts" },
  { value: "direct", label: "Direct", desc: "Short, no-fluff responses" },
  { value: "clinical", label: "Clinical", desc: "Data-driven, evidence-based" },
  { value: "supportive", label: "Supportive", desc: "Warm and encouraging" },
  { value: "motivational", label: "Motivational", desc: "High-energy, push harder" },
];

export function SettingsClient({ userId, email, profile }: Props) {
  const [upgrading, setUpgrading] = useState(false);
  const [portal, setPortal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [language, setLanguage] = useState(profile.language ?? "en");
  const [commStyle, setCommStyle] = useState(profile.comm_style ?? "balanced");

  const router = useRouter();
  const supabase = createClient();

  async function handleSavePreferences() {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ full_name: fullName || null, language, comm_style: commStyle })
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

  const status = profile.subscription_status ?? "trial";
  const trialEnd = profile.trial_ends_at
    ? new Date(profile.trial_ends_at).toLocaleDateString()
    : null;
  const isActive = status === "active";
  const isTrial = status === "trial";

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm text-gray-500">Name</label>
            <Input
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          {/* Language */}
          <div className="space-y-1.5">
            <label className="text-sm text-gray-500">Language</label>
            <div className="flex gap-2">
              {LANGUAGES.map((l) => {
                const isDisabled = l.value === "es";
                return (
                  <button
                    key={l.value}
                    onClick={() => !isDisabled && setLanguage(l.value)}
                    disabled={isDisabled}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      isDisabled
                        ? "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"
                        : language === l.value
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {l.label}{isDisabled ? " (soon)" : ""}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Communication style */}
          <div className="space-y-1.5">
            <label className="text-sm text-gray-500">Communication style</label>
            <div className="space-y-2">
              {COMM_STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setCommStyle(s.value)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                    commStyle === s.value
                      ? "bg-brand-50 border-brand-400 text-brand-800"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="font-medium">{s.label}</span>
                  <span className="text-xs text-gray-400">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleSavePreferences} disabled={saving} className="w-full">
            {saving ? "Saving…" : saved ? "Saved!" : "Save preferences"}
          </Button>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="font-medium">{email}</span>
          </div>
          {profile.weight_kg && (
            <div className="flex justify-between">
              <span className="text-gray-500">Current weight</span>
              <span className="font-medium">{profile.weight_kg} kg</span>
            </div>
          )}
          {profile.protein_goal_g && (
            <div className="flex justify-between">
              <span className="text-gray-500">Daily protein goal</span>
              <span className="font-medium text-brand-700">{profile.protein_goal_g}g</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Subscription</CardTitle>
            <Badge variant={STATUS_VARIANTS[status]}>
              {STATUS_LABELS[status] ?? status}
            </Badge>
          </div>
          {isTrial && trialEnd && (
            <CardDescription>Trial ends {trialEnd}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {!isActive && (
            <div className="p-4 bg-brand-50 rounded-lg border border-brand-200 space-y-3">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-brand-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-brand-900">MuscleGuard Pro</p>
                  <p className="text-sm text-brand-700">$14.99/month · Cancel anytime</p>
                  <ul className="text-sm text-brand-700 mt-2 space-y-1">
                    <li>✓ Unlimited protein tracking</li>
                    <li>✓ AI meal generation</li>
                    <li>✓ Muscle loss alerts</li>
                    <li>✓ 3×/week training plan</li>
                  </ul>
                </div>
              </div>
              <Button onClick={handleUpgrade} disabled={upgrading} className="w-full">
                <CreditCard className="h-4 w-4 mr-2" />
                {upgrading ? "Redirecting…" : "Upgrade to Pro"}
              </Button>
            </div>
          )}

          {isActive && profile.stripe_customer_id && (
            <Button variant="outline" onClick={handlePortal} disabled={portal} className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              {portal ? "Opening…" : "Manage billing"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Sign out */}
      <Button variant="ghost" className="w-full text-gray-500" onClick={handleSignOut}>
        <LogOut className="h-4 w-4 mr-2" />
        Sign out
      </Button>
    </div>
  );
}
