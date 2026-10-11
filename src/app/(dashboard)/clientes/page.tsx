import Link from "next/link";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listClients } from "@/server/actions/clients";
import { importPhcClientsAction } from "@/server/actions/phc";
import { computeClientClassification } from "@/lib/client-classification";
import { ImportDialog } from "@/components/shared/import-dialog";

const CLASSIFICATION_VARIANT: Record<string, string> = {
  Novo: "bg-sky-500/15 text-sky-500",
  Recorrente: "bg-emerald-500/15 text-emerald-500",
  Inativo: "bg-muted text-muted-foreground",
};

export default async function ClientesPage() {
  const clients = await listClients();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {clients.length} cliente{clients.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportDialog
            triggerLabel="Importar (PHC)"
            title="Importar clientes do PHC"
            hint="Importação manual via Excel/CSV (opção 3 da integração PHC). Colunas: Nome, Email, Telefone, País."
            onImport={importPhcClientsAction}
          />
          <Button render={<Link href="/clientes/novo" />}>Novo cliente</Button>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
          <Users className="size-8" />
          <p className="text-sm">Nenhum cliente ainda.</p>
        </div>
      ) : (
        <div className="hairline overflow-hidden rounded-lg">
          {clients.map((c) => {
            const classification = computeClientClassification(c.orders);
            return (
              <Link
                key={c.id}
                href={`/clientes/${c.id}`}
                className="hairline-b flex items-center justify-between px-4 py-3 text-sm last:border-b-0 hover:bg-accent/40"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.country || "País por completar"} · {c.orders.length} pedido
                    {c.orders.length === 1 ? "" : "s"}
                  </span>
                </div>
                <Badge className={CLASSIFICATION_VARIANT[classification]} variant="secondary">
                  {classification}
                </Badge>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
