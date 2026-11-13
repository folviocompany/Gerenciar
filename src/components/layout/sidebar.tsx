import Link from "next/link";
import { moreNav, primaryNav } from "@/components/layout/nav-config";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProfessionalRow, ProfileRow } from "@/types/database";

type SidebarProps = {
  profile: ProfileRow;
  professional: ProfessionalRow;
};

export function Sidebar({ profile, professional }: SidebarProps) {
  const items = [...primaryNav.filter((item) => item.href !== "/mais"), ...moreNav];

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 flex-col border-r border-border bg-white/80 px-5 py-6 backdrop-blur-md lg:flex">
      <div className="px-2">
        <p className="font-display text-3xl text-foreground">Beauty Manager</p>
        <p className="mt-1 text-sm text-muted-foreground">Gestão da clínica</p>
      </div>

      <nav className="mt-10 flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const className = cn(
            "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition",
            item.enabled
              ? "text-foreground hover:bg-accent/70"
              : "cursor-not-allowed text-muted-foreground/70",
          );

          if (!item.enabled) {
            return (
              <span key={item.href} className={className}>
                <Icon className="size-4" />
                {item.label}
                <Badge className="ml-auto bg-muted text-muted-foreground">Em breve</Badge>
              </span>
            );
          }

          return (
            <Link key={item.href} href={item.href} className={className}>
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-3xl bg-accent/50 p-4">
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: professional.accent_color }}
          >
            {professional.short_name.slice(0, 1)}
          </span>
          <div>
            <p className="text-sm font-medium">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground">{professional.display_name}</p>
          </div>
        </div>
        <div className="mt-4">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
