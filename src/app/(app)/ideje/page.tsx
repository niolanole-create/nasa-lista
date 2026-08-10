import Link from "next/link";
import { getCoupleContext } from "@/lib/couple";
import type { Activity, Category, Effort } from "@/lib/database.types";
import Kartica from "@/components/Kartica";
import FilterKontrole from "@/components/FilterKontrole";
import StaCemoVeceras from "@/components/StaCemoVeceras";

type SP = Promise<{ kat?: string; trud?: string; ko?: string; sort?: string }>;

// „Naše ideje" — banka prihvaćenih ideja bez termina (spec sekcija 4.2).
export default async function Ideje({ searchParams }: { searchParams: SP }) {
  const { supabase, userId, partner, members } = await getCoupleContext();
  const sp = await searchParams;

  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("status", "accepted");

  let ideje = (data ?? []) as Activity[];

  if (sp.kat) ideje = ideje.filter((a) => a.category === (sp.kat as Category));
  if (sp.trud) ideje = ideje.filter((a) => a.effort === (sp.trud as Effort));
  if (sp.ko === "ja") ideje = ideje.filter((a) => a.created_by === userId);
  else if (sp.ko === "partner")
    ideje = ideje.filter((a) => a.created_by === partner?.id);

  const sort = sp.sort ?? "najnovije";
  ideje.sort((a, b) => {
    if (sort === "najstarije") return a.created_at.localeCompare(b.created_at);
    if (sort === "rok") {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    }
    return b.created_at.localeCompare(a.created_at); // najnovije
  });

  const spontane = (data ?? [])
    .filter((a) => a.effort === "spontano")
    .map((a) => ({ id: a.id, title: a.title }));

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 py-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Naše ideje
      </h1>
      <p className="mt-1 text-sm text-muted">
        Sve što oboje želite — čeka da se dogovori termin.
      </p>

      <div className="mt-5">
        <StaCemoVeceras ideas={spontane} />
      </div>

      <div className="mt-5">
        <FilterKontrole partnerName={partner?.display_name ?? null} />
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {ideje.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">
            Ništa ovde još. Kad oboje kažete „da” nekoj ideji, sleti ovamo.{" "}
            <Link href="/dodaj" className="text-accent-a underline">
              Dodaj ideju
            </Link>
            .
          </p>
        ) : (
          ideje.map((a) => (
            <Kartica key={a.id} activity={a} members={members} />
          ))
        )}
      </div>
    </main>
  );
}
