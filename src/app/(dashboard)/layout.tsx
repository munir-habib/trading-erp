import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { AlertBanner } from "@/components/layout/alert-banner";
import { getVisibleAlert } from "@/lib/alerts";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const alert = await getVisibleAlert(session.user.id);

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader user={session.user} />
      <AlertBanner alert={alert} />
      <div className="flex flex-1">
        <aside className="hairline-r hidden w-56 shrink-0 md:block">
          <SidebarNav role={session.user.role} />
        </aside>
        <main className="min-w-0 flex-1 p-3 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
