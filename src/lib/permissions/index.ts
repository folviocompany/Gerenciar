import type { ProfessionalSlug } from "@/types/database";

export const PROFESSIONAL_SLUGS = ["ester", "izabela"] as const;

export function isProfessionalSlug(value: string): value is ProfessionalSlug {
  return PROFESSIONAL_SLUGS.includes(value as ProfessionalSlug);
}

export function canMutateExpense(
  actorSlug: ProfessionalSlug,
  responsibility: "ester" | "izabela" | "shared",
): boolean {
  return responsibility === "shared" || responsibility === actorSlug;
}

export function canMutateOwnFinancial(
  actorProfessionalId: string,
  recordProfessionalId: string,
): boolean {
  return actorProfessionalId === recordProfessionalId;
}
