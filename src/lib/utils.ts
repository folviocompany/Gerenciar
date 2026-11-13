import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CLINIC_TIME_ZONE = "America/Sao_Paulo";

export function calendarDateInClinic(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function monthRangeInClinic(date = new Date()): {
  start: string;
  end: string;
  label: string;
} {
  const today = calendarDateInClinic(date);
  const [year, month] = today.split("-");
  const start = `${year}-${month}-01`;
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  const end = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: CLINIC_TIME_ZONE,
  }).format(date);

  return { start, end, label };
}

export function formatSharePercent(basisPoints: number): string {
  return `${(basisPoints / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;
}
