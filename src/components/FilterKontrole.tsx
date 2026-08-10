"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, EFFORTS } from "@/lib/enums";

const polje =
  "min-h-[40px] rounded-lg border border-border bg-surface px-2 text-sm outline-none focus:border-accent-a";

export default function FilterKontrole({
  partnerName,
}: {
  partnerName: string | null;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function postavi(kljuc: string, vrednost: string) {
    const p = new URLSearchParams(params.toString());
    if (vrednost === "sve") p.delete(kljuc);
    else p.set(kljuc, vrednost);
    router.push(`/ideje?${p.toString()}`);
  }

  const val = (k: string, d = "sve") => params.get(k) ?? d;

  return (
    <div className="grid grid-cols-2 gap-2">
      <select
        aria-label="Kategorija"
        value={val("kat")}
        onChange={(e) => postavi("kat", e.target.value)}
        className={polje}
      >
        <option value="sve">Sve kategorije</option>
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.emoji} {c.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Trud"
        value={val("trud")}
        onChange={(e) => postavi("trud", e.target.value)}
        className={polje}
      >
        <option value="sve">Bilo koliko truda</option>
        {EFFORTS.map((ef) => (
          <option key={ef.value} value={ef.value}>
            {ef.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Ko je predložio"
        value={val("ko")}
        onChange={(e) => postavi("ko", e.target.value)}
        className={polje}
      >
        <option value="sve">Oboje predložili</option>
        <option value="ja">Ja</option>
        <option value="partner">{partnerName ?? "Partner"}</option>
      </select>

      <select
        aria-label="Sortiranje"
        value={val("sort", "najnovije")}
        onChange={(e) => postavi("sort", e.target.value)}
        className={polje}
      >
        <option value="najnovije">Najnovije</option>
        <option value="najstarije">Najstarije</option>
        <option value="rok">Po roku</option>
      </select>
    </div>
  );
}
