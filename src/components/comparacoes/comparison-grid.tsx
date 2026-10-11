"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, AlertTriangle, Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AddRowControl } from "@/components/comparacoes/add-row-control";
import { AddSupplierControl } from "@/components/comparacoes/add-supplier-control";
import {
  removeComparisonRowAction,
  removeComparisonSupplierAction,
  updateComparisonCellAction,
  toggleAwardAction,
  applyAwardsToOrderAction,
} from "@/server/actions/comparisons";
import type { ComboboxOption } from "@/components/pickers/multi-select-combobox";

interface CellData {
  id: string;
  supplierId: string;
  supplier: { id: string; name: string; evaluations: unknown[] };
  pricePerBox: number | null;
  currency: string;
  unitsPerBoxOverride: number | null;
  quoteExpiresAt: string | null;
  isAwarded: boolean;
}

interface RowData {
  id: string;
  freeTextProduct: string | null;
  variant: {
    name: string;
    product: { name: string; category: { riskLevel: string } | null };
    presentations: { unitsPerBox: number }[];
  } | null;
  cells: CellData[];
}

export function ComparisonGrid({
  comparisonId,
  orderId,
  rows,
  allSuppliers,
  allVariants,
}: {
  comparisonId: string;
  orderId: string | null;
  rows: RowData[];
  allSuppliers: ComboboxOption[];
  allVariants: ComboboxOption[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [localRows, setLocalRows] = useState(rows);

  const suppliers = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of localRows) {
      for (const cell of row.cells) map.set(cell.supplierId, cell.supplier.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [localRows]);

  function unitsPerBox(row: RowData, cell: CellData) {
    return cell.unitsPerBoxOverride ?? row.variant?.presentations[0]?.unitsPerBox ?? 1;
  }

  function pricePerUnit(row: RowData, cell: CellData) {
    if (cell.pricePerBox == null) return null;
    return cell.pricePerBox / unitsPerBox(row, cell);
  }

  function cheapestCellId(row: RowData) {
    let best: { id: string; value: number } | null = null;
    for (const cell of row.cells) {
      const v = pricePerUnit(row, cell);
      if (v == null) continue;
      if (!best || v < best.value) best = { id: cell.id, value: v };
    }
    return best?.id;
  }

  function rowAverage(row: RowData) {
    const values = row.cells
      .map((c) => pricePerUnit(row, c))
      .filter((v): v is number => v != null);
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  function columnTotal(supplierId: string) {
    let total = 0;
    let count = 0;
    for (const row of localRows) {
      const cell = row.cells.find((c) => c.supplierId === supplierId);
      if (cell?.pricePerBox != null) {
        total += cell.pricePerBox;
        count++;
      }
    }
    return count > 0 ? total : null;
  }

  const cheapestTotalSupplierId = useMemo(() => {
    let best: { id: string; value: number } | null = null;
    for (const s of suppliers) {
      const total = columnTotal(s.id);
      if (total == null) continue;
      if (!best || total < best.value) best = { id: s.id, value: total };
    }
    return best?.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localRows, suppliers]);

  function updateCellLocal(cellId: string, patch: Partial<CellData>) {
    setLocalRows((prev) =>
      prev.map((row) => ({
        ...row,
        cells: row.cells.map((c) => (c.id === cellId ? { ...c, ...patch } : c)),
      })),
    );
  }

  function savePrice(cellId: string, value: string) {
    const pricePerBox = value === "" ? null : Number(value);
    updateCellLocal(cellId, { pricePerBox });
    startTransition(async () => {
      await updateComparisonCellAction(comparisonId, cellId, { pricePerBox });
    });
  }

  function saveExpiry(cellId: string, value: string) {
    updateCellLocal(cellId, { quoteExpiresAt: value || null });
    startTransition(async () => {
      await updateComparisonCellAction(comparisonId, cellId, {
        quoteExpiresAt: value || null,
      });
    });
  }

  function handleAward(rowId: string, supplierId: string) {
    startTransition(async () => {
      await toggleAwardAction(comparisonId, rowId, supplierId);
      router.refresh();
    });
  }

  function handleRemoveRow(rowId: string) {
    setLocalRows((prev) => prev.filter((r) => r.id !== rowId));
    startTransition(async () => {
      await removeComparisonRowAction(comparisonId, rowId);
    });
  }

  function handleRemoveSupplier(supplierId: string) {
    setLocalRows((prev) =>
      prev.map((r) => ({ ...r, cells: r.cells.filter((c) => c.supplierId !== supplierId) })),
    );
    startTransition(async () => {
      await removeComparisonSupplierAction(comparisonId, supplierId);
    });
  }

  // Leitura de relógio para badges de expiração — atraso de um render é aceitável aqui.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const soon = now + 3 * 24 * 60 * 60 * 1000;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <AddRowControl comparisonId={comparisonId} variants={allVariants} />
        <AddSupplierControl
          comparisonId={comparisonId}
          suppliers={allSuppliers}
          excludeIds={suppliers.map((s) => s.id)}
        />
        {orderId && (
          <Button
            size="sm"
            className="ml-auto"
            onClick={() =>
              startTransition(async () => {
                await applyAwardsToOrderAction(comparisonId);
                router.refresh();
              })
            }
          >
            Aplicar adjudicação ao pedido
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="hairline-b sticky left-0 z-10 bg-background px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                Produto
              </th>
              {suppliers.map((s) => (
                <th key={s.id} className="hairline-b min-w-36 px-2 py-2 text-left text-xs font-medium">
                  <div className="flex items-center justify-between gap-1">
                    <span>{s.name}</span>
                    <button
                      onClick={() => handleRemoveSupplier(s.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {localRows.map((row) => {
              const cheapestId = cheapestCellId(row);
              const avg = rowAverage(row);
              const riskLevel = row.variant?.product.category?.riskLevel;
              return (
                <tr key={row.id}>
                  <td className="hairline-b sticky left-0 z-10 bg-background px-2 py-2 align-top">
                    <div className="flex items-center gap-1.5">
                      {!row.variant && (
                        <span className="size-1.5 shrink-0 rounded-full bg-orange-500" />
                      )}
                      <span className="font-medium">
                        {row.variant
                          ? `${row.variant.product.name} — ${row.variant.name}`
                          : row.freeTextProduct}
                      </span>
                      <button
                        onClick={() => handleRemoveRow(row.id)}
                        className="ml-auto text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </td>
                  {suppliers.map((s) => {
                    const cell = row.cells.find((c) => c.supplierId === s.id);
                    if (!cell) return <td key={s.id} className="hairline-b px-2 py-2" />;

                    const perUnit = pricePerUnit(row, cell);
                    const isCheapest = cell.id === cheapestId;
                    const belowMarket =
                      avg != null && perUnit != null && perUnit < avg * 0.6;
                    const expiringSoon =
                      cell.quoteExpiresAt &&
                      new Date(cell.quoteExpiresAt).getTime() <= soon &&
                      new Date(cell.quoteExpiresAt).getTime() >= now;
                    const expired =
                      cell.quoteExpiresAt && new Date(cell.quoteExpiresAt).getTime() < now;
                    const noHistory = riskLevel === "ALTO" && cell.supplier.evaluations.length === 0;

                    return (
                      <td
                        key={s.id}
                        className={`hairline-b px-2 py-2 align-top ${
                          isCheapest ? "bg-primary/10" : ""
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              className="h-7 w-24 font-mono text-sm tabular-nums"
                              defaultValue={cell.pricePerBox ?? ""}
                              onBlur={(e) => savePrice(cell.id, e.target.value)}
                              placeholder="€/cx"
                            />
                            <button
                              onClick={() => handleAward(row.id, s.id)}
                              title="Adjudicar a este fornecedor"
                              className={`flex size-6 shrink-0 items-center justify-center rounded-md ${
                                cell.isAwarded
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-accent"
                              }`}
                            >
                              <Check className="size-3.5" />
                            </button>
                          </div>
                          {perUnit != null && (
                            <span className="font-mono text-xs tabular-nums text-muted-foreground">
                              {perUnit.toFixed(2)} {cell.currency}/un
                            </span>
                          )}
                          <Input
                            type="date"
                            className="h-6 w-32 text-xs"
                            defaultValue={cell.quoteExpiresAt?.slice(0, 10) ?? ""}
                            onBlur={(e) => saveExpiry(cell.id, e.target.value)}
                          />
                          <div className="flex flex-wrap gap-1">
                            {belowMarket && (
                              <Tooltip>
                                <TooltipTrigger render={<Badge variant="outline" className="gap-1 text-[10px] text-warning" />}>
                                  <AlertTriangle className="size-2.5" />
                                  Abaixo do mercado
                                </TooltipTrigger>
                                <TooltipContent>
                                  Mais de 40% abaixo da média desta linha.
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {expiringSoon && (
                              <Badge variant="outline" className="gap-1 text-[10px] text-warning">
                                <Clock className="size-2.5" />
                                Expira em breve
                              </Badge>
                            )}
                            {expired && (
                              <Badge variant="outline" className="gap-1 text-[10px] text-destructive">
                                <Clock className="size-2.5" />
                                Expirada
                              </Badge>
                            )}
                            {noHistory && (
                              <Tooltip>
                                <TooltipTrigger render={<Badge variant="outline" className="gap-1 text-[10px] text-destructive" />}>
                                  <ShieldAlert className="size-2.5" />
                                  Sem histórico
                                </TooltipTrigger>
                                <TooltipContent>
                                  Categoria de alto risco — fornecedor sem avaliações prévias.
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky left-0 z-10 bg-background px-2 py-2 text-xs font-medium text-muted-foreground">
                Total
              </td>
              {suppliers.map((s) => {
                const total = columnTotal(s.id);
                return (
                  <td
                    key={s.id}
                    className={`px-2 py-2 font-mono text-sm font-medium tabular-nums ${
                      s.id === cheapestTotalSupplierId ? "bg-primary/10 text-primary" : ""
                    }`}
                  >
                    {total != null ? total.toFixed(2) : "—"}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
