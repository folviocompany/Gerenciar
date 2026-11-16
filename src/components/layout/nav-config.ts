import {
  CalendarDays,
  CircleUserRound,
  LayoutDashboard,
  MoreHorizontal,
  Settings2,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
  mobile?: boolean;
};

export const primaryNav: NavItem[] = [
  { href: "/", label: "Início", icon: LayoutDashboard, enabled: true, mobile: true },
  { href: "/agenda", label: "Agenda", icon: CalendarDays, enabled: false, mobile: true },
  { href: "/clientes", label: "Clientes", icon: CircleUserRound, enabled: false, mobile: true },
  { href: "/financeiro", label: "Financeiro", icon: Wallet, enabled: true, mobile: true },
  { href: "/mais", label: "Mais", icon: MoreHorizontal, enabled: true, mobile: true },
];

export const moreNav: NavItem[] = [
  { href: "/configuracoes", label: "Configurações", icon: Settings2, enabled: true },
];
