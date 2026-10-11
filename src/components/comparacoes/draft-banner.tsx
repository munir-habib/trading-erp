"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DraftBanner({ pendingCount }: { pendingCount: number }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || pendingCount === 0) return null;

  return (
    <div className="hairline flex items-center gap-3 rounded-lg bg-accent/30 px-4 py-3 text-sm">
      <Info className="size-4 shrink-0 text-muted-foreground" />
      <span>
        Tens {pendingCount} item{pendingCount === 1 ? "" : "s"} com preços mas sem
        adjudicação — completar agora ou mais tarde?
      </span>
      <div className="ml-auto flex gap-1.5">
        <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
          Mais tarde
        </Button>
        <Button variant="outline" size="sm" onClick={() => setDismissed(true)}>
          Ignorar
        </Button>
      </div>
    </div>
  );
}
