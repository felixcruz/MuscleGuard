export const dynamic = "force-dynamic";

import nextDynamic from "next/dynamic";

const OnboardingClient = nextDynamic(() => import("./OnboardingClient"), { ssr: false });

export default function OnboardingPage() {
  return <OnboardingClient />;
}
