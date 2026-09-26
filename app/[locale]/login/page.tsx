export const metadata = { robots: { index: false, follow: true } };
export const dynamic = "force-dynamic";

import nextDynamic from "next/dynamic";

const LoginClient = nextDynamic(() => import("./LoginClient"), { ssr: false });

export default function LoginPage() {
  return <LoginClient />;
}
