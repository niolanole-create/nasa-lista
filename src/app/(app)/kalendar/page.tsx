import { getCoupleContext } from "@/lib/couple";
import type { Activity } from "@/lib/database.types";
import { accentOf } from "@/lib/ui";
import Kalendar from "@/components/Kalendar";

export default async function KalendarStrana() {
  const { supabase, members } = await getCoupleContext();

  const { data } = await supabase
    .from("activities")
    .select("*")
    .in("status", ["scheduled", "accepted", "completed"]);

  const sve = (data ?? []) as Activity[];

  // Termini: zakazane i završene aktivnosti. Datum je planirani (scheduled_at),
  // a za završene bez plana — datum kad su odrađene (completed_at).
  const termini = sve
    .map((a) => ({
      activity: a,
      kada:
        a.status === "scheduled"
          ? a.scheduled_at
          : a.status === "completed"
            ? (a.scheduled_at ?? a.completed_at)
            : null,
    }))
    .filter((x) => x.kada)
    .map(({ activity: a, kada }) => ({
      id: a.id,
      title: a.title,
      scheduledAt: kada!,
      color: accentOf(a.created_by, members),
      done: a.status === "completed",
    }));

  const ideje = sve
    .filter((a) => a.status === "accepted")
    .map((a) => ({ id: a.id, title: a.title }));

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 py-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Kalendar
      </h1>
      <p className="mt-1 text-sm text-muted">Zakazani termini i šta stiže.</p>
      <div className="mt-5">
        <Kalendar termini={termini} ideje={ideje} />
      </div>
    </main>
  );
}
