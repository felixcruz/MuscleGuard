import { AppNav } from "@/components/AppNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />
      <main className="pb-20 sm:pb-0">{children}</main>
    </div>
  );
}
