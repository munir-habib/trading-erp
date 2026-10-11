"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteCommercialMappingAction } from "@/server/actions/products";

export function DeleteMappingButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={() => startTransition(() => deleteCommercialMappingAction(id))}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}
