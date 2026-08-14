"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Zatvorena aplikacija za dvoje — biraš ko si, ne kucaš mejl.
// Ime se interno mapira na nalog; korisnik nikad ne vidi mejl.
const NALOZI = [
  { ime: "Nikola", email: "marko@example.com", boja: "#B0335F" },
  { ime: "Jelena", email: "ana@example.com", boja: "#0F6B6B" },
];

export default function Prijava() {
  const router = useRouter();
  const [email, setEmail] = useState(NALOZI[0].email);
  const [lozinka, setLozinka] = useState("");
  const [radim, setRadim] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    setRadim(true);
    setGreska(null);
    const { error } = await createClient().auth.signInWithPassword({
      email,
      password: lozinka,
    });
    if (error) {
      setGreska(
        /invalid login credentials/i.test(error.message)
          ? "Pogrešna lozinka."
          : error.message,
      );
      setRadim(false);
      return;
    }
    router.replace("/");
    router.refresh();
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

        <form onSubmit={posalji} className="mt-6 flex flex-col gap-4">
          <span className="text-sm text-muted">Ko si?</span>
          <div className="flex gap-3">
            {NALOZI.map((n) => (
              <button
                key={n.email}
                type="button"
                onClick={() => {
                  setEmail(n.email);
                  setGreska(null);
                }}
                aria-pressed={email === n.email}
                className={`flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border font-medium transition-colors ${
                  email === n.email
                    ? "border-foreground bg-surface"
                    : "border-border text-muted"
                }`}
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: n.boja }}
                />
                {n.ime}
              </button>
            ))}
          </div>

          <label htmlFor="lozinka" className="text-sm text-muted">
            Lozinka
          </label>
          <input
            id="lozinka"
            type="password"
            required
            autoComplete="current-password"
            value={lozinka}
            onChange={(e) => setLozinka(e.target.value)}
            placeholder="Lozinka"
            className="min-h-[44px] rounded-xl border border-border bg-surface px-4 text-base outline-none focus:border-accent-a"
          />

          <button
            type="submit"
            disabled={radim}
            className="mt-1 min-h-[48px] rounded-xl bg-accent-a px-4 font-medium text-white transition-opacity disabled:opacity-60"
          >
            {radim ? "Trenutak…" : "Prijavi se"}
          </button>

          {greska && <p className="text-sm text-accent-b">{greska}</p>}
        </form>
      </div>
    </main>
  );
}
