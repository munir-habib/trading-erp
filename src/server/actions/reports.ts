"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { NAO_AVANCOU_MOTIVO_LABELS, ORDER_STATUS_LABELS } from "@/lib/order-status";

export async function getConversionRate() {
  const [total, delivered, notAdvanced] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "ENTREGUE" } }),
    prisma.order.count({ where: { status: "NAO_AVANCOU" } }),
  ]);
  const closed = delivered + notAdvanced;
  return {
    total,
    delivered,
    notAdvanced,
    conversionRate: closed > 0 ? (delivered / closed) * 100 : 0,
  };
}

export async function getNaoAvancouAnalysis() {
  const orders = await prisma.order.findMany({
    where: { status: "NAO_AVANCOU" },
    include: { client: { select: { name: true } } },
  });

  const byMotivo = new Map<string, number>();
  const byClient = new Map<string, number>();
  for (const o of orders) {
    if (o.naoAvancouMotivo) {
      const label = NAO_AVANCOU_MOTIVO_LABELS[o.naoAvancouMotivo];
      byMotivo.set(label, (byMotivo.get(label) ?? 0) + 1);
    }
    byClient.set(o.client.name, (byClient.get(o.client.name) ?? 0) + 1);
  }

  return {
    byMotivo: Array.from(byMotivo.entries()).map(([name, value]) => ({ name, value })),
    byClient: Array.from(byClient.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    total: orders.length,
  };
}

export async function getTopSuppliers() {
  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { orderItems: true, evaluations: true } } },
    orderBy: [{ ratingAvg: "desc" }],
    take: 10,
  });
  return suppliers.map((s) => ({
    name: s.name,
    usageCount: s._count.orderItems,
    ratingAvg: s.ratingAvg,
    evaluationCount: s._count.evaluations,
  }));
}

export async function getAverageTimePerPhase() {
  const history = await prisma.orderStatusHistory.findMany({
    orderBy: { changedAt: "asc" },
  });

  const byOrder = new Map<string, typeof history>();
  for (const h of history) {
    if (!byOrder.has(h.orderId)) byOrder.set(h.orderId, []);
    byOrder.get(h.orderId)!.push(h);
  }

  const durations = new Map<string, number[]>();
  for (const events of byOrder.values()) {
    for (let i = 0; i < events.length - 1; i++) {
      const status = events[i].toStatus;
      const durationMs = events[i + 1].changedAt.getTime() - events[i].changedAt.getTime();
      const days = durationMs / (1000 * 60 * 60 * 24);
      if (!durations.has(status)) durations.set(status, []);
      durations.get(status)!.push(days);
    }
  }

  return Array.from(durations.entries()).map(([status, values]) => ({
    name: ORDER_STATUS_LABELS[status] ?? status,
    avgDays: values.reduce((a, b) => a + b, 0) / values.length,
  }));
}

export async function getExchangeRates() {
  return prisma.exchangeRate.findMany();
}

export async function upsertExchangeRateAction(formData: FormData) {
  await requireAdmin();
  const fromCurrency = formData.get("fromCurrency") as "EUR" | "USD" | "AOA";
  const toCurrency = formData.get("toCurrency") as "EUR" | "USD" | "AOA";
  const rate = Number(formData.get("rate"));

  await prisma.exchangeRate.upsert({
    where: { fromCurrency_toCurrency: { fromCurrency, toCurrency } },
    update: { rate },
    create: { fromCurrency, toCurrency, rate },
  });
}

export async function exportReportToExcelAction() {
  await requireAdmin();
  const ExcelJS = (await import("exceljs")).default;
  const [conversion, naoAvancou, suppliers, phases] = await Promise.all([
    getConversionRate(),
    getNaoAvancouAnalysis(),
    getTopSuppliers(),
    getAverageTimePerPhase(),
  ]);

  const workbook = new ExcelJS.Workbook();

  const summary = workbook.addWorksheet("Resumo");
  summary.addRows([
    ["Total de pedidos", conversion.total],
    ["Entregues", conversion.delivered],
    ["Não avançados", conversion.notAdvanced],
    ["Taxa de conversão (%)", conversion.conversionRate.toFixed(1)],
  ]);

  const motivos = workbook.addWorksheet("Não avançou por motivo");
  motivos.addRow(["Motivo", "Quantidade"]);
  naoAvancou.byMotivo.forEach((m) => motivos.addRow([m.name, m.value]));

  const suppliersSheet = workbook.addWorksheet("Fornecedores");
  suppliersSheet.addRow(["Fornecedor", "Usos", "Rating", "Avaliações"]);
  suppliers.forEach((s) =>
    suppliersSheet.addRow([s.name, s.usageCount, s.ratingAvg?.toFixed(1) ?? "—", s.evaluationCount]),
  );

  const phasesSheet = workbook.addWorksheet("Tempo por fase");
  phasesSheet.addRow(["Fase", "Média de dias"]);
  phases.forEach((p) => phasesSheet.addRow([p.name, p.avgDays.toFixed(1)]));

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}
