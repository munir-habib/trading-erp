import { ProductForm } from "@/components/produtos/product-form";
import { createProductAction } from "@/server/actions/products";
import { listCategories } from "@/server/actions/categories";

export default async function NovoProdutoPage() {
  const categories = await listCategories();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Novo produto</h1>
      <ProductForm action={createProductAction} categories={categories} />
    </div>
  );
}
