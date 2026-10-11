import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listOrdersForKanban } from "@/server/actions/orders";
import { KanbanBoard } from "@/components/pedidos/kanban-board";
import type { OrderCardData } from "@/components/pedidos/order-card";

export default async function PedidosPage() {
  const columns = await listOrdersForKanban();
  const serializedColumns: Record<string, OrderCardData[]> = {};
  for (const [status, orders] of Object.entries(columns)) {
    serializedColumns[status] = orders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
    }));
  }

  const total = Object.values(columns).reduce((sum, orders) => sum + orders.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Pipeline de encomendas</h1>
          <p className="text-sm text-muted-foreground">
            {total} pedido{total === 1 ? "" : "s"}
          </p>
        </div>
        <Button render={<Link href="/pedidos/novo" />}>Novo pedido</Button>
      </div>

      <KanbanBoard columns={serializedColumns} />
    </div>
  );
}
