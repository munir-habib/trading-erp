"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { Progress } from "@/components/ui/progress";
import { daysOpen, ORDER_STATUS_COLORS } from "@/lib/order-status";
import { formatCreatedBy } from "@/lib/format";

export interface OrderCardData {
  id: string;
  reference: string;
  status: string;
  createdAt: string | Date;
  client: { name: string };
  createdBy: { name: string };
  onBehalfOf: { name: string } | null;
  items: { id: string; variant: { name: string } | null; freeTextProduct: string | null }[];
  documents: { status: string }[];
}

export function OrderCard({ order }: { order: OrderCardData }) {
  const draggable = order.status !== "NAO_AVANCOU";
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    disabled: !draggable,
  });
  const statusColor = ORDER_STATUS_COLORS[order.status] ?? "#8A9690";

  const productsLabel = order.items
    .map((i) => i.variant?.name ?? i.freeTextProduct ?? "")
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");

  const docsTotal = order.documents.length;
  const docsDone = order.documents.filter((d) => d.status === "APROVADO").length;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        borderLeftColor: statusColor,
        borderLeftWidth: 2,
        ...(transform
          ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 }
          : undefined),
      }}
      className={`hairline flex w-64 shrink-0 flex-col gap-2 rounded-lg bg-card p-3 text-sm ${
        isDragging ? "opacity-60" : ""
      } ${draggable ? "cursor-grab active:cursor-grabbing" : "cursor-default opacity-80"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/pedidos/${order.id}`}
          className="font-medium hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {order.reference}
        </Link>
        <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-secondary-foreground">
          {daysOpen(order.createdAt)}d
        </span>
      </div>
      <div className="text-xs text-muted-foreground">{order.client.name}</div>
      {productsLabel && (
        <div className="line-clamp-2 text-xs text-muted-foreground">{productsLabel}</div>
      )}
      {docsTotal > 0 && (
        <Progress value={(docsDone / docsTotal) * 100} className="h-1" />
      )}
      <div className="text-[11px] text-muted-foreground">
        {formatCreatedBy(order.createdBy, order.onBehalfOf)}
      </div>
    </div>
  );
}
