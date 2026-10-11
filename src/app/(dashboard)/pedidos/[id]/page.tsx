import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getOrder } from "@/server/actions/orders";
import { listAllVariants } from "@/server/actions/products";
import { listSuppliers } from "@/server/actions/suppliers";
import { createComparisonAction } from "@/server/actions/comparisons";
import { getOrderMarginData } from "@/server/actions/margins";
import { getShipment, listForwarders, getFreightThresholdPercent } from "@/server/actions/logistics";
import { getOrCreateOrderDocuments, listFaqArticles } from "@/server/actions/documents";
import { listUsers } from "@/server/actions/users";
import { getCurrentUser } from "@/lib/session";
import { isTriangulationCandidate } from "@/lib/triangulation";
import { AttachmentsSection } from "@/components/shared/attachments-section";
import { Button } from "@/components/ui/button";
import { getAuditTrail } from "@/lib/audit";
import { formatCreatedBy } from "@/lib/format";
import { daysOpen, nextSuggestedStep, NAO_AVANCOU_MOTIVO_LABELS } from "@/lib/order-status";
import { OrderStatusControl } from "@/components/pedidos/order-status-control";
import { OrderItemsSection } from "@/components/pedidos/order-items-section";
import { MarginSection } from "@/components/pedidos/margin-section";
import { ShipmentSection } from "@/components/pedidos/shipment-section";
import { ChecklistSection } from "@/components/pedidos/checklist-section";
import { OrderNotesSection } from "@/components/pedidos/order-notes-section";
import { EvaluationDialog } from "@/components/pedidos/evaluation-dialog";
import { Badge } from "@/components/ui/badge";

export default async function OrderDetailPage({
  params,
}: PageProps<"/pedidos/[id]">) {
  const { id } = await params;
  const [order, variants, suppliers, currentUser, users] = await Promise.all([
    getOrder(id),
    listAllVariants(),
    listSuppliers(),
    getCurrentUser(),
    listUsers(),
  ]);

  if (!order) notFound();

  const [auditTrail, marginData, shipment, forwarders, thresholdPercent, documents, faqArticles] =
    await Promise.all([
      getAuditTrail("Order", id),
      currentUser?.role === "ADMIN" ? getOrderMarginData(id) : Promise.resolve(null),
      getShipment(id),
      listForwarders(),
      getFreightThresholdPercent(),
      getOrCreateOrderDocuments(id, order.orderType),
      listFaqArticles(order.status),
    ]);

  const orderValue = order.items.reduce(
    (sum, i) => sum + (i.unitPrice ?? 0) * i.quantity,
    0,
  );

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold">{order.reference}</h1>
            <Link
              href={`/clientes/${order.clientId}`}
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              {order.client.name}
            </Link>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono tabular-nums text-secondary-foreground">
                {daysOpen(order.createdAt)} dias em aberto
              </span>
              <span>Criado por {formatCreatedBy(order.createdBy, order.onBehalfOf)}</span>
            </div>
          </div>
        </div>

        <OrderStatusControl
          orderId={order.id}
          status={order.status}
          checklistIncomplete={documents.some((d) => d.status !== "APROVADO")}
        />

        {order.status === "NAO_AVANCOU" && order.naoAvancouMotivo && (
          <Badge variant="outline" className="w-fit text-amber-500">
            Motivo: {NAO_AVANCOU_MOTIVO_LABELS[order.naoAvancouMotivo]}
          </Badge>
        )}

        <div className="hairline flex items-center gap-2 rounded-lg px-4 py-3 text-sm">
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          <span>{nextSuggestedStep(order.status)}</span>
        </div>
      </div>

      <OrderItemsSection
        orderId={order.id}
        items={order.items}
        variants={variants}
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
      />

      <Button
        variant="outline"
        className="w-fit"
        render={<Link href={`/pedidos/${order.id}/carrinho`} />}
      >
        Abrir carrinho de procurement
      </Button>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Cotações comparativas</h2>
          <form action={createComparisonAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <Button type="submit" variant="outline" size="sm">
              Nova comparação
            </Button>
          </form>
        </div>
        {order.comparisons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda sem comparações.</p>
        ) : (
          <div className="hairline overflow-hidden rounded-lg">
            {order.comparisons.map((c) => (
              <Link
                key={c.id}
                href={`/comparacoes/${c.id}`}
                className="hairline-b flex items-center justify-between px-3 py-2 text-sm last:border-b-0 hover:bg-accent/40"
              >
                <span>{c.label || "Comparação sem título"}</span>
                <span className="text-xs text-muted-foreground">{c.status}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {currentUser?.role === "ADMIN" &&
        isTriangulationCandidate({
          orderValue,
          supplierCountries: order.items.map((i) => i.supplier?.country ?? null),
          clientCountry: order.client.country,
        }) && (
          <div className="hairline flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
            Candidata a triangulação fiscal (valor alto, fornecedor UE, cliente fora
            da UE) — decisão sempre humana, nunca automática.
          </div>
        )}

      {marginData && <MarginSection orderId={order.id} data={marginData} />}

      <ShipmentSection
        orderId={order.id}
        orderValue={orderValue}
        thresholdPercent={thresholdPercent}
        forwarders={forwarders.map((f) => ({ id: f.id, name: f.name }))}
        shipment={
          shipment
            ? {
                forwarderId: shipment.forwarderId,
                freightCost: shipment.freightCost,
                currency: shipment.currency,
                departureEst: shipment.departureEst?.toISOString() ?? null,
                arrivalEst: shipment.arrivalEst?.toISOString() ?? null,
                departureReal: shipment.departureReal?.toISOString() ?? null,
                arrivalReal: shipment.arrivalReal?.toISOString() ?? null,
                finalCost: shipment.finalCost,
              }
            : null
        }
      />

      <ChecklistSection orderId={order.id} documents={documents} />

      <AttachmentsSection target={{ orderId: order.id }} />

      {faqArticles.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">FAQ relevante para esta fase</h2>
          <div className="hairline overflow-hidden rounded-lg">
            {faqArticles.map((a) => (
              <details key={a.id} className="hairline-b p-3 last:border-b-0">
                <summary className="cursor-pointer text-sm">{a.title}</summary>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {a.content}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {order.status === "ENTREGUE" && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Avaliação de fornecedores</h2>
          <div className="flex flex-wrap gap-2">
            {Array.from(
              new Map(
                order.items
                  .filter((i) => i.supplier)
                  .map((i) => [i.supplier!.id, i.supplier!.name]),
              ),
            ).map(([supplierId, name]) => (
              <EvaluationDialog
                key={supplierId}
                supplierId={supplierId}
                supplierName={name}
                orderId={order.id}
              />
            ))}
          </div>
        </section>
      )}

      <OrderNotesSection
        orderId={order.id}
        notes={order.notes}
        users={users.filter((u) => u.id !== currentUser?.id)}
        currentUserRole={currentUser?.role ?? "USER"}
      />

      {auditTrail.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Histórico</h2>
          <div className="hairline overflow-hidden rounded-lg">
            {auditTrail.map((event) => (
              <div
                key={event.id}
                className="hairline-b flex flex-col gap-0.5 px-3 py-2 text-xs last:border-b-0"
              >
                <div className="flex items-center gap-1.5">
                  <span>{formatCreatedBy(event.actor, event.onBehalfOf)}</span>
                  <span className="rounded bg-secondary px-1 py-px text-[10px] font-medium text-secondary-foreground">
                    {event.action}
                  </span>
                </div>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {new Date(event.createdAt).toLocaleString("pt-PT")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
