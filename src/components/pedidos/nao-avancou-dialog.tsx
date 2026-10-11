"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NAO_AVANCOU_MOTIVO_LABELS } from "@/lib/order-status";

const MOTIVOS = Object.keys(NAO_AVANCOU_MOTIVO_LABELS) as (keyof typeof NAO_AVANCOU_MOTIVO_LABELS)[];

export function NaoAvancouDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Motivo — Não avançou</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Este estado é permanente. Escolhe o motivo antes de confirmar.
        </p>
        <div className="flex flex-col gap-1.5">
          {MOTIVOS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMotivo(m)}
              className={`hairline rounded-md px-3 py-2 text-left text-sm transition-colors ${
                motivo === m ? "bg-accent" : "hover:bg-accent/50"
              }`}
            >
              {NAO_AVANCOU_MOTIVO_LABELS[m]}
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button disabled={!motivo} onClick={() => motivo && onConfirm(motivo)}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
