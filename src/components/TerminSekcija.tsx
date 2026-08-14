"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ActivityStatus } from "@/lib/database.types";
import { formatDatumVreme, relativniDatum } from "@/lib/ui";

type Props = {
  activityId: string;
  status: ActivityStatus;
  scheduledAt: string | null;
};

const SAT = 19; // podrazumevano veče (19h) — bira se samo datum

// Lokalni datum (YYYY-MM-DD) iz ISO timestampa, za popunjavanje inputa.
function lokalniDatum(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function TerminSekcija({
  activityId,
  status,
  scheduledAt,
}: Props) {
  const router = useRouter();
  const [radim, setRadim] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [formaOtvorena, setFormaOtvorena] = useState(false);
  const [datum, setDatum] = useState("");

  // Zakaži / promeni datum direktno (RLS dozvoljava izmenu u okviru para;
  // audit trigger sam beleži promenu stanja).
  async function postavi(e: React.FormEvent) {
    e.preventDefault();
    if (!datum) return;
    setRadim(true);
    setGreska(null);
    const iso = new Date(`${datum}T${String(SAT).padStart(2, "0")}:00`).toISOString();
    const { error } = await createClient()
      .from("activities")
      .update({ status: "scheduled", scheduled_at: iso })
      .eq("id", activityId);
    if (error) {
      setGreska(error.message);
      setRadim(false);
      return;
    }
    setFormaOtvorena(false);
    setDatum("");
    setRadim(false);
    router.refresh();
  }

  // Otkaži termin: vrati na listu (accepted), obriši datum.
  async function otkazi() {
    setRadim(true);
    setGreska(null);
    const { error } = await createClient()
      .from("activities")
      .update({ status: "accepted", scheduled_at: null })
      .eq("id", activityId);
    if (error) {
      setGreska(error.message);
      setRadim(false);
      return;
    }
    setRadim(false);
    router.refresh();
  }

  function otvoriFormu() {
    setDatum(scheduledAt ? lokalniDatum(scheduledAt) : "");
    setFormaOtvorena(true);
  }

  // Zakazano: prikaz termina + izmena / otkazivanje + .ics.
  if (status === "scheduled" && scheduledAt && !formaOtvorena) {
    return (
      <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">
          Termin
        </h2>
        <p className="mt-2 text-lg font-medium">
          {formatDatumVreme(scheduledAt)}
        </p>
        <p className="text-sm text-muted">{relativniDatum(scheduledAt)}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={`/aktivnost/${activityId}/ics`}
            className="min-h-[44px] rounded-xl border border-border px-4 text-sm font-medium leading-[44px]"
          >
            Dodaj u kalendar (.ics)
          </a>
          <button
            type="button"
            onClick={otvoriFormu}
            disabled={radim}
            className="min-h-[44px] rounded-xl border border-border px-4 text-sm font-medium disabled:opacity-60"
          >
            Promeni datum
          </button>
          <button
            type="button"
            onClick={otkazi}
            disabled={radim}
            className="min-h-[44px] rounded-xl border border-border px-4 text-sm text-accent-b disabled:opacity-60"
          >
            Otkaži termin
          </button>
        </div>
        {greska && <p className="mt-2 text-sm text-accent-b">{greska}</p>}
      </section>
    );
  }

  // Datum se bira kad je ideja na listi (accepted) ili kad menjaš postojeći termin.
  if (status !== "accepted" && status !== "scheduled") return null;

  return (
    <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">
        Kad ćete?
      </h2>
      <form onSubmit={postavi} className="mt-3 flex flex-col gap-3">
        <label htmlFor="datum" className="text-sm text-muted">
          Datum
        </label>
        <input
          id="datum"
          type="date"
          required
          value={datum}
          onChange={(e) => setDatum(e.target.value)}
          className="min-h-[44px] rounded-xl border border-border bg-background px-4 text-base outline-none focus:border-accent-a"
        />
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={radim}
            className="min-h-[44px] flex-1 rounded-xl bg-accent-a px-4 font-medium text-white disabled:opacity-60"
          >
            {radim ? "Čuvam…" : "Postavi datum"}
          </button>
          {status === "scheduled" && (
            <button
              type="button"
              onClick={() => setFormaOtvorena(false)}
              className="min-h-[44px] rounded-xl border border-border px-4 text-sm"
            >
              Nazad
            </button>
          )}
        </div>
      </form>
      {greska && <p className="mt-2 text-sm text-accent-b">{greska}</p>}
    </section>
  );
}
