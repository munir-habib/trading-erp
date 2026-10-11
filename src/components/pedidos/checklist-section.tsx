"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { updateDocumentStatusAction } from "@/server/actions/documents";
import type { DocStatus } from "@prisma/client";

const STATUS_CYCLE: DocStatus[] = ["POR_CRIAR", "CRIADO", "ENVIADO", "APROVADO"];
const STATUS_LABELS: Record<DocStatus, string> = {
  POR_CRIAR: "Por criar",
  CRIADO: "Criado",
  ENVIADO: "Enviado",
  APROVADO: "Aprovado",
};

export interface OrderDocumentData {
  id: string;
  name: string;
  status: DocStatus;
}

export function ChecklistSection({
  orderId,
  documents,
}: {
  orderId: string;
  documents: OrderDocumentData[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const done = documents.filter((d) => d.status === "APROVADO").length;
  const progress = documents.length > 0 ? (done / documents.length) * 100 : 0;

  function cycle(doc: OrderDocumentData) {
    const idx = STATUS_CYCLE.indexOf(doc.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    startTransition(async () => {
      await updateDocumentStatusAction(orderId, doc.id, next);
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Checklist de documentos</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            render={
              <a href={`/api/pdf/proforma-invoice?orderId=${orderId}`} target="_blank" />
            }
          >
            <FileText className="size-3.5" />
            Fatura proforma
          </Button>
          <Button
            size="sm"
            variant="outline"
            render={<a href={`/api/pdf/packing-list?orderId=${orderId}`} target="_blank" />}
          >
            <FileText className="size-3.5" />
            Packing list
          </Button>
        </div>
      </div>
      <Progress value={progress} className="h-1.5" />
      <div className="hairline overflow-hidden rounded-lg">
        {documents.map((doc) => (
          <button
            key={doc.id}
            disabled={isPending}
            onClick={() => cycle(doc)}
            className="hairline-b flex w-full items-center justify-between px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent/40"
          >
            <span>{doc.name}</span>
            <Badge variant={doc.status === "APROVADO" ? "secondary" : "outline"}>
              {STATUS_LABELS[doc.status]}
            </Badge>
          </button>
        ))}
      </div>
    </section>
  );
}
