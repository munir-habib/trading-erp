import Link from "next/link";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listComparisons, createComparisonAction } from "@/server/actions/comparisons";

export default async function ComparacoesPage() {
  const comparisons = await listComparisons();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Tabela de picagem e adjudicação</h1>
          <p className="text-sm text-muted-foreground">
            {comparisons.length} comparaç{comparisons.length === 1 ? "ão" : "ões"}
          </p>
        </div>
        <form action={createComparisonAction}>
          <Button type="submit">Nova comparação</Button>
        </form>
      </div>

      {comparisons.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
          <Scale className="size-8" />
          <p className="text-sm">Ainda sem comparações. Cria a primeira.</p>
        </div>
      ) : (
        <div className="hairline overflow-hidden rounded-lg">
          {comparisons.map((c) => (
            <Link
              key={c.id}
              href={`/comparacoes/${c.id}`}
              className="hairline-b flex items-center justify-between px-4 py-3 text-sm last:border-b-0 hover:bg-accent/40"
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  {c.label || `Comparação de ${new Date(c.updatedAt).toLocaleDateString("pt-PT")}`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {c.order ? `Pedido ${c.order.reference}` : "Sem pedido associado"} ·{" "}
                  {c.rows.length} produto{c.rows.length === 1 ? "" : "s"} · Criado por{" "}
                  {c.createdBy.name}
                </span>
              </div>
              <Badge variant={c.status === "COMPLETED" ? "secondary" : "outline"}>
                {c.status === "COMPLETED" ? "Concluída" : "Rascunho"}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
