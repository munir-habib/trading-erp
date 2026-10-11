"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { uploadAttachmentAction } from "@/server/actions/attachments";

interface Target {
  orderId?: string;
  supplierId?: string;
  clientId?: string;
}

export function AttachmentUploadWizard({ target }: { target: Target }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function reset() {
    setStep(0);
    setLabel("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleUpload() {
    if (!file) {
      toast.error("Escolhe um ficheiro.");
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    formData.set("label", label);

    startTransition(async () => {
      try {
        await uploadAttachmentAction(target, formData);
        toast.success("Anexo carregado.");
        setOpen(false);
        reset();
        router.refresh();
      } catch (error) {
        toast.error((error as Error).message);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Upload className="size-3.5" />
        Adicionar anexo
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar anexo — passo {step + 1} de 3</DialogTitle>
        </DialogHeader>

        {step === 0 && (
          <div className="flex flex-col gap-3">
            <Label htmlFor="label">O que é este documento?</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex: Certificado de origem"
            />
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-3">
            <Label>Escolhe o ficheiro</Label>
            <Input
              ref={fileRef}
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-2 text-sm">
            <p>
              <strong>Documento:</strong> {label || "(sem descrição)"}
            </p>
            <p>
              <strong>Ficheiro:</strong> {file?.name ?? "—"}
            </p>
          </div>
        )}

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
          >
            Anterior
          </Button>
          {step < 2 ? (
            <Button onClick={() => setStep((s) => s + 1)}>Seguinte</Button>
          ) : (
            <Button onClick={handleUpload} disabled={isPending}>
              {isPending ? "A enviar..." : "Confirmar e enviar"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
