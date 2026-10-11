import { notFound } from "next/navigation";
import Link from "next/link";
import { getClient, updateClientAction } from "@/server/actions/clients";
import { computeClientClassification } from "@/lib/client-classification";
import { NAO_AVANCOU_MOTIVO_LABELS, ORDER_STATUS_LABELS } from "@/lib/order-status";
import { ClientForm } from "@/components/clientes/client-form";
import { Badge } from "@/components/ui/badge";
import { AttachmentsSection } from "@/components/shared/attachments-section";

export default async function ClientDetailPage({
  params,
}: PageProps<"/clientes/[id]">) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const classification = computeClientClassification(client.orders);

  const productCounts = new Map<string, number>();
  for (const order of client.orders) {
    for (const item of order.items) {
      const name = item.variant
        ? `${item.variant.product.name} — ${item.variant.name}`
        : item.freeTextProduct ?? "Produto";
      productCounts.set(name, (productCounts.get(name) ?? 0) + item.quantity);
    }
  }
  const topProducts = Array.from(productCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const notAdvanced = client.orders.filter((o) => o.status === "NAO_AVANCOU");
  const marginsHistory = client.orders.filter((o) => o.margin?.customPercentage != null);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{client.name}</h1>
        <Badge variant="secondary">{classification}</Badge>
      </div>

      <ClientForm
        action={updateClientAction.bind(null, client.id)}
        submitLabel="Guardar alterações"
        defaultValues={{
          name: client.name,
          email: client.email,
          phone: client.phone,
          country: client.country,
          driveLink: client.driveLink,
        }}
      />

      <AttachmentsSection target={{ clientId: client.id }} />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Pedidos</h2>
        {client.orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda sem pedidos.</p>
        ) : (
          <div className="hairline overflow-hidden rounded-lg">
            {client.orders.map((o) => (
              <Link
                key={o.id}
                href={`/pedidos/${o.id}`}
                className="hairline-b flex items-center justify-between px-3 py-2 text-sm last:border-b-0 hover:bg-accent/40"
              >
                <span>{o.reference}</span>
                <span className="text-xs text-muted-foreground">
                  {ORDER_STATUS_LABELS[o.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {topProducts.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Produtos mais pedidos</h2>
          <div className="flex flex-wrap gap-1.5">
            {topProducts.map(([name, qty]) => (
              <Badge key={name} variant="outline">
                {name} × {qty}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {marginsHistory.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Histórico de margens praticadas</h2>
          <div className="hairline overflow-hidden rounded-lg">
            {marginsHistory.map((o) => (
              <div
                key={o.id}
                className="hairline-b flex items-center justify-between px-3 py-2 text-sm last:border-b-0"
              >
                <span>{o.reference}</span>
                <span className="text-xs text-muted-foreground">
                  {o.margin?.customPercentage}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {notAdvanced.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Pedidos não avançados</h2>
          <div className="hairline overflow-hidden rounded-lg">
            {notAdvanced.map((o) => (
              <div
                key={o.id}
                className="hairline-b flex items-center justify-between px-3 py-2 text-sm last:border-b-0"
              >
                <span>{o.reference}</span>
                <span className="text-xs text-amber-500">
                  {o.naoAvancouMotivo ? NAO_AVANCOU_MOTIVO_LABELS[o.naoAvancouMotivo] : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
