"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";

interface UserDetailProps {
  user: Record<string, unknown>;
  foodLogs: Record<string, unknown>[];
  workoutLogs: Record<string, unknown>[];
  medicationLogs: Record<string, unknown>[];
  isSuperAdmin: boolean;
}

export default function UserDetailClient({
  user,
  foodLogs,
  workoutLogs,
  medicationLogs,
  isSuperAdmin,
}: UserDetailProps) {
  const router = useRouter();
  const [role, setRole] = useState((user.role as string) ?? "user");
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
      body: JSON.stringify({ onboarding_completed: false }),
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
          {(user.email as string) || "User"}
        </h1>
        <p className="text-sm text-white/60 mt-1">
          {(user.full_name as string) || "No name"} / {user.role as string} /{" "}
          {(user.subscription_status as string) || "none"}
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
            <InfoRow label="ID" value={user.id as string} />
            <InfoRow label="Email" value={user.email as string} />
            <InfoRow label="Name" value={(user.full_name as string) || "-"} />
            <InfoRow label="Role" value={user.role as string} />
            <InfoRow
              label="Subscription"
              value={(user.subscription_status as string) || "none"}
            />
            <InfoRow
              label="Protein Goal"
              value={
                user.protein_goal_g ? `${user.protein_goal_g}g` : "-"
              }
            />
            <InfoRow
              label="GLP-1 Medication"
              value={(user.glp1_medication as string) || "-"}
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
              value={user.onboarding_completed ? "Complete" : "Incomplete"}
            />
            <InfoRow
              label="Joined"
              value={
                user.created_at
                  ? new Date(user.created_at as string).toLocaleDateString()
                  : "-"
              }
            />
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
            l.log_date
              ? new Date((l.log_date as string) + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "-",
            (l.meal_type as string) ?? "-",
            (l.food_name as string) || "-",
            l.protein_g ? `${l.protein_g}g` : "-",
            l.calories ? `${l.calories}` : "-",
          ])}
        />

        {/* Workout logs */}
        <LogTable
          title={`Recent Workouts (${workoutLogs.length})`}
          columns={["Date", "Session", "Week"]}
          rows={workoutLogs.map((l) => [
            l.completed_at
              ? new Date(l.completed_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "-",
            (l.workout_day as string) || "-",
            (l.week_key as string) || "-",
          ])}
        />

        {/* Medication logs */}
        <LogTable
          title={`Recent Medications (${medicationLogs.length})`}
          columns={["Date", "Type", "Dose", "Appetite"]}
          rows={medicationLogs.map((l) => [
            l.change_date
              ? new Date((l.change_date as string) + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : l.created_at
              ? new Date(l.created_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "-",
            ((l.change_type as string) ?? "-").replace("_", " "),
            l.dose_mg ? `${l.dose_mg}mg` : "-",
            ((l.appetite_level as string) ?? "-").replace("_", " "),
          ])}
        />
      </div>
    </div>
  );
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
