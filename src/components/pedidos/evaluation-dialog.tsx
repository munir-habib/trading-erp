"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createEvaluationAction } from "@/server/actions/evaluations";

function StarInput({
  name,
  value,
  onChange,
}: {
  name: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      <input type="hidden" name={name} value={value} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={n <= value ? "text-amber-500" : "text-muted-foreground"}
        >
          <Star className="size-5" fill={n <= value ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

export function EvaluationDialog({
  supplierId,
  supplierName,
  orderId,
}: {
  supplierId: string;
  supplierName: string;
  orderId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [prazo, setPrazo] = useState(5);
  const [qualidade, setQualidade] = useState(5);
  const [documentacao, setDocumentacao] = useState(5);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createEvaluationAction(supplierId, orderId, formData);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Avaliar {supplierName}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Avaliar {supplierName}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Prazo cumprido</Label>
            <StarInput name="prazoCumprido" value={prazo} onChange={setPrazo} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Qualidade</Label>
            <StarInput name="qualidade" value={qualidade} onChange={setQualidade} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Documentação</Label>
            <StarInput name="documentacao" value={documentacao} onChange={setDocumentacao} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">Nota livre</Label>
            <Textarea id="note" name="note" rows={2} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              Guardar avaliação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
