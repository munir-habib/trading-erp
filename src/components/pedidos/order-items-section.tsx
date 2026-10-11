"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
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
import { MultiSelectCombobox, type ComboboxOption } from "@/components/pickers/multi-select-combobox";
import { addOrderItemAction, removeOrderItemAction } from "@/server/actions/orders";

export interface OrderItemData {
  id: string;
  quantity: number;
  unitPrice: number | null;
  currency: string;
  freeTextProduct: string | null;
  variant: { name: string; product: { name: string } } | null;
  presentation: { type: string; dose: string | null } | null;
  supplier: { name: string } | null;
}

export function OrderItemsSection({
  orderId,
  items,
  variants,
  suppliers,
}: {
  orderId: string;
  items: OrderItemData[];
  variants: ComboboxOption[];
  suppliers: ComboboxOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [variantId, setVariantId] = useState<string[]>([]);
  const [supplierId, setSupplierId] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");

  function handleAdd(formData: FormData) {
    formData.set("variantId", variantId[0] ?? "");
    formData.set("supplierId", supplierId[0] ?? "");
    if (!variantId[0]) formData.set("freeTextProduct", freeText);
    startTransition(async () => {
      await addOrderItemAction(orderId, formData);
      setVariantId([]);
      setSupplierId([]);
      setFreeText("");
      router.refresh();
    });
  }

  function handleRemove(itemId: string) {
    startTransition(async () => {
      await removeOrderItemAction(orderId, itemId);
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">Produtos e carrinho</h2>

      {items.length > 0 && (
        <div className="hairline overflow-hidden rounded-lg">
          {items.map((item) => (
            <div
              key={item.id}
              className="hairline-b flex items-center justify-between gap-2 px-3 py-2 text-sm last:border-b-0"
            >
              <div className="flex flex-col">
                <span>
                  {item.quantity}× {item.variant ? `${item.variant.product.name} — ${item.variant.name}` : item.freeTextProduct}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.supplier?.name ?? "Fornecedor por definir"} ·{" "}
                  {item.unitPrice != null ? `${item.unitPrice.toFixed(2)} ${item.currency}` : "Preço por definir"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={isPending}
                onClick={() => handleRemove(item.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <form action={handleAdd} className="hairline flex flex-col gap-3 rounded-lg p-3">
        <div className="flex flex-col gap-1.5">
          <Label>Produto do catálogo</Label>
          <MultiSelectCombobox
            options={variants}
            selected={variantId}
            onChange={setVariantId}
            placeholder="Pesquisar produto..."
            multiple={false}
          />
        </div>
        {variantId.length === 0 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="freeTextProduct">Ou produto ainda não catalogado</Label>
            <Input
              id="freeTextProduct"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="Texto livre"
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="unitPrice">Preço unit.</Label>
            <Input id="unitPrice" name="unitPrice" type="number" step="0.01" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Moeda</Label>
            <Select name="currency" defaultValue="EUR">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="AOA">AOA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Fornecedor (opcional)</Label>
          <MultiSelectCombobox
            options={suppliers}
            selected={supplierId}
            onChange={setSupplierId}
            placeholder="Selecionar fornecedor..."
            multiple={false}
          />
        </div>
        <Button type="submit" disabled={isPending} className="w-fit">
          Adicionar ao pedido
        </Button>
      </form>
    </section>
  );
}
