"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  ActivityStatus,
  DateProposal,
  Profile,
} from "@/lib/database.types";
import { formatDatumVreme, relativniDatum } from "@/lib/ui";

type Props = {
  activityId: string;
  status: ActivityStatus;
  scheduledAt: string | null;
  userId: string;
  proposals: DateProposal[];
  members: Profile[];
};

export default function TerminSekcija({
  activityId,
  status,
  scheduledAt,
  userId,
  proposals,
  members,
}: Props) {
  const router = useRouter();
  const [radim, setRadim] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [formaOtvorena, setFormaOtvorena] = useState(false);
  const [kada, setKada] = useState("");

  const imeOf = (uid: string | null) =>
    members.find((m) => m.id === uid)?.display_name ?? "Partner";

  async function pozovi(fn: () => PromiseLike<{ error: unknown }>) {
    setRadim(true);
    setGreska(null);
    const { error } = await fn();
    if (error) {
      setGreska((error as { message?: string }).message ?? "Greška.");
      setRadim(false);
      return;
    }
    setFormaOtvorena(false);
    setKada("");
    router.refresh();
  }

  const supabase = () => createClient();

  async function predlozi(e: React.FormEvent) {
    e.preventDefault();
    if (!kada) return;
    const iso = new Date(kada).toISOString();
    await pozovi(() =>
      supabase().rpc("propose_date", {
        p_activity_id: activityId,
        p_proposed_at: iso,
      }),
    );
  }

  async function prihvati(proposalId: string) {
    await pozovi(() =>
      supabase().rpc("accept_date", { p_proposal_id: proposalId }),
    );
  }

  async function otkazi() {
    const razlog = window.prompt("Zašto otkazuješ termin? (obavezno)");
    if (razlog === null) return;
    if (razlog.trim().length === 0) {
      setGreska("Razlog je obavezan.");
      return;
    }
    await pozovi(() =>
      supabase().rpc("cancel_schedule", {
        p_activity_id: activityId,
        p_reason: razlog,
      }),
    );
  }

  // Zakazano: prikaz termina + otkazivanje + .ics.
  if (status === "scheduled" && scheduledAt) {
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

  // Termin se dogovara samo kad je ideja prihvaćena.
  if (status !== "accepted") return null;

  const pending = proposals.find((p) => p.status === "pending") ?? null;
  const mojPredlog = pending?.proposed_by === userId;

  return (
    <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">
        Dogovorite termin
      </h2>

      {pending && !formaOtvorena ? (
        <div className="mt-3">
          <p className="text-lg font-medium">
            {formatDatumVreme(pending.proposed_at)}
          </p>
          <p className="text-sm text-muted">
            predložio/la {imeOf(pending.proposed_by)} ·{" "}
            {relativniDatum(pending.proposed_at)}
          </p>

          {mojPredlog ? (
            <p className="mt-3 rounded-lg bg-background px-3 py-2 text-sm">
              Čeka {imeOf(members.find((m) => m.id !== userId)?.id ?? null)} da
              potvrdi.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => prihvati(pending.id)}
                disabled={radim}
                className="min-h-[44px] flex-1 rounded-xl bg-accent-a px-4 text-sm font-medium text-white disabled:opacity-60"
              >
                Prihvati termin
              </button>
              <button
                type="button"
                onClick={() => setFormaOtvorena(true)}
                disabled={radim}
                className="min-h-[44px] rounded-xl border border-border px-4 text-sm disabled:opacity-60"
              >
                Predloži drugi
              </button>
            </div>
          )}
          {mojPredlog && (
            <button
              type="button"
              onClick={() => setFormaOtvorena(true)}
              className="mt-3 text-sm text-muted underline"
            >
              Predloži drugi termin
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={predlozi} className="mt-3 flex flex-col gap-3">
          <label htmlFor="kada" className="text-sm text-muted">
            Kada?
          </label>
          <input
            id="kada"
            type="datetime-local"
            required
            value={kada}
            onChange={(e) => setKada(e.target.value)}
            className="min-h-[44px] rounded-xl border border-border bg-background px-4 text-base outline-none focus:border-accent-a"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={radim}
              className="min-h-[44px] flex-1 rounded-xl bg-accent-a px-4 font-medium text-white disabled:opacity-60"
            >
              {radim ? "Šaljem…" : "Predloži termin"}
            </button>
            {pending && (
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
      )}
      {greska && <p className="mt-2 text-sm text-accent-b">{greska}</p>}
    </section>
  );
}
