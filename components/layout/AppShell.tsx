import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { Toaster } from "@/components/ui/sonner";

export function AppShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar userEmail={userEmail} />
      <div className="flex-1">{children}</div>
      <Footer />
      {/* Mount the sonner toaster once, app-wide — toast.* calls no-op without it. */}
      <Toaster richColors position="top-center" />
    </div>
  );
}
