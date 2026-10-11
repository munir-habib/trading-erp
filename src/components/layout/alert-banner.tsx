"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dismissAlertAction, snoozeAlertAction } from "@/server/actions/alerts";
import type { AlertCandidate } from "@/lib/alerts";

export function AlertBanner({ alert }: { alert: AlertCandidate | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!alert) return null;

  function handle(action: "dismiss" | "snooze") {
    startTransition(async () => {
      if (action === "dismiss") {
        await dismissAlertAction(alert!.type, alert!.entityType, alert!.entityId);
      } else {
        await snoozeAlertAction(alert!.type, alert!.entityType, alert!.entityId);
      }
      router.refresh();
    });
  }

  return (
    <div className="hairline-b flex items-center gap-3 bg-accent/20 px-4 py-2 text-sm">
      <Bell className="size-4 shrink-0 text-muted-foreground" />
      {alert.href ? (
        <Link href={alert.href} className="hover:underline">
          {alert.message}
        </Link>
      ) : (
        <span>{alert.message}</span>
      )}
      <div className="ml-auto flex gap-1.5">
        <Button variant="ghost" size="sm" disabled={isPending} onClick={() => handle("snooze")}>
          Mais tarde
        </Button>
        <Button variant="outline" size="sm" disabled={isPending} onClick={() => handle("dismiss")}>
          Ignorar
        </Button>
      </div>
    </div>
  );
}
