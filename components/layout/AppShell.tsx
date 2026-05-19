import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

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
    </div>
  );
}
