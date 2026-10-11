"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MultiSelectCombobox,
  type ComboboxOption,
} from "@/components/pickers/multi-select-combobox";
import { createForwarder, upsertShipmentAction } from "@/server/actions/logistics";

export interface ShipmentData {
  forwarderId: string | null;
  freightCost: number | null;
  currency: string;
  departureEst: string | null;
  arrivalEst: string | null;
  departureReal: string | null;
  arrivalReal: string | null;
  finalCost: number | null;
}

function dateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function ShipmentSection({
  orderId,
  orderValue,
  thresholdPercent,
  forwarders,
  shipment,
}: {
  orderId: string;
  orderValue: number;
  thresholdPercent: number;
  forwarders: ComboboxOption[];
  shipment: ShipmentData | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [forwarderId, setForwarderId] = useState<string[]>(
    shipment?.forwarderId ? [shipment.forwarderId] : [],
  );

  const freightPercent =
    orderValue > 0 && shipment?.freightCost ? (shipment.freightCost / orderValue) * 100 : 0;
  const overThreshold = freightPercent > thresholdPercent;

  function handleSubmit(formData: FormData) {
    formData.set("forwarderId", forwarderId[0] ?? "");
    startTransition(async () => {
      await upsertShipmentAction(orderId, formData);
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">Transitário e logística</h2>
      {overThreshold && (
        <div className="hairline flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-500">
          <AlertTriangle className="size-4 shrink-0" />
          Frete representa {freightPercent.toFixed(0)}% do valor da encomenda (limite:{" "}
          {thresholdPercent}%).
        </div>
      )}
      <form action={handleSubmit} className="hairline flex flex-col gap-3 rounded-lg p-4">
        <div className="flex flex-col gap-1.5">
          <Label>Transitário</Label>
          <MultiSelectCombobox
            options={forwarders}
            selected={forwarderId}
            onChange={setForwarderId}
            onCreate={async (name) => createForwarder(name)}
            placeholder="Selecionar transitário..."
            multiple={false}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="freightCost">Frete</Label>
            <Input
              id="freightCost"
              name="freightCost"
              type="number"
              step="0.01"
              defaultValue={shipment?.freightCost ?? ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="finalCost">Custo total final</Label>
            <Input
              id="finalCost"
              name="finalCost"
              type="number"
              step="0.01"
              defaultValue={shipment?.finalCost ?? ""}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="departureEst">Saída estimada</Label>
            <Input
              id="departureEst"
              name="departureEst"
              type="date"
              defaultValue={dateInputValue(shipment?.departureEst ?? null)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="arrivalEst">Chegada estimada</Label>
            <Input
              id="arrivalEst"
              name="arrivalEst"
              type="date"
              defaultValue={dateInputValue(shipment?.arrivalEst ?? null)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="departureReal">Saída real</Label>
            <Input
              id="departureReal"
              name="departureReal"
              type="date"
              defaultValue={dateInputValue(shipment?.departureReal ?? null)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="arrivalReal">Chegada real</Label>
            <Input
              id="arrivalReal"
              name="arrivalReal"
              type="date"
              defaultValue={dateInputValue(shipment?.arrivalReal ?? null)}
            />
          </div>
        </div>

        {shipment?.freightCost != null && (
          <Badge variant="outline" className="w-fit text-xs">
            Frete: {freightPercent.toFixed(1)}% do valor da encomenda
          </Badge>
        )}

        <Button type="submit" size="sm" disabled={isPending} className="w-fit">
          Guardar
        </Button>
      </form>
    </section>
  );
}
