import { createClient } from "@/lib/supabase/server";

// Početni ekran (za sada placeholder — „Danas" stiže u Fazi 2).
export default async function Pocetna() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, couple_id")
    .eq("id", user!.id)
    .single();

  const { data: couple } = await supabase
    .from("couples")
    .select("name, invite_code")
    .eq("id", profile!.couple_id!)
    .single();

  // Koliko nas je u paru — ako je samo jedan, pokaži kod za poziv partnera.
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("couple_id", profile!.couple_id!);

  const sam = (count ?? 1) < 2;
  const ime = profile?.display_name?.trim();

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        {ime ? `Ćao, ${ime}` : "Ćao"}
      </h1>
      <p className="mt-1 text-muted">
        {couple?.name ? couple.name : "Vaš zajednički prostor."}
      </p>

      {sam ? (
        <section className="mt-8 rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="text-muted">Pozovi partnera da vam se pridruži</p>
          <p className="mt-3 font-mono text-3xl font-semibold tracking-[0.3em]">
            {couple?.invite_code}
          </p>
          <p className="mt-3 text-sm text-muted">
            Podeli ovaj kod — partner ga unosi na ekranu „Pridruži se”.
          </p>
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <p className="leading-relaxed">
            Oboje ste tu. 🎉 Dodavanje ideja i planova stiže u sledećoj fazi.
          </p>
        </section>
      )}
    </main>
  );
}
