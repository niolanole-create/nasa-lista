import type { Category, Effort, ActivityStatus } from "@/lib/database.types";

export const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: "izlazak", label: "Izlazak", emoji: "🍸" },
  { value: "putovanje", label: "Putovanje", emoji: "✈️" },
  { value: "hrana", label: "Hrana", emoji: "🍝" },
  { value: "kultura", label: "Kultura", emoji: "🎭" },
  { value: "aktivnost", label: "Aktivnost", emoji: "🏃" },
  { value: "kod_kuce", label: "Kod kuće", emoji: "🏠" },
  { value: "ostalo", label: "Ostalo", emoji: "✨" },
];

export const EFFORTS: { value: Effort; label: string }[] = [
  { value: "spontano", label: "Spontano" },
  { value: "treba_planirati", label: "Treba planirati" },
  { value: "veliki_poduhvat", label: "Veliki poduhvat" },
];

export const CATEGORY_LABEL = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
) as Record<Category, string>;

export const CATEGORY_EMOJI = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.emoji]),
) as Record<Category, string>;

export const EFFORT_LABEL = Object.fromEntries(
  EFFORTS.map((e) => [e.value, e.label]),
) as Record<Effort, string>;

export const STATUS_LABEL: Record<ActivityStatus, string> = {
  proposed: "Predloženo",
  accepted: "Prihvaćeno",
  declined: "Odbijeno",
  scheduled: "Zakazano",
  completed: "Urađeno",
  archived: "Arhivirano",
};

// Formatiranje iznosa u RSD.
export function formatRsd(value: number | null): string | null {
  if (value == null) return null;
  return new Intl.NumberFormat("sr-RS", {
    style: "currency",
    currency: "RSD",
    maximumFractionDigits: 0,
  }).format(value);
}
