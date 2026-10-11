import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getProduct, suggestSuppliersFromFamily } from "@/server/actions/products";
import { updateProductAction } from "@/server/actions/products";
import { listCategories } from "@/server/actions/categories";
import { ProductForm } from "@/components/produtos/product-form";
import { Badge } from "@/components/ui/badge";

export default async function ProductDetailPage({
  params,
}: PageProps<"/produtos/[id]">) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProduct(id),
    listCategories(),
  ]);

  if (!product) notFound();

  const familySuggestions = await suggestSuppliersFromFamily(id);

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div className="flex items-start gap-4">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={64}
            height={64}
            className="hairline size-16 shrink-0 rounded-lg object-cover"
            unoptimized
          />
        )}
        <div>
          <h1 className="text-lg font-semibold">{product.name}</h1>
          {product.genericName && (
            <p className="text-sm text-muted-foreground">
              Genérico: {product.genericName}
            </p>
          )}
        </div>
      </div>

      {familySuggestions.length > 0 && (
        <div className="hairline flex flex-col gap-2 rounded-lg p-4">
          <p className="text-sm">
            Este produto ainda não tem fornecedor associado. Fornecedores da
            mesma categoria:
          </p>
          <div className="flex flex-wrap gap-2">
            {familySuggestions.map((s) => (
              <Link key={s.id} href={`/fornecedores/${s.id}`}>
                <Badge variant="secondary">{s.name}</Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      <ProductForm
        action={updateProductAction.bind(null, product.id)}
        categories={categories}
        submitLabel="Guardar alterações"
        defaultValues={{
          name: product.name,
          genericName: product.genericName ?? "",
          categoryId: product.categoryId ?? "",
          description: product.description ?? "",
          imageUrl: product.imageUrl ?? "",
          variants: product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku ?? "",
            presentations: v.presentations.map((p) => ({
              id: p.id,
              type: p.type,
              dose: p.dose ?? "",
              qtyPerPackage: p.qtyPerPackage,
              unitsPerBox: p.unitsPerBox,
            })),
          })),
        }}
      />

      {product.variants.some((v) => v.priceHistory.length > 0) && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Histórico de preços</h2>
          <div className="hairline overflow-hidden rounded-lg">
            {product.variants.flatMap((v) =>
              v.priceHistory.map((ph) => (
                <div
                  key={ph.id}
                  className="hairline-b flex items-center justify-between px-3 py-2 text-sm last:border-b-0"
                >
                  <span>
                    {v.name} — {ph.supplier.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ph.pricePerBox.toFixed(2)} {ph.currency} ·{" "}
                    {new Date(ph.recordedAt).toLocaleDateString("pt-PT")}
                  </span>
                </div>
              )),
            )}
          </div>
        </section>
      )}
    </div>
  );
}
