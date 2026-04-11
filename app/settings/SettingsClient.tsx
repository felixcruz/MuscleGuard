"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CreditCard, LogOut, Shield, User, Receipt } from "lucide-react";

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
  };
}

const STATUS_LABELS: Record<string, string> = {
  trial: "Free trial",
  trialing: "Trial (card on file)",
  active: "Active",
  past_due: "Payment past due",
  cancelled: "Cancelled",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  trial: "secondary",
  trialing: "default",
  active: "default",
  past_due: "destructive",
  cancelled: "outline",
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
    await supabase
      .from("profiles")
      .update({ full_name: fullName || null, comm_style: commStyle })
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

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        <button
          onClick={() => setTab("general")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "general"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <User className="h-4 w-4" />
          General
        </button>
        <button
          onClick={() => setTab("billing")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "billing"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Receipt className="h-4 w-4" />
          Billing
        </button>
      </div>

      {/* ── GENERAL TAB ── */}
      {tab === "general" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm text-gray-500">Name</label>
                <Input
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              {/* Email — read only */}
              <div className="space-y-1.5">
                <label className="text-sm text-gray-500">Email</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500">
                  {email}
                </div>
              </div>
              {profile.weight_kg && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Current weight</span>
                  <span className="font-medium">{profile.weight_kg} kg</span>
                </div>
              )}
              {profile.protein_goal_g && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Daily protein goal</span>
                  <span className="font-medium text-brand-700">{profile.protein_goal_g}g</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Communication style</CardTitle>
              <CardDescription>How the app talks to you across all sections.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
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
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
          </Button>

          <Button variant="ghost" className="w-full text-gray-500" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      )}

      {/* ── BILLING TAB ── */}
      {tab === "billing" && (
        <div className="space-y-6">
          {/* Status card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Plan</CardTitle>
                <Badge variant={STATUS_VARIANTS[status]}>
                  {STATUS_LABELS[status] ?? status}
                </Badge>
              </div>
              {isTrial && trialEnd && (
                <CardDescription>Trial ends {trialEnd}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">

              {/* Upgrade CTA (non-active users) */}
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

              {/* Active plan actions */}
              {isActive && profile.stripe_customer_id && (
                <div className="space-y-2">
                  <Button variant="outline" onClick={handlePortal} disabled={portal} className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    {portal ? "Opening…" : "Manage billing"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handlePortal}
                    disabled={portal}
                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    {portal ? "Opening…" : "Cancel plan"}
                  </Button>
                  <p className="text-xs text-center text-gray-400">
                    Cancellation is handled securely via Stripe. Your access continues until the end of the billing period.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
