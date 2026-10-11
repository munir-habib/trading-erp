import Link from "next/link";
import { Package, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listProducts } from "@/server/actions/products";
import { importPhcProductsAction } from "@/server/actions/phc";
import { ImportDialog } from "@/components/shared/import-dialog";

export default async function ProdutosPage({
  searchParams,
}: PageProps<"/produtos">) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;
  const products = await listProducts(search);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Catálogo de produtos</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} produto{products.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportDialog
            triggerLabel="Importar (PHC)"
            title="Importar produtos do PHC"
            hint="Importação manual via Excel/CSV (opção 3 da integração PHC). Colunas: Nome, Genérico."
            onImport={importPhcProductsAction}
          />
          <Button variant="outline" render={<Link href="/produtos/dicionario" />}>
            <BookOpen className="size-4" />
            Dicionário nome comercial
          </Button>
          <Button render={<Link href="/produtos/novo" />}>Novo produto</Button>
        </div>
      </div>

      <form method="get" className="hairline-b pb-4">
        <Input
          name="search"
          placeholder="Pesquisar por nome, genérico ou variante..."
          defaultValue={search}
          className="max-w-sm"
        />
      </form>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
          <Package className="size-8" />
          <p className="text-sm">Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/produtos/${p.id}`}
              className="hairline flex flex-col gap-2 rounded-lg p-4 transition-colors hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{p.name}</span>
                {p.category && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {p.category.name}
                  </Badge>
                )}
              </div>
              {p.genericName && (
                <span className="text-xs text-muted-foreground">
                  Genérico: {p.genericName}
                </span>
              )}
              <div className="flex flex-wrap gap-1">
                {p.variants.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    Sem variantes
                  </span>
                ) : (
                  p.variants.map((v) => (
                    <Badge key={v.id} variant="secondary" className="text-xs font-normal">
                      {v.name}
                    </Badge>
                  ))
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
