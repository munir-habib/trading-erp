"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { upsertOrderMarginAction } from "@/server/actions/margins";
import { marginColor, MARGIN_COLOR_CLASS } from "@/lib/margin";

export interface MarginData {
  variableCost: number;
  fixedCostShare: number;
  totalCost: number;
  effectivePercentage: number;
  suggestedPrice: number;
  clientPrice: number;
  realMarginPercent: number;
  viewMode: string;
  manualClientPrice: number | null;
  customPercentage: number | null;
}

export function MarginSection({
  orderId,
  data,
}: {
  orderId: string;
  data: MarginData;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const color = marginColor(data.realMarginPercent);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await upsertOrderMarginAction(orderId, formData);
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">Margens e preço ao cliente</h2>
      <form action={handleSubmit} className="hairline flex flex-col gap-3 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div>
            Custo variável: <strong>{data.variableCost.toFixed(2)}</strong>
          </div>
          {data.viewMode === "COMPLETA" && (
            <div>
              Custos fixos (quota): <strong>{data.fixedCostShare.toFixed(2)}</strong>
            </div>
          )}
          <div>
            Custo total: <strong>{data.totalCost.toFixed(2)}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label>Visão</Label>
            <Select name="viewMode" defaultValue={data.viewMode}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SIMPLES">Simples (custos variáveis)</SelectItem>
                <SelectItem value="COMPLETA">Completa (com custos fixos)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customPercentage">Margem (%)</Label>
            <Input
              id="customPercentage"
              name="customPercentage"
              type="number"
              step="0.1"
              defaultValue={data.customPercentage ?? data.effectivePercentage}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manualClientPrice">Preço ao cliente (manual)</Label>
            <Input
              id="manualClientPrice"
              name="manualClientPrice"
              type="number"
              step="0.01"
              defaultValue={data.manualClientPrice ?? ""}
              placeholder={data.suggestedPrice.toFixed(2)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span>Preço ao cliente: <strong>{data.clientPrice.toFixed(2)}</strong></span>
          <span className={`font-medium ${MARGIN_COLOR_CLASS[color]}`}>
            Margem real: {data.realMarginPercent.toFixed(1)}%
          </span>
        </div>

        <Button type="submit" size="sm" disabled={isPending} className="w-fit">
          Guardar
        </Button>
      </form>
    </section>
  );
}
