"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";

interface Payment {
  amount: number;
  currency: string;
  date: string;
  status: string;
}

/**
 * Shape of the profile row joined with the auth user, as assembled in page.tsx.
 * Only the fields this view reads are listed; the row carries more.
 */
interface UserProfile {
  id: string;
  email: string;
  auth_created_at: string | null;
  full_name: string | null;
  role: string;
  subscription_status: string | null;
  cancel_at_period_end: boolean | null;
  subscription_period_end: string | null;
  trial_ends_at: string | null;
  protein_goal_g: number | null;
  glp1_medication: string | null;
  workout_streak_days: number;
  protein_streak_days: number;
  onboarding_done: boolean | null;
  stripe_customer_id: string | null;
}

interface FoodLog {
  id: string;
  food_name: string | null;
  protein_g: number | null;
  calories: number | null;
  log_date: string | null;
  meal_type: string | null;
}

interface WorkoutLog {
  id: string;
  workout_day: string | null;
  week_key: string | null;
  completed_at: string | null;
}

interface MedicationLog {
  id: string;
  dose_mg: number | null;
  change_date: string | null;
  change_type: string | null;
  appetite_level: string | null;
  created_at: string | null;
}

interface ActivityLog {
  id: string;
  action: string | null;
  changed_fields: Record<string, { old: string; new: string }> | null;
  created_at: string | null;
}

interface UserDetailProps {
  user: UserProfile;
  foodLogs: FoodLog[];
  workoutLogs: WorkoutLog[];
  medicationLogs: MedicationLog[];
  activityLogs: ActivityLog[];
  payments: Payment[];
  isSuperAdmin: boolean;
}

export default function UserDetailClient({
  user,
  foodLogs,
  workoutLogs,
  medicationLogs,
  activityLogs,
  payments,
  isSuperAdmin,
}: UserDetailProps) {
  const router = useRouter();
  const [role, setRole] = useState(user.role ?? "user");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleUpdateRole() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setMessage("Role updated successfully");
    } else {
      const data = await res.json();
      setMessage(data.error || "Failed to update");
    }
    setSaving(false);
  }

  async function handleResetOnboarding() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarding_done: false }),
    });
    if (res.ok) {
      setMessage("Onboarding reset");
    } else {
      const data = await res.json();
      setMessage(data.error || "Failed to reset onboarding");
    }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/admin/users");
    } else {
      const data = await res.json();
      setMessage(data.error || "Failed to delete user");
      setDeleting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm text-mgray hover:text-obsidian transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Link>
      </div>

      <div className="bg-obsidian rounded-[14px] p-6 mb-6">
        <h1 className="text-lg font-medium text-white">
          {user.email || "User"}
        </h1>
        <p className="text-sm text-white/60 mt-1">
          {user.full_name || "No name"} / {user.role} /{" "}
          {user.subscription_status || "none"}
        </p>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-lime/10 border border-lime/20 rounded-lg text-obsidian text-sm">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Profile info */}
        <div className="bg-white rounded-[10px] border border-black/5 p-5">
          <h3 className="text-sm font-medium text-obsidian mb-3">Profile</h3>
          <div className="space-y-2 text-sm">
            <InfoRow label="ID" value={user.id} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Name" value={user.full_name || "-"} />
            <InfoRow label="Role" value={user.role} />
            <InfoRow
              label="Subscription"
              value={user.subscription_status || "none"}
            />
            {user.cancel_at_period_end ? (
              <InfoRow
                label="Cancels at"
                value={fullDate(user.subscription_period_end) ?? "End of period"}
              />
            ) : null}
            {user.subscription_period_end && !user.cancel_at_period_end ? (
              <InfoRow
                label="Renews on"
                value={fullDate(user.subscription_period_end) ?? "-"}
              />
            ) : null}
            {user.trial_ends_at && user.subscription_status === "trialing" ? (
              <InfoRow
                label="Trial ends"
                value={fullDate(user.trial_ends_at) ?? "-"}
              />
            ) : null}
            <InfoRow
              label="Protein Goal"
              value={user.protein_goal_g ? `${user.protein_goal_g}g` : "-"}
            />
            <InfoRow
              label="GLP-1 Medication"
              value={user.glp1_medication || "-"}
            />
            <InfoRow
              label="Workout Streak"
              value={`${user.workout_streak_days ?? 0} days`}
            />
            <InfoRow
              label="Protein Streak"
              value={`${user.protein_streak_days ?? 0} days`}
            />
            <InfoRow
              label="Onboarding"
              value={user.onboarding_done ? "Complete" : "Incomplete"}
            />
            <InfoRow label="Joined" value={fullDate(user.auth_created_at) ?? "-"} />
          </div>
        </div>

        {/* Actions (super_admin only) */}
        {isSuperAdmin && (
          <div className="bg-white rounded-[10px] border border-black/5 p-5">
            <h3 className="text-sm font-medium text-obsidian mb-3">Actions</h3>
            <div className="space-y-4">
              {/* Change role */}
              <div>
                <label className="text-xs font-medium text-mgray">
                  Change Role
                </label>
                <div className="flex gap-2 mt-1">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-lg border border-black/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/10"
                  >
                    <option value="user">user</option>
                    <option value="support">support</option>
                    <option value="admin">admin</option>
                    <option value="super_admin">super_admin</option>
                  </select>
                  <button
                    onClick={handleUpdateRole}
                    disabled={saving}
                    className="h-9 px-4 bg-obsidian text-white rounded-lg text-sm font-medium hover:bg-obsidian-light disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {saving && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    Save
                  </button>
                </div>
              </div>

              {/* Grant free access */}
              <div>
                <label className="text-xs font-medium text-mgray">
                  Free Access
                </label>
                <button
                  onClick={async () => {
                    setSaving(true);
                    setMessage(null);
                    const res = await fetch(`/api/admin/users/${user.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ subscription_status: "active" }),
                    });
                    setMessage(res.ok ? "Free access granted" : "Failed to grant access");
                    setSaving(false);
                  }}
                  disabled={saving || user.subscription_status === "active"}
                  className="mt-1 h-9 px-4 bg-[#CDFF00] text-obsidian rounded-lg text-sm font-medium hover:bg-[#b8e600] transition-colors disabled:opacity-50 w-full"
                >
                  {user.subscription_status === "active" ? "Already active" : "Grant free access"}
                </button>
              </div>

              {/* Reset onboarding */}
              <div>
                <label className="text-xs font-medium text-mgray">
                  Reset Onboarding
                </label>
                <button
                  onClick={handleResetOnboarding}
                  disabled={saving}
                  className="mt-1 h-9 px-4 bg-white border border-black/10 text-obsidian rounded-lg text-sm font-medium hover:bg-surface transition-colors disabled:opacity-50 w-full"
                >
                  Reset Onboarding Flow
                </button>
              </div>

              {/* Delete user */}
              <div className="pt-3 border-t border-black/5">
                <label className="text-xs font-medium text-alert">
                  Danger Zone
                </label>
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="mt-1 h-9 px-4 bg-alert/10 border border-alert/20 text-red-700 rounded-lg text-sm font-medium hover:bg-alert/20 transition-colors w-full flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete User
                  </button>
                ) : (
                  <div className="mt-1 space-y-2">
                    <p className="text-xs text-red-700">
                      This will permanently delete the user and all their data.
                      Are you sure?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 h-9 px-4 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {deleting && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 h-9 px-4 bg-white border border-black/10 text-obsidian rounded-lg text-sm font-medium hover:bg-surface transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Food logs */}
        <LogTable
          title={`Recent Food Logs (${foodLogs.length})`}
          columns={["Date", "Meal", "Food", "Protein", "Cal"]}
          rows={foodLogs.map((l) => [
            dayDate(l.log_date) ?? "-",
            l.meal_type ?? "-",
            l.food_name || "-",
            l.protein_g ? `${l.protein_g}g` : "-",
            l.calories ? `${l.calories}` : "-",
          ])}
        />

        {/* Workout logs */}
        <LogTable
          title={`Recent Workouts (${workoutLogs.length})`}
          columns={["Date", "Session", "Week"]}
          rows={workoutLogs.map((l) => [
            shortDate(l.completed_at) ?? "-",
            l.workout_day || "-",
            l.week_key || "-",
          ])}
        />

        {/* Medication logs */}
        <LogTable
          title={`Recent Medications (${medicationLogs.length})`}
          columns={["Date", "Type", "Dose", "Appetite"]}
          rows={medicationLogs.map((l) => [
            dayDate(l.change_date) ?? shortDate(l.created_at) ?? "-",
            (l.change_type ?? "-").replace("_", " "),
            l.dose_mg ? `${l.dose_mg}mg` : "-",
            (l.appetite_level ?? "-").replace("_", " "),
          ])}
        />
      </div>

      {/* Activity & Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Activity history */}
        <div className="bg-white rounded-[10px] border border-black/5 p-5">
          <h3 className="text-sm font-medium text-obsidian mb-3">
            Activity History ({activityLogs.length})
          </h3>
          {activityLogs.length === 0 ? (
            <p className="text-sm text-mgray">No activity recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-black/5">
                    <th className="text-left px-2 py-2 font-medium text-mgray">Date</th>
                    <th className="text-left px-2 py-2 font-medium text-mgray">Action</th>
                    <th className="text-left px-2 py-2 font-medium text-mgray">Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.map((log) => {
                    const fields = log.changed_fields;
                    const fieldNames = fields ? Object.keys(fields) : [];
                    return (
                      <tr key={log.id} className="border-b border-black/5 last:border-0 align-top">
                        <td className="px-2 py-2 text-obsidian whitespace-nowrap">
                          {log.created_at
                            ? new Date(log.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              log.action === "sign_in"
                                ? "bg-blue-100 text-blue-800"
                                : log.action === "app_opened"
                                ? "bg-lime/20 text-green-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {log.action === "sign_in"
                              ? "Login"
                              : log.action === "app_opened"
                              ? "Opened app"
                              : (log.action ?? "").replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-obsidian">
                          {fieldNames.length > 0 ? (
                            <div className="space-y-0.5">
                              {fieldNames.map((f) => (
                                <div key={f}>
                                  <span className="text-mgray">{f.replace(/_/g, " ")}:</span>{" "}
                                  <span className="line-through text-mgray/60">{fields![f].old || "empty"}</span>{" "}
                                  &rarr; {fields![f].new || "empty"}
                                </div>
                              ))}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment history */}
        <div className="bg-white rounded-[10px] border border-black/5 p-5">
          <h3 className="text-sm font-medium text-obsidian mb-3">
            Payment History ({payments.length})
          </h3>
          {payments.length === 0 ? (
            <p className="text-sm text-mgray">
              {user.stripe_customer_id ? "No payments found" : "No Stripe customer linked"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-black/5">
                    <th className="text-left px-2 py-2 font-medium text-mgray">Date</th>
                    <th className="text-left px-2 py-2 font-medium text-mgray">Amount</th>
                    <th className="text-left px-2 py-2 font-medium text-mgray">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={i} className="border-b border-black/5 last:border-0">
                      <td className="px-2 py-2 text-obsidian whitespace-nowrap">
                        {new Date(p.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-2 py-2 text-obsidian font-medium">
                        ${p.amount.toFixed(2)} {p.currency.toUpperCase()}
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            p.status === "paid"
                              ? "bg-lime/20 text-green-800"
                              : p.status === "open"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** "Aug 10, 2026" — null in, null out, so callers can pick their own fallback. */
function fullDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "Aug 10" from a timestamp. */
function shortDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** "Aug 10" from a date-only column, read at midday UTC to avoid a timezone shift. */
function dayDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-mgray">{label}</span>
      <span className="font-medium text-obsidian text-xs break-all text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

function LogTable({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: string[][];
}) {
  return (
    <div className="bg-white rounded-[10px] border border-black/5 p-5">
      <h3 className="text-sm font-medium text-obsidian mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-mgray">No data</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black/5">
                {columns.map((c) => (
                  <th
                    key={c}
                    className="text-left px-2 py-2 font-medium text-mgray"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-black/5 last:border-0"
                >
                  {row.map((cell, j) => (
                    <td key={j} className="px-2 py-2 text-obsidian">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
