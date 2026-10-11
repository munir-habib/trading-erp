"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { addComparisonRowAction } from "@/server/actions/comparisons";
import type { ComboboxOption } from "@/components/pickers/multi-select-combobox";

export function AddRowControl({
  comparisonId,
  variants,
}: {
  comparisonId: string;
  variants: ComboboxOption[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  function addVariant(variantId: string) {
    startTransition(async () => {
      await addComparisonRowAction(comparisonId, { variantId });
      setOpen(false);
      setQuery("");
    });
  }

  function addFreeText() {
    if (!query.trim()) return;
    startTransition(async () => {
      await addComparisonRowAction(comparisonId, { freeTextProduct: query.trim() });
      setOpen(false);
      setQuery("");
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <Plus className="size-3.5" />
        Produto
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Nome ou nome comercial..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              <button
                type="button"
                disabled={isPending || !query.trim()}
                onClick={addFreeText}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-orange-500" />
                Adicionar &quot;{query}&quot; como texto livre
              </button>
            </CommandEmpty>
            <CommandGroup>
              {variants.map((v) => (
                <CommandItem
                  key={v.id}
                  value={v.name}
                  onSelect={() => addVariant(v.id)}
                >
                  {v.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        {query.trim() && (
          <div className="hairline-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              disabled={isPending}
              onClick={addFreeText}
            >
              <span className="mr-1.5 size-1.5 shrink-0 rounded-full bg-orange-500" />
              Adicionar &quot;{query}&quot; como texto livre
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
