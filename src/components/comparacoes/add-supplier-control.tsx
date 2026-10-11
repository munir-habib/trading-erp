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
import { addComparisonSupplierAction } from "@/server/actions/comparisons";
import type { ComboboxOption } from "@/components/pickers/multi-select-combobox";

export function AddSupplierControl({
  comparisonId,
  suppliers,
  excludeIds,
}: {
  comparisonId: string;
  suppliers: ComboboxOption[];
  excludeIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const options = suppliers.filter((s) => !excludeIds.includes(s.id));

  function add(id: string) {
    startTransition(async () => {
      await addComparisonSupplierAction(comparisonId, id);
      setOpen(false);
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" size="sm" disabled={isPending} />}>
        <Plus className="size-3.5" />
        Fornecedor
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Pesquisar fornecedor..." />
          <CommandList>
            <CommandEmpty>Sem resultados.</CommandEmpty>
            <CommandGroup>
              {options.map((s) => (
                <CommandItem key={s.id} value={s.name} onSelect={() => add(s.id)}>
                  {s.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
