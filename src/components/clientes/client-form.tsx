"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ClientForm({
  action,
  defaultValues,
  submitLabel = "Guardar cliente",
}: {
  action: (formData: FormData) => void;
  defaultValues?: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    country?: string | null;
    driveLink?: string | null;
  };
  submitLabel?: string;
}) {
  return (
    <form action={action} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome do cliente</Label>
        <Input id="name" name="name" required defaultValue={defaultValues?.name} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={defaultValues?.email ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" defaultValue={defaultValues?.phone ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="country">País</Label>
          <Input id="country" name="country" defaultValue={defaultValues?.country ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="driveLink">Link Google Drive</Label>
          <Input id="driveLink" name="driveLink" defaultValue={defaultValues?.driveLink ?? ""} />
        </div>
      </div>
      <Button type="submit" className="mt-1 w-fit">
        {submitLabel}
      </Button>
    </form>
  );
}
