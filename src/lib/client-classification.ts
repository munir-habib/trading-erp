export type ClientClassification = "Novo" | "Recorrente" | "Inativo";

export function computeClientClassification(
  orders: { createdAt: Date | string }[],
): ClientClassification {
  if (orders.length === 0) return "Novo";

  const mostRecent = orders.reduce(
    (latest, o) => Math.max(latest, new Date(o.createdAt).getTime()),
    0,
  );
  const daysSinceLast = (Date.now() - mostRecent) / (1000 * 60 * 60 * 24);
  if (daysSinceLast > 90) return "Inativo";
  if (orders.length === 1) return "Novo";
  return "Recorrente";
}
