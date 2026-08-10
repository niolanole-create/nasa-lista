"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Rezim = "prijava" | "registracija";

export default function Prijava() {
  const router = useRouter();
  const [rezim, setRezim] = useState<Rezim>("prijava");
  const [email, setEmail] = useState("");
  const [lozinka, setLozinka] = useState("");
  const [radim, setRadim] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function prevedi(poruka: string): string {
    if (/invalid login credentials/i.test(poruka))
      return "Pogrešan e-mail ili lozinka.";
    if (/already registered/i.test(poruka))
      return "Nalog sa ovim e-mailom već postoji. Prijavi se.";
    if (/password should be at least/i.test(poruka))
      return "Lozinka mora imati bar 6 znakova.";
    return poruka;
  }

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    setRadim(true);
    setGreska(null);
    setInfo(null);
    const supabase = createClient();

    if (rezim === "prijava") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: lozinka,
      });
      if (error) {
        setGreska(prevedi(error.message));
        setRadim(false);
        return;
      }
      router.replace("/");
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: lozinka,
      });
      if (error) {
        setGreska(prevedi(error.message));
        setRadim(false);
        return;
      }
      // Ako je potvrda mejla isključena, odmah dobijamo sesiju.
      if (data.session) {
        router.replace("/");
        router.refresh();
      } else {
        setInfo("Nalog je napravljen. Sada se prijavi svojim podacima.");
        setRezim("prijava");
        setRadim(false);
      }
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <span
          className="mx-auto mb-6 block h-1.5 w-24 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, var(--accent-a), var(--accent-b))",
          }}
        />
        <h1 className="text-center font-display text-3xl font-semibold tracking-tight">
          Naša lista
        </h1>

        <div className="mt-6 flex rounded-xl bg-surface p-1">
          <button
            type="button"
            onClick={() => {
              setRezim("prijava");
              setGreska(null);
            }}
            className={`min-h-[44px] flex-1 rounded-lg text-sm font-medium transition-colors ${
              rezim === "prijava" ? "bg-accent-a text-white" : "text-muted"
            }`}
          >
            Prijava
          </button>
          <button
            type="button"
            onClick={() => {
              setRezim("registracija");
              setGreska(null);
            }}
            className={`min-h-[44px] flex-1 rounded-lg text-sm font-medium transition-colors ${
              rezim === "registracija" ? "bg-accent-a text-white" : "text-muted"
            }`}
          >
            Registracija
          </button>
        </div>

        <form onSubmit={posalji} className="mt-5 flex flex-col gap-3">
          <label htmlFor="email" className="text-sm text-muted">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ime@primer.com"
            className="min-h-[44px] rounded-xl border border-border bg-surface px-4 text-base outline-none focus:border-accent-a"
          />

          <label htmlFor="lozinka" className="text-sm text-muted">
            Lozinka
          </label>
          <input
            id="lozinka"
            type="password"
            required
            minLength={6}
            autoComplete={
              rezim === "prijava" ? "current-password" : "new-password"
            }
            value={lozinka}
            onChange={(e) => setLozinka(e.target.value)}
            placeholder="bar 6 znakova"
            className="min-h-[44px] rounded-xl border border-border bg-surface px-4 text-base outline-none focus:border-accent-a"
          />

          <button
            type="submit"
            disabled={radim}
            className="mt-1 min-h-[48px] rounded-xl bg-accent-a px-4 font-medium text-white transition-opacity disabled:opacity-60"
          >
            {radim
              ? "Trenutak…"
              : rezim === "prijava"
                ? "Prijavi se"
                : "Napravi nalog"}
          </button>

          {info && <p className="text-sm text-accent-a">{info}</p>}
          {greska && <p className="text-sm text-accent-b">{greska}</p>}
        </form>
      </div>
    </main>
  );
}
