"use client";

import { useDroppable } from "@dnd-kit/core";
import { OrderCard, type OrderCardData } from "@/components/pedidos/order-card";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";

export function KanbanColumn({
  status,
  orders,
}: {
  status: string;
  orders: OrderCardData[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`hairline flex w-72 shrink-0 flex-col rounded-lg ${
        isOver ? "bg-accent/30" : ""
      }`}
    >
      <div className="hairline-b flex items-center justify-between px-3 py-2.5">
        <span className="text-sm font-medium">{ORDER_STATUS_LABELS[status]}</span>
        <span className="text-xs text-muted-foreground">{orders.length}</span>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto p-2" style={{ minHeight: 120 }}>
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
        {orders.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-6 text-xs text-muted-foreground">
            Sem pedidos
          </div>
        )}
      </div>
    </div>
  );
}
