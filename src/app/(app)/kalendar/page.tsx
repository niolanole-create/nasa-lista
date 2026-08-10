import { getCoupleContext } from "@/lib/couple";
import type { Activity } from "@/lib/database.types";
import { accentOf } from "@/lib/ui";
import Kalendar from "@/components/Kalendar";

export default async function KalendarStrana() {
  const { supabase, members } = await getCoupleContext();

  const { data } = await supabase
    .from("activities")
    .select("*")
    .in("status", ["scheduled", "accepted"]);

  const sve = (data ?? []) as Activity[];

  const termini = sve
    .filter((a) => a.status === "scheduled" && a.scheduled_at)
    .map((a) => ({
      id: a.id,
      title: a.title,
      scheduledAt: a.scheduled_at!,
      color: accentOf(a.created_by, members),
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
