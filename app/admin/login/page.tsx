export const dynamic = "force-dynamic";

import nextDynamic from "next/dynamic";

const AdminLoginClient = nextDynamic(() => import("./AdminLoginClient"), {
  ssr: false,
});

export default function AdminLoginPage() {
  return <AdminLoginClient />;
}
