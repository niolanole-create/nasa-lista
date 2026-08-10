import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OdjavaButton from "@/components/OdjavaButton";
import RealtimeOsvezavanje from "@/components/RealtimeOsvezavanje";

// Zaštićena zona: zahteva prijavu i pripadnost paru.
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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

  if (!profile?.couple_id) redirect("/povezivanje");

  return (
    <div className="flex min-h-full flex-col">
      <RealtimeOsvezavanje coupleId={profile.couple_id} />
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <Link href="/" className="font-display text-lg font-semibold">
          Naša lista
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/ideje" className="text-muted hover:text-foreground">
            Naše ideje
          </Link>
          <Link
            href="/podesavanja"
            className="text-muted hover:text-foreground"
          >
            Podešavanja
          </Link>
          <OdjavaButton />
        </nav>
      </header>

      <div className="flex flex-1 flex-col pb-24">{children}</div>

      {/* Donja akciona traka — primarna akcija na dohvat palca (spec sekcija 6). */}
      <Link
        href="/dodaj"
        className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md items-center justify-center"
      >
        <span className="mb-5 mt-3 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-accent-a px-7 font-medium text-white shadow-lg">
          + Dodaj ideju
        </span>
      </Link>
    </div>
  );
}
