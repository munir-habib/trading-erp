import { prisma } from "@/lib/prisma";

export interface AlertCandidate {
  type: string;
  entityType: string;
  entityId: string;
  message: string;
  href?: string;
}

async function getSetting(key: string, fallback: number) {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  return typeof setting?.value === "number" ? setting.value : fallback;
}

async function supplierNoResponseAlerts(): Promise<AlertCandidate[]> {
  const days = await getSetting("supplier_stale_days", 14);
  const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const suppliers = await prisma.supplier.findMany({
    where: {
      status: { in: ["ATIVO", "POTENCIAL"] },
      OR: [{ lastContactedAt: null }, { lastContactedAt: { lt: threshold } }],
    },
    take: 5,
  });
  return suppliers.map((s) => ({
    type: "SUPPLIER_NO_RESPONSE",
    entityType: "Supplier",
    entityId: s.id,
    message: `${s.name} sem contacto há mais de ${days} dias — enviar lembrete?`,
    href: `/fornecedores/${s.id}`,
  }));
}

async function orderStaleAlerts(): Promise<AlertCandidate[]> {
  const days = await getSetting("order_stale_days", 7);
  const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const orders = await prisma.order.findMany({
    where: {
      status: { notIn: ["ENTREGUE", "NAO_AVANCOU"] },
      updatedAt: { lt: threshold },
    },
    take: 5,
  });
  return orders.map((o) => ({
    type: "ORDER_STALE",
    entityType: "Order",
    entityId: o.id,
    message: `Pedido ${o.reference} sem atualização há mais de ${days} dias.`,
    href: `/pedidos/${o.id}`,
  }));
}

async function singleSupplierProductAlerts(): Promise<AlertCandidate[]> {
  const variants = await prisma.productVariant.findMany({
    include: { supplierCodes: true, product: true },
    take: 200,
  });
  return variants
    .filter((v) => v.supplierCodes.length === 1)
    .slice(0, 5)
    .map((v) => ({
      type: "SINGLE_SUPPLIER",
      entityType: "ProductVariant",
      entityId: v.id,
      message: `${v.product.name} — ${v.name} só tem um fornecedor conhecido.`,
      href: `/produtos/${v.productId}`,
    }));
}

async function repeatedNaoAvancouAlerts(): Promise<AlertCandidate[]> {
  const orders = await prisma.order.findMany({
    where: { status: "NAO_AVANCOU", naoAvancouMotivo: { not: null } },
    select: { naoAvancouMotivo: true },
  });
  const counts = new Map<string, number>();
  for (const o of orders) {
    if (!o.naoAvancouMotivo) continue;
    counts.set(o.naoAvancouMotivo, (counts.get(o.naoAvancouMotivo) ?? 0) + 1);
  }
  const alerts: AlertCandidate[] = [];
  for (const [motivo, count] of counts) {
    if (count >= 3) {
      alerts.push({
        type: "REPEATED_NAO_AVANCOU",
        entityType: "System",
        entityId: motivo,
        message: `${count} pedidos não avançaram por "${motivo}" — rever estratégia?`,
        href: "/analises",
      });
    }
  }
  return alerts;
}

export async function computeAlertCandidates(): Promise<AlertCandidate[]> {
  const [supplierAlerts, orderAlerts, productAlerts, motivoAlerts] = await Promise.all([
    supplierNoResponseAlerts(),
    orderStaleAlerts(),
    singleSupplierProductAlerts(),
    repeatedNaoAvancouAlerts(),
  ]);
  return [...orderAlerts, ...supplierAlerts, ...motivoAlerts, ...productAlerts];
}

export async function getVisibleAlert(userId: string): Promise<AlertCandidate | null> {
  const candidates = await computeAlertCandidates();
  if (candidates.length === 0) return null;

  const dismissals = await prisma.alertDismissal.findMany({ where: { userId } });
  const now = Date.now();

  for (const candidate of candidates) {
    const dismissal = dismissals.find(
      (d) =>
        d.type === candidate.type &&
        d.entityType === candidate.entityType &&
        d.entityId === candidate.entityId,
    );
    if (!dismissal) return candidate;
    if (dismissal.ignoredCount >= 3) continue;
    if (dismissal.snoozedUntil && dismissal.snoozedUntil.getTime() > now) continue;
    return candidate;
  }
  return null;
}
