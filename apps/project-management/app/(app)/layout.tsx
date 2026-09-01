import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getSession } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar user={{ name: session.name, role: "Project Manager" }} />
      <div className="flex flex-1 flex-col">
        <Topbar user={{ name: session.name }} />
        <main className="flex-1 p-6 bg-[var(--color-surface)]">{children}</main>
      </div>
    </div>
  );
}
