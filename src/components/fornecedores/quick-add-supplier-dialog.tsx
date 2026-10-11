"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { quickCreateSupplierAction } from "@/server/actions/suppliers";
import type { ComboboxOption } from "@/components/pickers/multi-select-combobox";

export function QuickAddSupplierDialog({
  categories,
  onCreated,
}: {
  categories: ComboboxOption[];
  onCreated?: (supplierId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const supplier = await quickCreateSupplierAction(formData);
      toast.success(`Fornecedor "${supplier.name}" criado — perfil por completar.`);
      setOpen(false);
      if (onCreated) {
        onCreated(supplier.id);
      } else {
        router.push(`/fornecedores/${supplier.id}`);
      }
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus className="size-4" />
        Fornecedor rápido
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fornecedor rápido</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qa-name">Nome</Label>
            <Input id="qa-name" name="name" required autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qa-contact">Contacto (email, WhatsApp ou telefone)</Label>
            <Input id="qa-contact" name="contact" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Categoria</Label>
            <Select name="categoryId">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            O resto do perfil fica marcado como &quot;por completar&quot;.
          </p>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "A criar..." : "Criar fornecedor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
