import Link from "next/link";
import { getCoupleContext } from "@/lib/couple";
import type { Activity, Response } from "@/lib/database.types";
import Kartica from "@/components/Kartica";
import OdgovorDugmad from "@/components/OdgovorDugmad";
import ZavrsiButton from "@/components/ZavrsiButton";
import { relativniDatum } from "@/lib/ui";

type SaOdgovorima = Activity & { responses: Response[] };

// Ekran „Danas" (spec sekcija 4.1).
export default async function Danas() {
  const { supabase, userId, partner, members } = await getCoupleContext();

  const { data } = await supabase
    .from("activities")
    .select("*, responses(*)")
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  // cast kroz unknown: ručni tipovi nemaju FK metapodatke za ugnežđeni join.
  const sve = (data ?? []) as unknown as SaOdgovorima[];
  const mojOdgovor = (a: SaOdgovorima) =>
    a.responses.find((r) => r.user_id === userId)?.response ?? null;
  const partnerOdgovorio = (a: SaOdgovorima) =>
    partner ? a.responses.some((r) => r.user_id === partner.id) : false;

  const predlozeno = sve.filter((a) => a.status === "proposed");
  const cekaMene = predlozeno.filter(
    (a) => a.created_by !== userId && mojOdgovor(a) === null,
  );
  const razmisljam = predlozeno.filter(
    (a) => a.created_by !== userId && mojOdgovor(a) === "maybe",
  );
  const cekaPartnera = predlozeno.filter(
    (a) => a.created_by === userId && !partnerOdgovorio(a),
  );
  const zakazano = sve
    .filter((a) => a.status === "scheduled" && a.scheduled_at)
    .sort((a, b) => a.scheduled_at!.localeCompare(b.scheduled_at!))
    .slice(0, 3);

  const nistaZaAkciju =
    cekaMene.length === 0 &&
    zakazano.length === 0 &&
    cekaPartnera.length === 0 &&
    razmisljam.length === 0;

  if (nistaZaAkciju) {
    // 3 najskorije prihvaćene ideje kao podsticaj (sve je već sortirano po datumu).
    const predlozi = sve.filter((a) => a.status === "accepted").slice(0, 3);
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-10">
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <h1 className="font-display text-2xl font-semibold">Čisto je 🌊</h1>
          <p className="mt-2 text-muted">
            Nema ničega što čeka na tebe. Ubaci novu ideju.
          </p>
          <Link
            href="/dodaj"
            className="mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-accent-a px-5 font-medium text-white"
          >
            Dodaj ideju
          </Link>
        </div>

        {predlozi.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-medium text-muted">
              Iz vaše banke ideja
            </h2>
            <div className="flex flex-col gap-3">
              {predlozi.map((a) => (
                <Kartica key={a.id} activity={a} members={members} />
              ))}
            </div>
          </section>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 py-6">
      {cekaMene.length > 0 && (
        <Blok naslov="Čeka tvoj odgovor">
          {cekaMene.map((a) => (
            <Kartica key={a.id} activity={a} members={members}>
              {userId && <OdgovorDugmad activityId={a.id} userId={userId} />}
            </Kartica>
          ))}
        </Blok>
      )}

      {zakazano.length > 0 && (
        <Blok naslov="Zakazano">
          {zakazano.map((a) => (
            <Kartica key={a.id} activity={a} members={members}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted">
                  {relativniDatum(a.scheduled_at!)}
                </p>
                <ZavrsiButton
                  activityId={a.id}
                  scheduledAt={a.scheduled_at}
                  completed={false}
                />
              </div>
            </Kartica>
          ))}
        </Blok>
      )}

      {cekaPartnera.length > 0 && (
        <Blok naslov={`Čeka ${partner?.display_name ?? "partnera"}`}>
          {cekaPartnera.map((a) => (
            <Kartica key={a.id} activity={a} members={members} />
          ))}
        </Blok>
      )}

      {razmisljam.length > 0 && (
        <Blok naslov="Razmisliću">
          {razmisljam.map((a) => (
            <Kartica key={a.id} activity={a} members={members}>
              {userId && (
                <OdgovorDugmad
                  activityId={a.id}
                  userId={userId}
                  current="maybe"
                />
              )}
            </Kartica>
          ))}
        </Blok>
      )}
    </main>
  );
}

function Blok({
  naslov,
  children,
}: {
  naslov: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted">
        {naslov}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
