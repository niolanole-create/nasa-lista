"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDatumVreme, relativniDatum } from "@/lib/ui";

type Termin = { id: string; title: string; scheduledAt: string; color: string };
type Ideja = { id: string; title: string };

const MESECI = [
  "januar",
  "februar",
  "mart",
  "april",
  "maj",
  "jun",
  "jul",
  "avgust",
  "septembar",
  "oktobar",
  "novembar",
  "decembar",
];
const DANI = ["pon", "uto", "sre", "čet", "pet", "sub", "ned"];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default function Kalendar({
  termini,
  ideje,
}: {
  termini: Termin[];
  ideje: Ideja[];
}) {
  const router = useRouter();
  const danas = new Date();
  const [god, setGod] = useState(danas.getFullYear());
  const [mesec, setMesec] = useState(danas.getMonth());
  const [izabraniDan, setIzabraniDan] = useState<string | null>(null);
  const [ideja, setIdeja] = useState("");
  const [radim, setRadim] = useState(false);

  // Mapa: "YYYY-MM-DD" → termini tog dana.
  const poDanu = new Map<string, Termin[]>();
  for (const t of termini) {
    const k = ymd(new Date(t.scheduledAt));
    poDanu.set(k, [...(poDanu.get(k) ?? []), t]);
  }

  const prvi = new Date(god, mesec, 1);
  const pomak = (prvi.getDay() + 6) % 7; // ponedeljak = 0
  const brojDana = new Date(god, mesec + 1, 0).getDate();
  const celije: (number | null)[] = [
    ...Array(pomak).fill(null),
    ...Array.from({ length: brojDana }, (_, i) => i + 1),
  ];

  function promeni(delta: number) {
    const m = mesec + delta;
    setGod(god + Math.floor(m / 12));
    setMesec(((m % 12) + 12) % 12);
    setIzabraniDan(null);
  }

  async function predloziZaDan() {
    if (!ideja || !izabraniDan) return;
    setRadim(true);
    // podrazumevano 20:00 lokalno
    const iso = new Date(`${izabraniDan}T20:00`).toISOString();
    const supabase = createClient();
    await supabase.rpc("propose_date", {
      p_activity_id: ideja,
      p_proposed_at: iso,
    });
    setRadim(false);
    setIzabraniDan(null);
    setIdeja("");
    router.refresh();
  }

  const nadolazeci = [...termini]
    .filter((t) => new Date(t.scheduledAt) >= new Date(danas.toDateString()))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  const daniIzabranog = izabraniDan ? (poDanu.get(izabraniDan) ?? []) : [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => promeni(-1)}
          className="min-h-[44px] min-w-[44px] rounded-lg border border-border"
          aria-label="Prethodni mesec"
        >
          ‹
        </button>
        <span className="font-display text-lg font-semibold">
          {MESECI[mesec]} {god}.
        </span>
        <button
          type="button"
          onClick={() => promeni(1)}
          className="min-h-[44px] min-w-[44px] rounded-lg border border-border"
          aria-label="Sledeći mesec"
        >
          ›
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {DANI.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
        {celije.map((dan, i) => {
          if (dan === null) return <div key={`p${i}`} />;
          const k = ymd(new Date(god, mesec, dan));
          const ima = poDanu.get(k);
          const jeDanas = k === ymd(danas);
          return (
            <button
              key={k}
              type="button"
              onClick={() => setIzabraniDan(k)}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg text-sm ${
                izabraniDan === k
                  ? "bg-accent-a text-white"
                  : jeDanas
                    ? "bg-background font-semibold"
                    : ""
              }`}
            >
              {dan}
              {ima && (
                <span className="mt-0.5 flex gap-0.5">
                  {ima.slice(0, 3).map((t) => (
                    <span
                      key={t.id}
                      className="h-1 w-1 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {izabraniDan && (
        <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm font-medium">{izabraniDan}</p>
          {daniIzabranog.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {daniIzabranog.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/aktivnost/${t.id}`}
                    className="text-accent-a underline"
                  >
                    {t.title} · {formatDatumVreme(t.scheduledAt)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {ideje.length > 0 ? (
            <div className="mt-3 flex flex-col gap-2">
              <label className="text-sm text-muted">
                Predloži termin za ovaj dan (20:00):
              </label>
              <div className="flex gap-2">
                <select
                  value={ideja}
                  onChange={(e) => setIdeja(e.target.value)}
                  className="min-h-[44px] flex-1 rounded-lg border border-border bg-background px-2 text-sm"
                >
                  <option value="">— izaberi ideju —</option>
                  {ideje.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={predloziZaDan}
                  disabled={!ideja || radim}
                  className="min-h-[44px] rounded-lg bg-accent-a px-4 text-sm font-medium text-white disabled:opacity-60"
                >
                  Predloži
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Nema prihvaćenih ideja za zakazivanje.
            </p>
          )}
        </div>
      )}

      <section className="mt-8">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted">
          Nadolazeće
        </h2>
        {nadolazeci.length === 0 ? (
          <p className="text-sm text-muted">Nema zakazanih termina.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {nadolazeci.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3"
              >
                <Link href={`/aktivnost/${t.id}`} className="min-w-0">
                  <span className="block truncate font-medium">{t.title}</span>
                  <span className="text-xs text-muted">
                    {formatDatumVreme(t.scheduledAt)} ·{" "}
                    {relativniDatum(t.scheduledAt)}
                  </span>
                </Link>
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
