import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/order-status";

export function OrderStatusBadge({ status }: { status: string }) {
  const color = ORDER_STATUS_COLORS[status] ?? "#8A9690";
  return (
    <span
      className="inline-flex w-fit items-center rounded-md px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}26`, color }}
    >
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
