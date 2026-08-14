import { notFound } from "next/navigation";
import { getCoupleContext } from "@/lib/couple";
import type {
  Activity,
  Response,
  ActivityEvent,
  ActivityNote,
} from "@/lib/database.types";
import OdgovorDugmad from "@/components/OdgovorDugmad";
import AkcijeAktivnosti from "@/components/AkcijeAktivnosti";
import TerminSekcija from "@/components/TerminSekcija";
import ZavrsiButton from "@/components/ZavrsiButton";
import KomentarField from "@/components/KomentarField";
import {
  barBackground,
  formatDatumVreme,
  relativniDatum,
} from "@/lib/ui";
import {
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  EFFORT_LABEL,
  STATUS_LABEL,
} from "@/lib/enums";

const RESP_LABEL: Record<string, string> = {
  yes: "Hoću",
  no: "Neću",
  maybe: "Možda kasnije",
};

export default async function Detalj({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, userId, partner, members } = await getCoupleContext();

  const { data } = await supabase
    .from("activities")
    .select("*, responses(*)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  // cast kroz unknown: ručni tipovi nemaju FK metapodatke za ugnežđeni join.
  const activity = data as unknown as Activity & { responses: Response[] };

  const { data: events } = await supabase
    .from("activity_events")
    .select("*")
    .eq("activity_id", id)
    .order("created_at", { ascending: true });

  const { data: notesData } = await supabase
    .from("activity_notes")
    .select("*")
    .eq("activity_id", id);
  const notes = (notesData ?? []) as ActivityNote[];
  const mojKomentar = notes.find((n) => n.user_id === userId)?.body ?? null;
  const partnerKomentar =
    notes.find((n) => n.user_id === partner?.id)?.body ?? null;

  const jaAutor = activity.created_by === userId;
  const mojOdgovor =
    activity.responses.find((r) => r.user_id === userId)?.response ?? null;
  const partnerOdgovorio = partner
    ? activity.responses.some((r) => r.user_id === partner.id)
    : false;
  const imeOf = (uid: string | null) =>
    members.find((m) => m.id === uid)?.display_name ?? "Partner";

  // Poruka o trenutnom stanju (spec sekcija 4.4).
  let poruka = STATUS_LABEL[activity.status];
  if (activity.status === "accepted") {
    poruka = "Na listi — postavi datum kad želite";
  }

  // Reakcije su moguće na tuđu ideju (autor ne glasa na svoju).
  const mozeDaOdgovori =
    (activity.status === "proposed" || activity.status === "accepted") &&
    !jaAutor;

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 py-6">
      <article className="relative overflow-hidden rounded-2xl border border-border bg-surface">
        <span
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ background: barBackground(activity, members) }}
          aria-hidden
        />
        <div className="p-5 pl-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-2xl font-semibold leading-tight">
              {activity.title}
            </h1>
            <span className="text-2xl" aria-hidden>
              {CATEGORY_EMOJI[activity.category]}
            </span>
          </div>

          <p className="mt-3 rounded-lg bg-background px-3 py-2 text-sm font-medium">
            {poruka}
          </p>

          {activity.description && (
            <p className="mt-4 whitespace-pre-line leading-relaxed">
              {activity.description}
            </p>
          )}

          <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <span>{CATEGORY_LABEL[activity.category]}</span>
            <span>· {EFFORT_LABEL[activity.effort]}</span>
            <span>· dodao/la {imeOf(activity.created_by)}</span>
          </dl>

          {(activity.location_url || activity.reference_url) && (
            <div className="mt-3 flex flex-col gap-1 text-sm">
              {activity.location_url && (
                <a
                  href={activity.location_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent-a underline"
                >
                  📍 {activity.location_name ?? "Lokacija"}
                </a>
              )}
              {activity.reference_url && (
                <a
                  href={activity.reference_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent-a underline"
                >
                  🔗 Više o događaju
                </a>
              )}
            </div>
          )}

          {mozeDaOdgovori && userId && (
            <div className="mt-5">
              <OdgovorDugmad
                activityId={activity.id}
                userId={userId}
                current={mojOdgovor}
              />
            </div>
          )}
        </div>
      </article>

      {(activity.status === "accepted" || activity.status === "scheduled") && (
        <TerminSekcija
          activityId={activity.id}
          status={activity.status}
          scheduledAt={activity.scheduled_at}
        />
      )}

      {userId &&
        (activity.status === "accepted" ||
          activity.status === "scheduled" ||
          activity.status === "completed") && (
          <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">
              {activity.status === "completed" ? "Urađeno" : "Kad završite"}
            </h2>

            {activity.status === "completed" &&
              (activity.scheduled_at ?? activity.completed_at) && (
                <p className="text-sm">
                  Urađeno{" "}
                  {relativniDatum(
                    (activity.scheduled_at ?? activity.completed_at)!,
                  )}
                </p>
              )}

            <KomentarField
              activityId={activity.id}
              userId={userId}
              initial={mojKomentar}
            />

            {/* Komentar partnera — samo prikaz. */}
            {partnerKomentar && (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted">
                  {imeOf(partner?.id ?? null)}
                </span>
                <p className="whitespace-pre-line rounded-xl bg-background px-3 py-2 text-sm">
                  {partnerKomentar}
                </p>
              </div>
            )}

            <ZavrsiButton
              activityId={activity.id}
              scheduledAt={activity.scheduled_at}
              completed={activity.status === "completed"}
            />
          </section>
        )}

      <div className="mt-5">
        <AkcijeAktivnosti activityId={activity.id} status={activity.status} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted">
          Istorija
        </h2>
        <ul className="flex flex-col gap-2 text-sm">
          {(events ?? []).map((e: ActivityEvent) => {
            const ko = imeOf(e.actor_id);
            const p = (e.payload ?? {}) as Record<string, string>;
            let tekst = e.event_type;
            if (e.event_type === "created") tekst = `${ko} je dodao/la`;
            else if (e.event_type === "responded")
              tekst = `${ko}: ${RESP_LABEL[p.response] ?? p.response}`;
            else if (e.event_type === "status_changed")
              tekst = `→ ${STATUS_LABEL[p.to as keyof typeof STATUS_LABEL] ?? p.to}`;
            else if (e.event_type === "date_proposed")
              tekst = `${ko} predložio/la termin: ${formatDatumVreme(p.proposed_at)}`;
            else if (e.event_type === "schedule_cancelled")
              tekst = `${ko} otkazao/la termin — ${p.reason}`;
            return (
              <li key={e.id} className="flex justify-between gap-3 text-muted">
                <span>{tekst}</span>
                <time className="shrink-0 font-mono text-xs">
                  {new Date(e.created_at).toLocaleDateString("sr-RS")}
                </time>
              </li>
            );
          })}
        </ul>
      </section>

      {partnerOdgovorio && activity.status === "proposed" && (
        <p className="sr-only">Partner je odgovorio.</p>
      )}
    </main>
  );
}
