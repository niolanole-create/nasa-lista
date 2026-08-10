import { createClient } from "@/lib/supabase/server";
import PodesavanjaForm from "@/components/PodesavanjaForm";

export default async function Podesavanja() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, accent_color, couple_id")
    .eq("id", user!.id)
    .single();

  const { data: couple } = await supabase
    .from("couples")
    .select("invite_code")
    .eq("id", profile!.couple_id!)
    .single();

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Podešavanja
      </h1>

      <PodesavanjaForm
        displayName={profile?.display_name ?? ""}
        accentColor={profile?.accent_color ?? null}
      />

      <section className="mt-10 border-t border-border pt-6">
        <p className="text-sm text-muted">Kod za poziv partnera</p>
        <p className="mt-1 font-mono text-2xl tracking-[0.25em]">
          {couple?.invite_code}
        </p>
      </section>
    </main>
  );
}
