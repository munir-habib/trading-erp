"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { toast } from "sonner";
import { KanbanColumn } from "@/components/pedidos/kanban-column";
import { NaoAvancouDialog } from "@/components/pedidos/nao-avancou-dialog";
import { ORDER_STATUS_ORDER } from "@/lib/order-status";
import { updateOrderStatusAction } from "@/server/actions/orders";
import type { OrderCardData } from "@/components/pedidos/order-card";

export function KanbanBoard({
  columns,
}: {
  columns: Record<string, OrderCardData[]>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingMove, setPendingMove] = useState<{ orderId: string } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function applyStatusChange(orderId: string, toStatus: string, motivo?: string) {
    startTransition(async () => {
      try {
        await updateOrderStatusAction(
          orderId,
          toStatus as Parameters<typeof updateOrderStatusAction>[1],
          motivo as Parameters<typeof updateOrderStatusAction>[2],
        );
        router.refresh();
      } catch (error) {
        toast.error((error as Error).message);
      }
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const orderId = String(active.id);
    const toStatus = String(over.id);

    const currentColumn = Object.entries(columns).find(([, orders]) =>
      orders.some((o) => o.id === orderId),
    )?.[0];
    if (!currentColumn || currentColumn === toStatus) return;

    if (toStatus === "NAO_AVANCOU") {
      setPendingMove({ orderId });
      return;
    }
    applyStatusChange(orderId, toStatus);
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {ORDER_STATUS_ORDER.map((status) => (
            <KanbanColumn key={status} status={status} orders={columns[status] ?? []} />
          ))}
        </div>
      </DndContext>

      <NaoAvancouDialog
        open={!!pendingMove}
        onCancel={() => setPendingMove(null)}
        onConfirm={(motivo) => {
          if (pendingMove) applyStatusChange(pendingMove.orderId, "NAO_AVANCOU", motivo);
          setPendingMove(null);
        }}
      />
    </>
  );
}
