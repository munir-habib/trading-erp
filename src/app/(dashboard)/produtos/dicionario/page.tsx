import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  listCommercialMappings,
  createCommercialMappingAction,
} from "@/server/actions/products";
import { DeleteMappingButton } from "@/components/produtos/delete-mapping-button";

export default async function DicionarioPage() {
  const mappings = await listCommercialMappings();

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold">Dicionário nome comercial → genérico</h1>
        <p className="text-sm text-muted-foreground">
          Essencial para comparar preços entre fornecedores que usam nomes
          diferentes para o mesmo princípio ativo.
        </p>
      </div>

      <form action={createCommercialMappingAction} className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="commercialName">Nome comercial</Label>
          <Input id="commercialName" name="commercialName" placeholder="ex: Brufen" required />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="genericName">Nome genérico</Label>
          <Input id="genericName" name="genericName" placeholder="ex: Ibuprofeno" required />
        </div>
        <Button type="submit">Adicionar</Button>
      </form>

      <div className="hairline overflow-hidden rounded-lg">
        {mappings.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            Ainda sem entradas no dicionário.
          </p>
        )}
        {mappings.map((m) => (
          <div
            key={m.id}
            className="hairline-b flex items-center justify-between px-3 py-2 text-sm last:border-b-0"
          >
            <span>
              {m.commercialName} → {m.genericName}
            </span>
            <DeleteMappingButton id={m.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
