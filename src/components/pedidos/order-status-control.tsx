"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NaoAvancouDialog } from "@/components/pedidos/nao-avancou-dialog";
import { OrderStatusBadge } from "@/components/pedidos/order-status-badge";
import { updateOrderStatusAction } from "@/server/actions/orders";
import { ORDER_STATUS_ORDER, ORDER_STATUS_LABELS } from "@/lib/order-status";

export function OrderStatusControl({
  orderId,
  status,
  checklistIncomplete,
}: {
  orderId: string;
  status: string;
  checklistIncomplete?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showMotivo, setShowMotivo] = useState(false);

  const isFinal = status === "NAO_AVANCOU";
  const currentIndex = ORDER_STATUS_ORDER.indexOf(
    status as (typeof ORDER_STATUS_ORDER)[number],
  );
  const nextStatus = ORDER_STATUS_ORDER[currentIndex + 1];
  const hasNext = nextStatus && nextStatus !== "NAO_AVANCOU";

  function move(toStatus: string, motivo?: string) {
    if (checklistIncomplete && toStatus !== "NAO_AVANCOU") {
      toast.warning("Checklist de documentos ainda incompleto — a avançar na mesma.");
    }
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <OrderStatusBadge status={status} />
      {!isFinal && hasNext && (
        <Button size="sm" disabled={isPending} onClick={() => move(nextStatus)}>
          Avançar para {ORDER_STATUS_LABELS[nextStatus]}
        </Button>
      )}
      {!isFinal && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => setShowMotivo(true)}
        >
          Marcar como não avançou
        </Button>
      )}
      <NaoAvancouDialog
        open={showMotivo}
        onCancel={() => setShowMotivo(false)}
        onConfirm={(motivo) => {
          move("NAO_AVANCOU", motivo);
          setShowMotivo(false);
        }}
      />
    </div>
  );
}
