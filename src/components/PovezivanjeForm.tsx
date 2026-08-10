"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Rezim = "napravi" | "pridruzi";

export default function PovezivanjeForm() {
  const router = useRouter();
  const [rezim, setRezim] = useState<Rezim>("napravi");
  const [ime, setIme] = useState("");
  const [kod, setKod] = useState("");
  const [radim, setRadim] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    setRadim(true);
    setGreska(null);
    const supabase = createClient();

    const { error } =
      rezim === "napravi"
        ? await supabase.rpc("create_couple", { couple_name: ime || undefined })
        : await supabase.rpc("join_couple", { code: kod });

    if (error) {
      setGreska(error.message);
      setRadim(false);
      return;
    }

    // Osveži serverske podatke pa uđi u aplikaciju.
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="mt-8">
      <div className="mb-5 flex rounded-xl bg-surface p-1">
        <button
          type="button"
          onClick={() => setRezim("napravi")}
          className={`min-h-[44px] flex-1 rounded-lg text-sm font-medium transition-colors ${
            rezim === "napravi" ? "bg-accent-a text-white" : "text-muted"
          }`}
        >
          Napravi par
        </button>
        <button
          type="button"
          onClick={() => setRezim("pridruzi")}
          className={`min-h-[44px] flex-1 rounded-lg text-sm font-medium transition-colors ${
            rezim === "pridruzi" ? "bg-accent-a text-white" : "text-muted"
          }`}
        >
          Pridruži se
        </button>
      </div>

      <form onSubmit={posalji} className="flex flex-col gap-3">
        {rezim === "napravi" ? (
          <>
            <label htmlFor="ime" className="text-sm text-muted">
              Ime para (opciono)
            </label>
            <input
              id="ime"
              type="text"
              value={ime}
              onChange={(e) => setIme(e.target.value)}
              placeholder="npr. Ana i Marko"
              className="min-h-[44px] rounded-xl border border-border bg-surface px-4 text-base outline-none focus:border-accent-a"
            />
          </>
        ) : (
          <>
            <label htmlFor="kod" className="text-sm text-muted">
              Kod za poziv
            </label>
            <input
              id="kod"
              type="text"
              required
              autoCapitalize="characters"
              value={kod}
              onChange={(e) => setKod(e.target.value.toUpperCase())}
              placeholder="npr. K7M2QH9P"
              maxLength={8}
              className="min-h-[44px] rounded-xl border border-border bg-surface px-4 text-center font-mono text-lg tracking-widest outline-none focus:border-accent-a"
            />
          </>
        )}

        <button
          type="submit"
          disabled={radim}
          className="min-h-[44px] rounded-xl bg-accent-a px-4 font-medium text-white transition-opacity disabled:opacity-60"
        >
          {radim
            ? "Trenutak…"
            : rezim === "napravi"
              ? "Napravi par"
              : "Pridruži se paru"}
        </button>

        {greska && <p className="text-sm text-accent-b">{greska}</p>}
      </form>
    </div>
  );
}
