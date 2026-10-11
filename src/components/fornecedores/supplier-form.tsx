"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MultiSelectCombobox,
  type ComboboxOption,
} from "@/components/pickers/multi-select-combobox";
import { createCategory, createCertification } from "@/server/actions/categories";
import { supplierStatusValues } from "@/lib/validation/supplier";

const STATUS_LABELS: Record<string, string> = {
  ATIVO: "Ativo",
  POTENCIAL: "Potencial",
  INATIVO: "Inativo",
  NUNCA_CONTACTADO: "Nunca contactado",
};

interface SupplierFormProps {
  action: (formData: FormData) => void;
  categories: ComboboxOption[];
  certifications: ComboboxOption[];
  users: { id: string; name: string }[];
  currentUserRole: "ADMIN" | "USER";
  defaultValues?: {
    name?: string;
    email?: string | null;
    whatsapp?: string | null;
    phone?: string | null;
    country?: string | null;
    status?: string;
    driveLink?: string | null;
    notes?: string | null;
    categoryIds?: string[];
    certificationIds?: string[];
  };
  submitLabel?: string;
}

export function SupplierForm({
  action,
  categories,
  certifications,
  users,
  currentUserRole,
  defaultValues,
  submitLabel = "Guardar fornecedor",
}: SupplierFormProps) {
  const [categoryIds, setCategoryIds] = useState<string[]>(
    defaultValues?.categoryIds ?? [],
  );
  const [certificationIds, setCertificationIds] = useState<string[]>(
    defaultValues?.certificationIds ?? [],
  );

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-5">
      {categoryIds.map((id) => (
        <input key={id} type="hidden" name="categoryIds" value={id} />
      ))}
      {certificationIds.map((id) => (
        <input key={id} type="hidden" name="certificationIds" value={id} />
      ))}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome do fornecedor</Label>
        <Input id="name" name="name" required defaultValue={defaultValues?.name} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={defaultValues?.email ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" defaultValue={defaultValues?.whatsapp ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" defaultValue={defaultValues?.phone ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="country">País</Label>
          <Input id="country" name="country" defaultValue={defaultValues?.country ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Estado</Label>
          <Select name="status" defaultValue={defaultValues?.status ?? "NUNCA_CONTACTADO"}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supplierStatusValues.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="driveLink">Link Google Drive</Label>
          <Input id="driveLink" name="driveLink" defaultValue={defaultValues?.driveLink ?? ""} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Categorias</Label>
        <MultiSelectCombobox
          options={categories}
          selected={categoryIds}
          onChange={setCategoryIds}
          onCreate={async (name) => createCategory(name)}
          placeholder="Selecionar categorias..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Certificações</Label>
        <MultiSelectCombobox
          options={certifications}
          selected={certificationIds}
          onChange={setCertificationIds}
          onCreate={async (name) => createCertification(name)}
          placeholder="Selecionar certificações..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={defaultValues?.notes ?? ""} />
      </div>

      {currentUserRole === "ADMIN" && (
        <div className="flex flex-col gap-1.5">
          <Label>Registar em nome de (proxy entry)</Label>
          <Select name="onBehalfOfId">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Ninguém — sou eu a registar" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" className="mt-1 w-fit">
        {submitLabel}
      </Button>
    </form>
  );
}
