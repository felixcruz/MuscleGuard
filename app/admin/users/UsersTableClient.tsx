"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  subscription_status: string;
  protein_goal_g: number;
  workout_streak_days: number;
  created_at: string;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-lime/20 text-obsidian",
    trialing: "bg-blue-100 text-blue-800",
    canceled: "bg-alert/20 text-red-800",
    none: "bg-gray-100 text-mgray",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${colors[status] ?? colors.none}`}
    >
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-800",
    admin: "bg-indigo-100 text-indigo-800",
    support: "bg-yellow-100 text-yellow-800",
    user: "bg-gray-100 text-mgray",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${colors[role] ?? colors.user}`}
    >
      {role.replace("_", " ")}
    </span>
  );
}

export default function UsersTableClient({ users }: { users: User[] }) {
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mgray" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-3 rounded-lg border border-black/10 bg-white text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-obsidian/10"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-[10px] border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5">
                <th className="text-left px-4 py-3 font-medium text-mgray">
                  Email
                </th>
                <th className="text-left px-4 py-3 font-medium text-mgray">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-mgray">
                  Role
                </th>
                <th className="text-left px-4 py-3 font-medium text-mgray">
                  Plan
                </th>
                <th className="text-left px-4 py-3 font-medium text-mgray">
                  Protein Goal
                </th>
                <th className="text-left px-4 py-3 font-medium text-mgray">
                  Streak
                </th>
                <th className="text-left px-4 py-3 font-medium text-mgray">
                  Joined
                </th>
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
                      className="text-obsidian hover:underline"
                    >
                      {u.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-mgray">{u.name || "-"}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.subscription_status} />
                  </td>
                  <td className="px-4 py-3 text-mgray">
                    {u.protein_goal_g ? `${u.protein_goal_g}g` : "-"}
                  </td>
                  <td className="px-4 py-3 text-mgray">
                    {u.workout_streak_days}d
                  </td>
                  <td className="px-4 py-3 text-mgray text-xs">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-mgray"
                  >
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
