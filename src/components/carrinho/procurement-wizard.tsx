"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { registerShipmentAction } from "@/server/actions/procurement";

const STEPS = [
  "Cliente",
  "Produtos",
  "Agrupamento",
  "Confirmar",
  "Gerar PDFs",
  "Registo de envio",
];

export interface CartItem {
  id: string;
  quantity: number;
  unitPrice: number | null;
  currency: string;
  name: string;
  supplierId: string | null;
  supplierName: string | null;
  supplierCode: string | null;
}

export function ProcurementWizard({
  orderId,
  reference,
  clientName,
  items,
}: {
  orderId: string;
  reference: string;
  clientName: string;
  items: CartItem[];
}) {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [shipmentRegistered, setShipmentRegistered] = useState(false);

  const groups = useMemo(() => {
    const map = new Map<string, { supplierName: string; items: CartItem[] }>();
    const unassigned: CartItem[] = [];
    for (const item of items) {
      if (!item.supplierId) {
        unassigned.push(item);
        continue;
      }
      const key = item.supplierId;
      if (!map.has(key)) map.set(key, { supplierName: item.supplierName!, items: [] });
      map.get(key)!.items.push(item);
    }
    return { groups: Array.from(map.values()), unassigned };
  }, [items]);

  function groupTotal(groupItems: CartItem[]) {
    return groupItems.reduce((sum, i) => sum + (i.unitPrice ?? 0) * i.quantity, 0);
  }

  function handleRegisterShipment() {
    startTransition(async () => {
      await registerShipmentAction(
        orderId,
        groups.groups.map((g) => g.supplierName),
      );
      setShipmentRegistered(true);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-1.5">
        {STEPS.map((label, i) => (
          <button
            key={label}
            onClick={() => setStep(i)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors ${
              i === step
                ? "bg-primary text-primary-foreground"
                : i < step
                  ? "bg-accent text-accent-foreground"
                  : "hairline text-muted-foreground"
            }`}
          >
            {i < step && <Check className="size-3" />}
            {i + 1}. {label}
          </button>
        ))}
      </div>

      <div className="hairline min-h-64 rounded-lg p-4">
        {step === 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">Cliente</h2>
            <p className="text-sm">{clientName}</p>
            <p className="text-xs text-muted-foreground">Pedido {reference}</p>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">Produtos</h2>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este pedido ainda não tem produtos. Adiciona-os na página do pedido.
              </p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {items.map((i) => (
                  <li key={i.id} className="flex justify-between">
                    <span>
                      {i.quantity}× {i.name}
                    </span>
                    <span className="text-muted-foreground">
                      {i.supplierName ?? "Sem fornecedor"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold">Agrupamento por fornecedor</h2>
            <p className="text-xs text-muted-foreground">
              Cada PDF de pedido de compra inclui apenas os produtos de um fornecedor.
            </p>
            {groups.groups.map((g) => (
              <div key={g.supplierName} className="flex flex-col gap-1">
                <span className="text-sm font-medium">{g.supplierName}</span>
                {g.items.map((i) => (
                  <div key={i.id} className="flex justify-between pl-3 text-xs text-muted-foreground">
                    <span>
                      {i.quantity}× {i.name}
                      {i.supplierCode && ` · código: ${i.supplierCode}`}
                    </span>
                    <span>
                      {i.unitPrice != null ? `${i.unitPrice.toFixed(2)} ${i.currency}` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            {groups.unassigned.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-amber-500">Sem fornecedor atribuído</span>
                {groups.unassigned.map((i) => (
                  <div key={i.id} className="pl-3 text-xs text-muted-foreground">
                    {i.quantity}× {i.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Confirmar</h2>
            {groups.groups.map((g) => (
              <div key={g.supplierName} className="flex items-center justify-between text-sm">
                <span>{g.supplierName}</span>
                <Badge variant="secondary">
                  {groupTotal(g.items).toFixed(2)} {g.items[0]?.currency ?? "EUR"}
                </Badge>
              </div>
            ))}
            {groups.groups.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Sem fornecedores atribuídos para gerar PDFs.
              </p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Gerar PDFs</h2>
            {groups.groups.map((g) => {
              const supplierId = items.find((i) => i.supplierName === g.supplierName)?.supplierId;
              return (
                <div key={g.supplierName} className="flex items-center justify-between">
                  <span className="text-sm">{g.supplierName}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    render={
                      <a
                        href={`/api/pdf/purchase-order?orderId=${orderId}&supplierId=${supplierId}`}
                        target="_blank"
                      />
                    }
                  >
                    <Download className="size-3.5" />
                    Descarregar PDF
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Registo de envio</h2>
            {shipmentRegistered ? (
              <p className="text-sm text-emerald-500">Envio registado com sucesso.</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Confirma que os pedidos de compra foram enviados aos fornecedores.
                </p>
                <Button
                  disabled={isPending || groups.groups.length === 0}
                  onClick={handleRegisterShipment}
                  className="w-fit"
                >
                  Registar envio
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Anterior
        </Button>
        <Button disabled={step === STEPS.length - 1} onClick={() => setStep((s) => s + 1)}>
          Seguinte
        </Button>
      </div>
    </div>
  );
}
