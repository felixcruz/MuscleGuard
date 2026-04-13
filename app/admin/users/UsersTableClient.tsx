"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, X } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  subscription_status: string;
  protein_goal_g: number;
  workout_streak_days: number;
  onboarding_done: boolean;
  created_at: string;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-[#CDFF00]/20 text-obsidian",
    trialing: "bg-[#CDFF00]/20 text-obsidian",
    trial: "bg-surface text-mgray",
    cancelled: "bg-alert/20 text-obsidian",
    past_due: "bg-alert/20 text-obsidian",
    none: "bg-surface text-mgray",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${colors[status] ?? colors.none}`}>
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-800",
    admin: "bg-indigo-100 text-indigo-800",
    support: "bg-yellow-100 text-yellow-800",
    user: "bg-surface text-mgray",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${colors[role] ?? colors.user}`}>
      {role.replace("_", " ")}
    </span>
  );
}

export default function UsersTableClient({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [freeAccess, setFreeAccess] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate() {
    if (!newEmail) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, role: newRole, freeAccess }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((prev) => [{
        id: data.user.id,
        email: data.user.email,
        name: "",
        role: newRole,
        subscription_status: freeAccess ? "active" : "trial",
        protein_goal_g: 0,
        workout_streak_days: 0,
        onboarding_done: false,
        created_at: new Date().toISOString(),
      }, ...prev]);
      setNewEmail("");
      setNewRole("user");
      setFreeAccess(false);
      setShowCreate(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      {/* Search + Create */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mgray" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-black/10 bg-white text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-obsidian/10"
          />
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="h-10 px-4 bg-obsidian text-white text-sm font-medium rounded-lg hover:bg-obsidian-light transition-colors flex items-center gap-1.5"
        >
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreate ? "Cancel" : "Create user"}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white border border-black/5 rounded-[10px] p-4 mb-4 space-y-3">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-mgray block mb-1">Email</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-mgray block mb-1">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="px-3 py-2 border border-black/10 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-obsidian/20"
              >
                <option value="user">User</option>
                <option value="support">Support</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <button
              onClick={handleCreate}
              disabled={creating || !newEmail}
              className="px-4 py-2 bg-obsidian text-white text-sm font-medium rounded-lg hover:bg-obsidian-light transition-colors disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={freeAccess}
              onChange={(e) => setFreeAccess(e.target.checked)}
              className="w-4 h-4 rounded border-black/10 accent-[#CDFF00]"
            />
            <span className="text-xs text-mgray">Grant free access (skip Stripe checkout)</span>
          </label>
          {createError && (
            <p className="text-xs text-[#FFB4AB]">{createError}</p>
          )}
          <p className="text-xs text-muted">User will receive an invite email with a direct login link.</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-[10px] border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-surface">
                <th className="text-left px-4 py-3 font-medium text-mgray">Email</th>
                <th className="text-left px-4 py-3 font-medium text-mgray">Name</th>
                <th className="text-left px-4 py-3 font-medium text-mgray">Role</th>
                <th className="text-left px-4 py-3 font-medium text-mgray">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-mgray">Onboarded</th>
                <th className="text-left px-4 py-3 font-medium text-mgray">Protein</th>
                <th className="text-left px-4 py-3 font-medium text-mgray">Workouts</th>
                <th className="text-left px-4 py-3 font-medium text-mgray">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-black/5 last:border-0 hover:bg-surface/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="text-obsidian hover:underline font-medium"
                    >
                      {u.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-mgray">{u.name || "-"}</td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3"><StatusBadge status={u.subscription_status} /></td>
                  <td className="px-4 py-3 text-mgray">{u.onboarding_done ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-mgray">{u.protein_goal_g ? `${u.protein_goal_g}g` : "-"}</td>
                  <td className="px-4 py-3 text-mgray">{u.workout_streak_days}</td>
                  <td className="px-4 py-3 text-mgray text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-mgray">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
