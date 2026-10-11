"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { upsertFaqArticleAction } from "@/server/actions/documents";
import { ORDER_STATUS_ORDER, ORDER_STATUS_LABELS } from "@/lib/order-status";

export function FaqEditor() {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <details className="hairline rounded-lg p-4">
      <summary className="cursor-pointer text-sm font-medium">Novo artigo FAQ</summary>
      <form action={upsertFaqArticleAction} className="mt-3 flex flex-col gap-3">
        {selected.map((s) => (
          <input key={s} type="hidden" name="appliesToStatuses" value={s} />
        ))}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Título</Label>
          <Input id="title" name="title" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="content">Conteúdo</Label>
          <Textarea id="content" name="content" rows={4} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Aplica-se às fases (opcional)</Label>
          <div className="flex flex-wrap gap-3">
            {ORDER_STATUS_ORDER.map((status) => (
              <label key={status} className="flex items-center gap-1.5 text-sm">
                <Checkbox
                  checked={selected.includes(status)}
                  onCheckedChange={(checked) =>
                    setSelected((prev) =>
                      checked ? [...prev, status] : prev.filter((s) => s !== status),
                    )
                  }
                />
                {ORDER_STATUS_LABELS[status]}
              </label>
            ))}
          </div>
        </div>
        <Button type="submit" size="sm" className="w-fit">
          Guardar artigo
        </Button>
      </form>
    </details>
  );
}
