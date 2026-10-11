import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export default async function PorCompletarPage() {
  const [incompleteSuppliers, draftComparisons, incompleteOrders] = await Promise.all([
    prisma.supplier.findMany({
      where: { email: null, phone: null, whatsapp: null },
      take: 20,
    }),
    prisma.comparison.findMany({
      where: { status: "DRAFT" },
      include: { rows: { select: { id: true } } },
      take: 20,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.order.findMany({
      where: {
        status: { notIn: ["ENTREGUE", "NAO_AVANCOU"] },
        documents: { some: { status: { not: "APROVADO" } } },
      },
      take: 20,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Por completar</h1>
        <p className="text-sm text-muted-foreground">
          Tudo o que ficou incompleto no sistema, num único sítio.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">
          Fornecedores sem contacto ({incompleteSuppliers.length})
        </h2>
        {incompleteSuppliers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tudo completo.</p>
        ) : (
          <div className="hairline overflow-hidden rounded-lg">
            {incompleteSuppliers.map((s) => (
              <Link
                key={s.id}
                href={`/fornecedores/${s.id}`}
                className="hairline-b flex items-center justify-between px-3 py-2 text-sm last:border-b-0 hover:bg-accent/40"
              >
                {s.name}
                <Badge variant="outline" className="text-amber-500">Incompleto</Badge>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">
          Comparações por registar ({draftComparisons.length})
        </h2>
        {draftComparisons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tudo completo.</p>
        ) : (
          <div className="hairline overflow-hidden rounded-lg">
            {draftComparisons.map((c) => (
              <Link
                key={c.id}
                href={`/comparacoes/${c.id}`}
                className="hairline-b flex items-center justify-between px-3 py-2 text-sm last:border-b-0 hover:bg-accent/40"
              >
                {c.label || "Comparação sem título"}
                <span className="text-xs text-muted-foreground">{c.rows.length} produtos</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">
          Pedidos com checklist por terminar ({incompleteOrders.length})
        </h2>
        {incompleteOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tudo completo.</p>
        ) : (
          <div className="hairline overflow-hidden rounded-lg">
            {incompleteOrders.map((o) => (
              <Link
                key={o.id}
                href={`/pedidos/${o.id}`}
                className="hairline-b flex items-center justify-between px-3 py-2 text-sm last:border-b-0 hover:bg-accent/40"
              >
                {o.reference}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
