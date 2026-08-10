import type { Activity, Profile } from "@/lib/database.types";

// Boja predlagača; podrazumevana neutralna ako profil nije nađen.
export function accentOf(id: string | null, members: Profile[]): string {
  return members.find((m) => m.id === id)?.accent_color ?? "#8a8f88";
}

// Traka kartice: boja predlagača dok je „moje"; gradijent obe boje kad je
// „naše" (oboje prihvatili) — potpis brenda (spec sekcija 6).
export function barBackground(activity: Activity, members: Profile[]): string {
  const zajednicka = ["accepted", "scheduled", "completed"].includes(
    activity.status,
  );
  if (zajednicka && members.length >= 2) {
    const a = members[0].accent_color ?? "#0F6B6B";
    const b = members[1].accent_color ?? "#B0335F";
    return `linear-gradient(180deg, ${a}, ${b})`;
  }
  return accentOf(activity.created_by, members);
}

// Pun datum i vreme: „pet, 15.09.2026. u 20:00".
export function formatDatumVreme(iso: string): string {
  return new Date(iso).toLocaleString("sr-RS", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// „za 4 dana", „danas", „pre 2 dana" — relativan opis datuma.
export function relativniDatum(iso: string): string {
  const cilj = new Date(iso);
  const danas = new Date();
  const d = Math.round(
    (new Date(cilj.getFullYear(), cilj.getMonth(), cilj.getDate()).getTime() -
      new Date(
        danas.getFullYear(),
        danas.getMonth(),
        danas.getDate(),
      ).getTime()) /
      86400000,
  );
  if (d === 0) return "danas";
  if (d === 1) return "sutra";
  if (d === -1) return "juče";
  if (d > 1) return `za ${d} dana`;
  return `pre ${Math.abs(d)} dana`;
}
