import { Paperclip } from "lucide-react";
import { listAttachments, checkStorageConfigured } from "@/server/actions/attachments";
import { AttachmentUploadWizard } from "@/components/shared/attachment-upload-wizard";
import { AttachmentActions } from "@/components/shared/attachment-download-button";
import { formatCreatedBy } from "@/lib/format";

interface Target {
  orderId?: string;
  supplierId?: string;
  clientId?: string;
}

export async function AttachmentsSection({ target }: { target: Target }) {
  const [attachments, configured] = await Promise.all([
    listAttachments(target),
    checkStorageConfigured(),
  ]);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Anexos</h2>
        {configured && <AttachmentUploadWizard target={target} />}
      </div>

      {!configured && (
        <p className="text-sm text-muted-foreground">
          Upload de anexos pendente de configuração do Supabase Storage
          (<code>SUPABASE_SERVICE_ROLE_KEY</code> no <code>.env.local</code>).
        </p>
      )}

      {configured && attachments.length === 0 && (
        <div className="flex flex-col items-center gap-1 py-6 text-center text-sm text-muted-foreground">
          <Paperclip className="size-5" />
          Ainda sem anexos.
        </div>
      )}

      {attachments.length > 0 && (
        <div className="hairline overflow-hidden rounded-lg">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="hairline-b flex items-center justify-between px-3 py-2 text-sm last:border-b-0"
            >
              <div className="flex flex-col">
                <span>{a.label || a.filename}</span>
                <span className="text-xs text-muted-foreground">
                  {a.filename} · {formatCreatedBy(a.uploadedBy)} ·{" "}
                  {new Date(a.createdAt).toLocaleDateString("pt-PT")}
                </span>
              </div>
              <AttachmentActions id={a.id} target={target} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
