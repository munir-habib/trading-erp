import { listFaqArticles } from "@/server/actions/documents";
import { getCurrentUser } from "@/lib/session";
import { FaqEditor } from "@/components/documentos/faq-editor";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";

export default async function DocumentosPage() {
  const [articles, user] = await Promise.all([listFaqArticles(), getCurrentUser()]);

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold">Centro de documentos</h1>
        <p className="text-sm text-muted-foreground">
          FAQ interno do processo de exportação. Os checklists ficam na página de
          cada pedido, e os templates de fatura proforma / packing list são gerados
          a partir dos dados da encomenda.
        </p>
      </div>

      <div className="hairline rounded-lg p-4 text-sm text-muted-foreground">
        Arquivo global de anexos: pendente de configuração do Supabase Storage
        (variável <code>SUPABASE_SERVICE_ROLE_KEY</code>). Assim que estiver
        configurado, os uploads guiados ficam disponíveis aqui e em cada pedido.
      </div>

      {user?.role === "ADMIN" && <FaqEditor />}

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Artigos</h2>
        {articles.length === 0 && (
          <p className="text-sm text-muted-foreground">Ainda sem artigos no FAQ.</p>
        )}
        {articles.map((a) => (
          <details key={a.id} className="hairline rounded-lg p-3">
            <summary className="cursor-pointer text-sm font-medium">{a.title}</summary>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {a.content}
            </p>
            {a.appliesToStatuses.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Aplica-se a: {a.appliesToStatuses.map((s) => ORDER_STATUS_LABELS[s]).join(", ")}
              </p>
            )}
          </details>
        ))}
      </div>
    </div>
  );
}
