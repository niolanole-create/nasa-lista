import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/database.types";

// Kontekst para za server komponente: klijent, ja, partner, članovi.
// RLS obezbeđuje da `profiles` vrati samo članove mog para.
export async function getCoupleContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase.from("profiles").select("*");
  const members = (data ?? []) as Profile[];
  const me = members.find((m) => m.id === user?.id) ?? null;
  const partner = members.find((m) => m.id !== user?.id) ?? null;

  return { supabase, userId: user?.id ?? null, me, partner, members };
}
