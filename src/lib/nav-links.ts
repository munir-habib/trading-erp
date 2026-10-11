import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  Scale,
  Building2,
  Package,
  Users,
  FileStack,
  Ship,
  BarChart3,
  Settings,
  ListChecks,
} from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/pedidos", label: "Pedidos", icon: LayoutGrid },
  { href: "/comparacoes", label: "Picagem", icon: Scale },
  { href: "/fornecedores", label: "Fornecedores", icon: Building2 },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/documentos", label: "Documentos", icon: FileStack },
  { href: "/transitarios", label: "Transitários", icon: Ship },
  { href: "/por-completar", label: "Por completar", icon: ListChecks },
  { href: "/analises", label: "Análises", icon: BarChart3, adminOnly: true },
  { href: "/configuracoes", label: "Configurações", icon: Settings, adminOnly: true },
];
