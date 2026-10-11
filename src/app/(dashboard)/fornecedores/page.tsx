import Link from "next/link";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listSuppliers } from "@/server/actions/suppliers";
import { listCategories } from "@/server/actions/categories";
import { SupplierFiltersBar } from "@/components/fornecedores/supplier-filters";
import { QuickAddSupplierDialog } from "@/components/fornecedores/quick-add-supplier-dialog";
import { SupplierExportButton } from "@/components/fornecedores/supplier-export-button";
import { ImportSuppliersDialog } from "@/components/fornecedores/import-suppliers-dialog";
import { getCurrentUser } from "@/lib/session";

const STATUS_VARIANT: Record<string, string> = {
  ATIVO: "bg-emerald-500/15 text-emerald-500",
  POTENCIAL: "bg-amber-500/15 text-amber-500",
  INATIVO: "bg-muted text-muted-foreground",
  NUNCA_CONTACTADO: "bg-sky-500/15 text-sky-500",
};

const STATUS_LABELS: Record<string, string> = {
  ATIVO: "Ativo",
  POTENCIAL: "Potencial",
  INATIVO: "Inativo",
  NUNCA_CONTACTADO: "Nunca contactado",
};

export default async function FornecedoresPage({
  searchParams,
}: PageProps<"/fornecedores">) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;
  const status =
    typeof params.status === "string" && params.status !== "all"
      ? params.status
      : undefined;
  const categoryId =
    typeof params.categoryId === "string" && params.categoryId !== "all"
      ? params.categoryId
      : undefined;
  const staleOnly = params.stale === "stale";

  const [suppliers, categories, user] = await Promise.all([
    listSuppliers({ search, status, categoryId, staleOnly }),
    listCategories(),
    getCurrentUser(),
  ]);

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Fornecedores</h1>
          <p className="text-sm text-muted-foreground">
            {suppliers.length} fornecedor{suppliers.length === 1 ? "" : "es"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportSuppliersDialog />
          {user?.role === "ADMIN" && <SupplierExportButton />}
          <QuickAddSupplierDialog categories={categoryOptions} />
          <Button render={<Link href="/fornecedores/novo" />}>
            Novo fornecedor
          </Button>
        </div>
      </div>

      <SupplierFiltersBar
        categories={categoryOptions}
        defaultValues={{ search, status, categoryId, stale: params.stale as string }}
      />

      {suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
          <Building2 className="size-8" />
          <p className="text-sm">Nenhum fornecedor encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <Link
              key={s.id}
              href={`/fornecedores/${s.id}`}
              className="hairline flex flex-col gap-2 rounded-lg p-4 transition-colors hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{s.name}</span>
                <Badge className={STATUS_VARIANT[s.status]} variant="secondary">
                  {STATUS_LABELS[s.status]}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {s.country || "País por completar"}
              </div>
              <div className="flex flex-wrap gap-1">
                {s.categories.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    Sem categoria
                  </span>
                )}
                {s.categories.map((c) => (
                  <Badge key={c.id} variant="outline" className="text-xs font-normal">
                    {c.name}
                  </Badge>
                ))}
              </div>
              {(!s.email && !s.phone && !s.whatsapp) && (
                <Badge variant="outline" className="w-fit text-xs font-normal text-amber-500">
                  Incompleto
                </Badge>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
