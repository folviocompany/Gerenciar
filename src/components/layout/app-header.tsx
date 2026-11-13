import type { ProfessionalRow } from "@/types/database";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  professional: ProfessionalRow;
};

export function AppHeader({ title, subtitle, professional }: AppHeaderProps) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Beauty Manager</p>
        <h1 className="font-display text-3xl text-foreground sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      <span
        className="hidden rounded-full px-3 py-1 text-xs font-medium text-white sm:inline-flex"
        style={{ backgroundColor: professional.accent_color }}
      >
        {professional.short_name}
      </span>
    </header>
  );
}
