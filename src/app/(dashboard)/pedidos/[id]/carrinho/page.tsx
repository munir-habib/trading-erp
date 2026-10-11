import { notFound } from "next/navigation";
import { getOrder } from "@/server/actions/orders";
import { ProcurementWizard, type CartItem } from "@/components/carrinho/procurement-wizard";

export default async function ProcurementCartPage({
  params,
}: PageProps<"/pedidos/[id]/carrinho">) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const items: CartItem[] = order.items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    currency: item.currency,
    name: item.variant
      ? `${item.variant.product.name} — ${item.variant.name}`
      : item.freeTextProduct ?? "Produto",
    supplierId: item.supplierId,
    supplierName: item.supplier?.name ?? null,
    supplierCode:
      item.variant?.supplierCodes.find((c) => c.supplierId === item.supplierId)
        ?.supplierCode ?? null,
  }));

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Carrinho de procurement</h1>
        <p className="text-sm text-muted-foreground">Pedido {order.reference}</p>
      </div>
      <ProcurementWizard
        orderId={order.id}
        reference={order.reference}
        clientName={order.client.name}
        items={items}
      />
    </div>
  );
}
