"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, X, Trash2 } from "lucide-react";

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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

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

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((u) => u.id)));
    }
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/admin/users/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((prev) => prev.filter((u) => !selected.has(u.id)));
      setSelected(new Set());
      setShowBulkConfirm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete users");
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div>
      {/* Bulk actions toolbar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-obsidian text-white rounded-[10px] animate-in fade-in slide-in-from-top-1">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex-1" />
          {!showBulkConfirm ? (
            <button
              onClick={() => setShowBulkConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-alert text-white text-xs font-medium rounded-lg hover:bg-alert/80 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/70">Delete {selected.size} user{selected.size > 1 ? "s" : ""}?</span>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="px-3 py-1.5 bg-alert text-white text-xs font-medium rounded-lg hover:bg-alert/80 transition-colors disabled:opacity-50"
              >
                {bulkDeleting ? "Deleting..." : "Confirm"}
              </button>
              <button
                onClick={() => setShowBulkConfirm(false)}
                className="px-3 py-1.5 bg-white/20 text-white text-xs font-medium rounded-lg hover:bg-white/30 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
          <button
            onClick={() => { setSelected(new Set()); setShowBulkConfirm(false); }}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-black/10 accent-obsidian cursor-pointer"
                  />
                </th>
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
                  className={`border-b border-black/5 last:border-0 hover:bg-surface/50 transition-colors ${selected.has(u.id) ? "bg-[#CDFF00]/5" : ""}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(u.id)}
                      onChange={() => toggleSelect(u.id)}
                      className="w-4 h-4 rounded border-black/10 accent-obsidian cursor-pointer"
                    />
                  </td>
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
                  <td colSpan={9} className="px-4 py-8 text-center text-mgray">
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
