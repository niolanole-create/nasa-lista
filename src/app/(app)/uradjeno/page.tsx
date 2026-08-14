import Link from "next/link";
import { getCoupleContext } from "@/lib/couple";
import type { Activity } from "@/lib/database.types";
import Kartica from "@/components/Kartica";
import ZavrsiToggle from "@/components/ZavrsiToggle";
import UspomenaField from "@/components/UspomenaField";
import { relativniDatum } from "@/lib/ui";

// Sve što ste odradili — štiklirane aktivnosti sa kratkom uspomenom.
export default async function Uradjeno() {
  const { supabase, members } = await getCoupleContext();

  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("status", "completed");

  const uradjeno = ((data ?? []) as Activity[]).sort((a, b) =>
    (b.completed_at ?? b.created_at).localeCompare(a.completed_at ?? a.created_at),
  );

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 py-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Urađeno
      </h1>
      <p className="mt-1 text-sm text-muted">
        Sve što ste zajedno prošli — i po čemu ćete to pamtiti.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {uradjeno.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">
            Još ništa nije štiklirano.{" "}
            <Link href="/ideje" className="text-accent-a underline">
              Nazad na ideje
            </Link>
            .
          </p>
        ) : (
          uradjeno.map((a) => (
            <Kartica key={a.id} activity={a} members={members}>
              <div className="flex flex-col gap-3">
                {a.completed_at && (
                  <p className="text-xs text-muted">
                    urađeno {relativniDatum(a.completed_at)}
                  </p>
                )}
                <UspomenaField activityId={a.id} initial={a.memory} />
                <ZavrsiToggle activityId={a.id} completed />
              </div>
            </Kartica>
          ))
        )}
      </div>
    </main>
  );
}
