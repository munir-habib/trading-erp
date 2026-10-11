import { notFound } from "next/navigation";
import Link from "next/link";
import { getComparison } from "@/server/actions/comparisons";
import { listSuppliers } from "@/server/actions/suppliers";
import { listAllVariants } from "@/server/actions/products";
import { ComparisonGrid } from "@/components/comparacoes/comparison-grid";
import { DraftBanner } from "@/components/comparacoes/draft-banner";

export default async function ComparisonDetailPage({
  params,
}: PageProps<"/comparacoes/[id]">) {
  const { id } = await params;
  const [comparison, suppliers, variants] = await Promise.all([
    getComparison(id),
    listSuppliers(),
    listAllVariants(),
  ]);

  if (!comparison) notFound();

  const pendingCount = comparison.rows.filter(
    (row) =>
      row.cells.some((c) => c.pricePerBox != null) &&
      !row.cells.some((c) => c.isAwarded),
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">
          {comparison.label || "Comparação de preços"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {comparison.order ? (
            <>
              Associada ao pedido{" "}
              <Link href={`/pedidos/${comparison.order.id}`} className="hover:underline">
                {comparison.order.reference}
              </Link>
            </>
          ) : (
            "Sem pedido associado"
          )}{" "}
          · Criado por {comparison.createdBy.name}
        </p>
      </div>

      <DraftBanner pendingCount={pendingCount} />

      <ComparisonGrid
        comparisonId={comparison.id}
        orderId={comparison.orderId}
        rows={comparison.rows.map((row) => ({
          id: row.id,
          freeTextProduct: row.freeTextProduct,
          variant: row.variant
            ? {
                name: row.variant.name,
                product: {
                  name: row.variant.product.name,
                  category: row.variant.product.category
                    ? { riskLevel: row.variant.product.category.riskLevel }
                    : null,
                },
                presentations: row.variant.presentations.map((p) => ({
                  unitsPerBox: p.unitsPerBox,
                })),
              }
            : null,
          cells: row.cells.map((cell) => ({
            id: cell.id,
            supplierId: cell.supplierId,
            supplier: {
              id: cell.supplier.id,
              name: cell.supplier.name,
              evaluations: cell.supplier.evaluations,
            },
            pricePerBox: cell.pricePerBox,
            currency: cell.currency,
            unitsPerBoxOverride: cell.unitsPerBoxOverride,
            quoteExpiresAt: cell.quoteExpiresAt ? cell.quoteExpiresAt.toISOString() : null,
            isAwarded: cell.isAwarded,
          })),
        }))}
        allSuppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
        allVariants={variants}
      />
    </div>
  );
}
