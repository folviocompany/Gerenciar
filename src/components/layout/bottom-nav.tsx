import Link from "next/link";
import { primaryNav } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-2 py-2 backdrop-blur-md lg:hidden">
      <ul className="grid grid-cols-5">
        {primaryNav.map((item) => {
          const Icon = item.icon;
          const className = cn(
            "flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[11px]",
            item.enabled ? "text-foreground" : "text-muted-foreground/60",
          );

          if (!item.enabled) {
            return (
              <li key={item.href}>
                <span className={className}>
                  <Icon className="size-5" />
                  {item.label}
                </span>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link href={item.href} className={className}>
                <Icon className="size-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
