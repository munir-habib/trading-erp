import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getSupplier, updateSupplierAction } from "@/server/actions/suppliers";
import { listCategories, listCertifications } from "@/server/actions/categories";
import { listUsers } from "@/server/actions/users";
import { getCurrentUser } from "@/lib/session";
import { getAuditTrail, formatCreatedBy } from "@/lib/audit";
import { SupplierForm } from "@/components/fornecedores/supplier-form";
import { SupplierNewsBanner } from "@/components/fornecedores/supplier-news-banner";
import { AttachmentsSection } from "@/components/shared/attachments-section";

function suggestNextStep(supplier: NonNullable<Awaited<ReturnType<typeof getSupplier>>>) {
  if (!supplier.email && !supplier.phone && !supplier.whatsapp) {
    return "Adicionar um contacto (email, WhatsApp ou telefone).";
  }
  if (supplier.categories.length === 0) {
    return "Associar pelo menos uma categoria de produto.";
  }
  if (supplier.status === "NUNCA_CONTACTADO") {
    return "Fazer o primeiro contacto e atualizar o estado.";
  }
  if (supplier.certifications.length === 0) {
    return "Registar certificações (GMP, ISO, INFARMED...) se aplicável.";
  }
  return "Perfil completo — usa este fornecedor numa comparação de preços.";
}

export default async function SupplierDetailPage({
  params,
}: PageProps<"/fornecedores/[id]">) {
  const { id } = await params;
  const [supplier, categories, certifications, users, user] = await Promise.all([
    getSupplier(id),
    listCategories(),
    listCertifications(),
    listUsers(),
    getCurrentUser(),
  ]);

  if (!supplier) notFound();

  const auditTrail = await getAuditTrail("Supplier", id);

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">{supplier.name}</h1>
          <p className="text-sm text-muted-foreground">
            Criado por {formatCreatedBy(supplier.createdBy, supplier.onBehalfOf)}
          </p>
        </div>
        {supplier.ratingAvg != null && (
          <Badge variant="secondary">★ {supplier.ratingAvg.toFixed(1)}</Badge>
        )}
      </div>

      <SupplierNewsBanner supplierId={supplier.id} />

      <div className="hairline flex items-center gap-2 rounded-lg px-4 py-3 text-sm">
        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
        <span>{suggestNextStep(supplier)}</span>
      </div>

      <SupplierForm
        action={updateSupplierAction.bind(null, supplier.id)}
        categories={categories}
        certifications={certifications}
        users={users.filter((u) => u.id !== user?.id)}
        currentUserRole={user?.role ?? "USER"}
        submitLabel="Guardar alterações"
        defaultValues={{
          name: supplier.name,
          email: supplier.email,
          whatsapp: supplier.whatsapp,
          phone: supplier.phone,
          country: supplier.country,
          status: supplier.status,
          driveLink: supplier.driveLink,
          notes: supplier.notes,
          categoryIds: supplier.categories.map((c) => c.id),
          certificationIds: supplier.certifications.map((c) => c.certificationId),
        }}
      />

      {supplier.driveLink && (
        <a
          href={supplier.driveLink}
          target="_blank"
          rel="noreferrer"
          className="flex w-fit items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ExternalLink className="size-3.5" />
          Abrir pasta no Google Drive
        </a>
      )}

      <AttachmentsSection target={{ supplierId: supplier.id }} />

      {supplier.productCodes.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Produtos deste fornecedor</h2>
          <div className="hairline overflow-hidden rounded-lg">
            {supplier.productCodes.map((pc) => (
              <div
                key={pc.id}
                className="hairline-b flex items-center justify-between px-3 py-2 text-sm last:border-b-0"
              >
                <span>
                  {pc.variant.product.name} — {pc.variant.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  Código: {pc.supplierCode}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {supplier.priceHistory.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Histórico de preços</h2>
          <div className="hairline overflow-hidden rounded-lg">
            {supplier.priceHistory.map((ph) => (
              <div
                key={ph.id}
                className="hairline-b flex items-center justify-between px-3 py-2 text-sm last:border-b-0"
              >
                <span>
                  {ph.variant.product.name} — {ph.variant.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {ph.pricePerBox.toFixed(2)} {ph.currency} ·{" "}
                  {new Date(ph.recordedAt).toLocaleDateString("pt-PT")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {auditTrail.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Histórico</h2>
          <div className="hairline overflow-hidden rounded-lg">
            {auditTrail.map((event) => (
              <div
                key={event.id}
                className="hairline-b flex flex-col gap-0.5 px-3 py-2 text-xs last:border-b-0"
              >
                <span>
                  {formatCreatedBy(event.actor, event.onBehalfOf)} · {event.action}
                  {event.note ? ` · ${event.note}` : ""}
                </span>
                <span className="text-muted-foreground">
                  {new Date(event.createdAt).toLocaleString("pt-PT")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
