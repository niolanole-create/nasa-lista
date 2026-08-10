import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OdjavaButton from "@/components/OdjavaButton";

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
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <Link href="/" className="font-display text-lg font-semibold">
          Naša lista
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/podesavanja"
            className="text-muted hover:text-foreground"
          >
            Podešavanja
          </Link>
          <OdjavaButton />
        </nav>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
