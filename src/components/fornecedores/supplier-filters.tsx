import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ComboboxOption } from "@/components/pickers/multi-select-combobox";

const STATUS_OPTIONS = [
  { value: "ATIVO", label: "Ativo" },
  { value: "POTENCIAL", label: "Potencial" },
  { value: "INATIVO", label: "Inativo" },
  { value: "NUNCA_CONTACTADO", label: "Nunca contactado" },
];

export function SupplierFiltersBar({
  categories,
  defaultValues,
}: {
  categories: ComboboxOption[];
  defaultValues: {
    search?: string;
    status?: string;
    categoryId?: string;
    stale?: string;
  };
}) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-2.5 hairline-b pb-4"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Pesquisar</label>
        <Input
          name="search"
          placeholder="Nome do fornecedor..."
          defaultValue={defaultValues.search}
          className="w-48"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Estado</label>
        <Select name="status" defaultValue={defaultValues.status || "all"}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Categoria</label>
        <Select name="categoryId" defaultValue={defaultValues.categoryId || "all"}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Atualização</label>
        <Select name="stale" defaultValue={defaultValues.stale || "all"}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="stale">Sem atualização há 30+ dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" variant="secondary">
        Filtrar
      </Button>
    </form>
  );
}
