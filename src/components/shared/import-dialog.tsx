"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImportDialog({
  triggerLabel,
  title,
  hint,
  onImport,
}: {
  triggerLabel: string;
  title: string;
  hint: string;
  onImport: (base64: string) => Promise<{ imported: number; errors: string[] }>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Escolhe um ficheiro .xlsx.");
      return;
    }
    startTransition(async () => {
      const base64 = await fileToBase64(file);
      const result = await onImport(base64);
      if (result.errors.length > 0) {
        toast.warning(`${result.imported} importados, ${result.errors.length} com erro.`);
      } else {
        toast.success(`${result.imported} registos importados.`);
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="size-4" />
        {triggerLabel}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">{hint}</p>
          <Input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" />
        </div>
        <DialogFooter>
          <Button onClick={handleImport} disabled={isPending}>
            {isPending ? "A importar..." : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
