"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recordSupplierNewsAction } from "@/server/actions/suppliers";

const OPTIONS = [
  { value: "NOVO_PRODUTO", label: "Novo produto" },
  { value: "MUDANCA_CONTACTO", label: "Mudança de contacto" },
  { value: "ALTERACAO_PRECOS", label: "Alteração de preços" },
  { value: "NADA", label: "Nada" },
] as const;

export function SupplierNewsBanner({ supplierId }: { supplierId: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (dismissed) return null;

  function handle(option: (typeof OPTIONS)[number]["value"]) {
    startTransition(async () => {
      await recordSupplierNewsAction(supplierId, option);
      setDismissed(true);
    });
  }

  return (
    <div className="hairline flex flex-wrap items-center gap-3 rounded-lg bg-accent/30 px-4 py-3">
      <Sparkles className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-sm">Há novidades sobre este fornecedor?</span>
      <div className="ml-auto flex flex-wrap gap-1.5">
        {OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={option.value === "NADA" ? "ghost" : "outline"}
            size="sm"
            disabled={isPending}
            onClick={() => handle(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
