"use client";

import { useState, useTransition } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  id: string;
  name: string;
}

interface MultiSelectComboboxProps {
  options: ComboboxOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  onCreate?: (name: string) => Promise<ComboboxOption>;
  placeholder?: string;
  multiple?: boolean;
}

export function MultiSelectCombobox({
  options,
  selected,
  onChange,
  onCreate,
  placeholder = "Selecionar...",
  multiple = true,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [localOptions, setLocalOptions] = useState(options);
  const [isPending, startTransition] = useTransition();

  const selectedOptions = localOptions.filter((o) => selected.includes(o.id));
  const exactMatch = localOptions.some(
    (o) => o.name.toLowerCase() === query.trim().toLowerCase(),
  );

  function toggle(id: string) {
    if (multiple) {
      onChange(
        selected.includes(id)
          ? selected.filter((s) => s !== id)
          : [...selected, id],
      );
    } else {
      onChange(selected.includes(id) ? [] : [id]);
      setOpen(false);
    }
  }

  function handleCreate() {
    if (!onCreate || !query.trim()) return;
    startTransition(async () => {
      const created = await onCreate(query.trim());
      setLocalOptions((prev) => [...prev, created]);
      onChange(multiple ? [...selected, created.id] : [created.id]);
      setQuery("");
      if (!multiple) setOpen(false);
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="h-auto min-h-8 w-full justify-between px-2.5 py-1.5 font-normal"
          />
        }
      >
        <div className="flex flex-wrap gap-1">
          {selectedOptions.length === 0 && (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          {selectedOptions.map((o) => (
            <Badge key={o.id} variant="secondary" className="font-normal">
              {o.name}
            </Badge>
          ))}
        </div>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[--anchor-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Pesquisar..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {onCreate ? (
                <button
                  type="button"
                  disabled={isPending || !query.trim()}
                  onClick={handleCreate}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                >
                  <Plus className="size-4" />
                  Criar &quot;{query}&quot;
                </button>
              ) : (
                "Sem resultados."
              )}
            </CommandEmpty>
            <CommandGroup>
              {localOptions.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.name}
                  onSelect={() => toggle(option.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      selected.includes(option.id) ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option.name}
                </CommandItem>
              ))}
              {onCreate && query.trim() && !exactMatch && localOptions.length > 0 && (
                <CommandItem onSelect={handleCreate} disabled={isPending}>
                  <Plus className="mr-2 size-4" />
                  Criar &quot;{query}&quot;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
