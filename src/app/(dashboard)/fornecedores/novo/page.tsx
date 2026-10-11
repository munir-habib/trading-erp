import { SupplierForm } from "@/components/fornecedores/supplier-form";
import { createSupplierAction } from "@/server/actions/suppliers";
import { listCategories, listCertifications } from "@/server/actions/categories";
import { listUsers } from "@/server/actions/users";
import { getCurrentUser } from "@/lib/session";

export default async function NovoFornecedorPage() {
  const [categories, certifications, users, user] = await Promise.all([
    listCategories(),
    listCertifications(),
    listUsers(),
    getCurrentUser(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Novo fornecedor</h1>
      <SupplierForm
        action={createSupplierAction}
        categories={categories}
        certifications={certifications}
        users={users.filter((u) => u.id !== user?.id)}
        currentUserRole={user?.role ?? "USER"}
      />
    </div>
  );
}
