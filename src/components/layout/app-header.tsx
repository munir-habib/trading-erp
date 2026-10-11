import { Menu, LogOut, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createComparisonAction } from "@/server/actions/comparisons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { COMPANY_NAME, COMPANY_NIF } from "@/lib/company";
import { logoutAction } from "@/server/actions/auth";
import type { Session } from "next-auth";

export function AppHeader({ user }: { user: Session["user"] }) {
  return (
    <header className="hairline-b sticky top-0 z-40 flex h-14 items-center gap-3 bg-background px-3 sm:px-4">
      <Sheet>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="md:hidden" />}
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="hairline-b p-4">
            <SheetTitle className="text-left text-sm">{COMPANY_NAME}</SheetTitle>
          </SheetHeader>
          <SidebarNav role={user.role} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-semibold">{COMPANY_NAME}</span>
        <span className="truncate text-[11px] text-muted-foreground">
          {COMPANY_NIF}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <form action={createComparisonAction}>
          <Button size="sm" type="submit" title="Nova comparação">
            <Scale className="size-4" />
            <span className="hidden sm:inline">Nova comparação</span>
          </Button>
        </form>
        <div className="hidden text-right sm:block">
          <div className="text-sm font-medium leading-tight">{user.name}</div>
          <div className="text-[11px] leading-tight text-muted-foreground">
            {user.role === "ADMIN" ? "Administrador" : "Utilizador"}
          </div>
        </div>
        <form action={logoutAction}>
          <Button variant="ghost" size="icon" type="submit" title="Sair">
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
