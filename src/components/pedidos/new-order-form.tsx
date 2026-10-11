"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { quickCreateClientAction, getLastOrderSuppliers } from "@/server/actions/clients";
import { orderTypeValues } from "@/lib/validation/order";

const ORDER_TYPE_LABELS: Record<string, string> = {
  MEDICAMENTOS: "Medicamentos",
  MATERIAL_CIRURGICO: "Material cirúrgico",
  EQUIPAMENTO: "Equipamento",
  OUTRO: "Outro",
};

export function NewOrderForm({
  action,
  clients,
  users,
  currentUserRole,
}: {
  action: (formData: FormData) => void;
  clients: ComboboxOption[];
  users: { id: string; name: string }[];
  currentUserRole: "ADMIN" | "USER";
}) {
  const [clientId, setClientId] = useState<string[]>([]);
  const [lastSuppliers, setLastSuppliers] = useState<string[]>([]);

  useEffect(() => {
    if (!clientId[0]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastSuppliers([]);
      return;
    }
    getLastOrderSuppliers(clientId[0]).then(setLastSuppliers);
  }, [clientId]);

  return (
    <form action={action} className="flex max-w-lg flex-col gap-5">
      <input type="hidden" name="clientId" value={clientId[0] ?? ""} />

      <div className="flex flex-col gap-1.5">
        <Label>Cliente</Label>
        <MultiSelectCombobox
          options={clients}
          selected={clientId}
          onChange={setClientId}
          onCreate={async (name) => quickCreateClientAction(name)}
          placeholder="Selecionar ou criar cliente..."
          multiple={false}
        />
        {lastSuppliers.length > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0" />
            Cliente recorrente — última vez usou {lastSuppliers.join(", ")}. Podes
            reutilizar os mesmos fornecedores ao adicionar produtos.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Tipo de encomenda</Label>
        <Select name="orderType" defaultValue="OUTRO">
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {orderTypeValues.map((t) => (
              <SelectItem key={t} value={t}>
                {ORDER_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="driveLink">Link Google Drive (opcional)</Label>
        <Input id="driveLink" name="driveLink" />
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

      <Button type="submit" disabled={!clientId[0]} className="mt-1 w-fit">
        Criar pedido
      </Button>
    </form>
  );
}
