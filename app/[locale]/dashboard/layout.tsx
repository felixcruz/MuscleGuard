import { AppNav } from "@/components/AppNav";
import { SessionTracker } from "@/components/SessionTracker";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SessionTracker />
      <AppNav />
      <main className="pb-20 sm:pb-0">{children}</main>
    </div>
  );
}
