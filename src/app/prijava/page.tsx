"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Korak = "email" | "kod";

export default function Prijava() {
  const router = useRouter();
  const [korak, setKorak] = useState<Korak>("email");
  const [email, setEmail] = useState("");
  const [kod, setKod] = useState("");
  const [radim, setRadim] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  async function posaljiKod(e: React.FormEvent) {
    e.preventDefault();
    setRadim(true);
    setGreska(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setRadim(false);
    if (error) {
      setGreska(error.message);
      return;
    }
    setKorak("kod");
  }

  async function potvrdiKod(e: React.FormEvent) {
    e.preventDefault();
    setRadim(true);
    setGreska(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: kod.trim(),
      type: "email",
    });
    if (error) {
      setGreska("Kod nije ispravan ili je istekao. Zatraži novi.");
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

        {korak === "email" ? (
          <form onSubmit={posaljiKod} className="mt-8 flex flex-col gap-3">
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
              disabled={radim}
              className="min-h-[44px] rounded-xl bg-accent-a px-4 font-medium text-white transition-opacity disabled:opacity-60"
            >
              {radim ? "Šaljem…" : "Pošalji mi kod"}
            </button>
            {greska && <p className="text-sm text-accent-b">{greska}</p>}
          </form>
        ) : (
          <form onSubmit={potvrdiKod} className="mt-8 flex flex-col gap-3">
            <p className="text-center leading-relaxed text-muted">
              Poslali smo šestocifreni kod na <strong>{email}</strong>. Unesi ga
              ovde.
            </p>
            <label htmlFor="kod" className="text-sm text-muted">
              Kod iz mejla
            </label>
            <input
              id="kod"
              type="text"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              value={kod}
              onChange={(e) => setKod(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              maxLength={6}
              className="min-h-[44px] rounded-xl border border-border bg-surface px-4 text-center font-mono text-xl tracking-[0.4em] outline-none focus:border-accent-a"
            />
            <button
              type="submit"
              disabled={radim}
              className="min-h-[44px] rounded-xl bg-accent-a px-4 font-medium text-white transition-opacity disabled:opacity-60"
            >
              {radim ? "Proveravam…" : "Prijavi se"}
            </button>
            <button
              type="button"
              onClick={() => {
                setKorak("email");
                setKod("");
                setGreska(null);
              }}
              className="text-sm text-muted underline"
            >
              Promeni e-mail / pošalji ponovo
            </button>
            {greska && <p className="text-sm text-accent-b">{greska}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
