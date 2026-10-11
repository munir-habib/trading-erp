"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCategory } from "@/server/actions/categories";
import { MultiSelectCombobox, type ComboboxOption } from "@/components/pickers/multi-select-combobox";
import { presentationTypeValues } from "@/lib/validation/product";

const PRESENTATION_LABELS: Record<string, string> = {
  BLISTER: "Blister",
  FRASCO: "Frasco",
  INJETAVEL: "Injetável",
  SUSPENSAO: "Suspensão",
  INDIVIDUAL: "Individual",
};

interface PresentationDraft {
  id?: string;
  type: (typeof presentationTypeValues)[number];
  dose: string;
  qtyPerPackage: number;
  unitsPerBox: number;
}

interface VariantDraft {
  id?: string;
  name: string;
  sku: string;
  presentations: PresentationDraft[];
}

interface ProductFormProps {
  action: (formData: FormData) => void;
  categories: ComboboxOption[];
  defaultValues?: {
    name?: string;
    genericName?: string;
    categoryId?: string;
    description?: string;
    imageUrl?: string;
    variants?: VariantDraft[];
  };
  submitLabel?: string;
}

function emptyVariant(): VariantDraft {
  return { name: "", sku: "", presentations: [] };
}

function emptyPresentation(): PresentationDraft {
  return { type: "INDIVIDUAL", dose: "", qtyPerPackage: 1, unitsPerBox: 1 };
}

export function ProductForm({
  action,
  categories,
  defaultValues,
  submitLabel = "Guardar produto",
}: ProductFormProps) {
  const [categoryId, setCategoryId] = useState<string[]>(
    defaultValues?.categoryId ? [defaultValues.categoryId] : [],
  );
  const [variants, setVariants] = useState<VariantDraft[]>(
    defaultValues?.variants ?? [],
  );

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    );
  }

  function updatePresentation(
    variantIndex: number,
    presIndex: number,
    patch: Partial<PresentationDraft>,
  ) {
    setVariants((prev) =>
      prev.map((v, i) =>
        i !== variantIndex
          ? v
          : {
              ...v,
              presentations: v.presentations.map((p, pi) =>
                pi === presIndex ? { ...p, ...patch } : p,
              ),
            },
      ),
    );
  }

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-5">
      <input type="hidden" name="categoryId" value={categoryId[0] ?? ""} />
      <input type="hidden" name="variantsJson" value={JSON.stringify(variants)} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome do produto</Label>
        <Input id="name" name="name" required defaultValue={defaultValues?.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="genericName">Nome genérico</Label>
        <Input
          id="genericName"
          name="genericName"
          placeholder="ex: Ibuprofeno"
          defaultValue={defaultValues?.genericName}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Categoria</Label>
        <MultiSelectCombobox
          options={categories}
          selected={categoryId}
          onChange={setCategoryId}
          onCreate={async (name) => createCategory(name)}
          placeholder="Selecionar categoria..."
          multiple={false}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="imageUrl">Imagem (URL)</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          placeholder="https://..."
          defaultValue={defaultValues?.imageUrl}
        />
        <p className="text-xs text-muted-foreground">
          Usado para confirmar visualmente o produto certo ao escolher.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label>Variantes e apresentações</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setVariants((prev) => [...prev, emptyVariant()])}
          >
            <Plus className="size-3.5" />
            Variante
          </Button>
        </div>

        {variants.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Sem variantes ainda. Ex: Seringa 2ml, 5ml, 10ml.
          </p>
        )}

        {variants.map((variant, vIndex) => (
          <div key={vIndex} className="hairline flex flex-col gap-3 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nome da variante (ex: 5ml)"
                value={variant.name}
                onChange={(e) => updateVariant(vIndex, { name: e.target.value })}
              />
              <Input
                placeholder="SKU (opcional)"
                value={variant.sku}
                onChange={(e) => updateVariant(vIndex, { sku: e.target.value })}
                className="max-w-32"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setVariants((prev) => prev.filter((_, i) => i !== vIndex))
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-2 pl-2">
              {variant.presentations.map((pres, pIndex) => (
                <div key={pIndex} className="flex flex-wrap items-center gap-2">
                  <Select
                    value={pres.type}
                    onValueChange={(value) =>
                      updatePresentation(vIndex, pIndex, {
                        type: value as PresentationDraft["type"],
                      })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {presentationTypeValues.map((t) => (
                        <SelectItem key={t} value={t}>
                          {PRESENTATION_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Dose"
                    value={pres.dose}
                    onChange={(e) =>
                      updatePresentation(vIndex, pIndex, { dose: e.target.value })
                    }
                    className="w-24"
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="Qtd/emb."
                    value={pres.qtyPerPackage}
                    onChange={(e) =>
                      updatePresentation(vIndex, pIndex, {
                        qtyPerPackage: Number(e.target.value) || 1,
                      })
                    }
                    className="w-24"
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="Un./caixa"
                    value={pres.unitsPerBox}
                    onChange={(e) =>
                      updatePresentation(vIndex, pIndex, {
                        unitsPerBox: Number(e.target.value) || 1,
                      })
                    }
                    className="w-24"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      updateVariant(vIndex, {
                        presentations: variant.presentations.filter(
                          (_, i) => i !== pIndex,
                        ),
                      })
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-fit"
                onClick={() =>
                  updateVariant(vIndex, {
                    presentations: [...variant.presentations, emptyPresentation()],
                  })
                }
              >
                <Plus className="size-3.5" />
                Apresentação
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" className="mt-1 w-fit">
        {submitLabel}
      </Button>
    </form>
  );
}
