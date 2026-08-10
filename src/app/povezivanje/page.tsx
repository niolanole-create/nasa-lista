import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PovezivanjeForm from "@/components/PovezivanjeForm";

// Onboarding: dostupno samo prijavljenima koji još nemaju par.
export default async function Povezivanje() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/prijava");

  const { data: profile } = await supabase
    .from("profiles")
    .select("couple_id")
    .eq("id", user.id)
    .single();

  if (profile?.couple_id) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-display text-3xl font-semibold tracking-tight">
          Povežite se
        </h1>
        <p className="mt-2 text-center text-muted">
          Napravi novi par i pozovi partnera, ili se pridruži preko koda koji ti
          je poslao/la.
        </p>
        <PovezivanjeForm />
      </div>
    </main>
  );
}
