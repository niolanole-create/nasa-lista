"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Stanje = "idle" | "slanje" | "poslato" | "greska";

export default function Prijava() {
  const [email, setEmail] = useState("");
  const [stanje, setStanje] = useState<Stanje>("idle");

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    setStanje("slanje");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    setStanje(error ? "greska" : "poslato");
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

        {stanje === "poslato" ? (
          <p className="mt-8 rounded-2xl bg-surface p-5 text-center leading-relaxed">
            Poslali smo ti link na <strong>{email}</strong>. Otvori ga na ovom
            telefonu da se prijaviš.
          </p>
        ) : (
          <form onSubmit={posalji} className="mt-8 flex flex-col gap-3">
            <label htmlFor="email" className="text-sm text-muted">
              Tvoj e-mail
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
            <button
              type="submit"
              disabled={stanje === "slanje"}
              className="min-h-[44px] rounded-xl bg-accent-a px-4 font-medium text-white transition-opacity disabled:opacity-60"
            >
              {stanje === "slanje" ? "Šaljem…" : "Pošalji mi link za prijavu"}
            </button>
            {stanje === "greska" && (
              <p className="text-sm text-accent-b">
                Nešto nije u redu. Pokušaj ponovo za koji trenutak.
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
