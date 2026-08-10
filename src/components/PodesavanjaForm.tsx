"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Dve akcentne boje iz brend palete (spec sekcija 6).
const BOJE = [
  { hex: "#0F6B6B", ime: "Tirkizna" },
  { hex: "#B0335F", ime: "Malina" },
];

type Props = {
  displayName: string;
  accentColor: string | null;
};

export default function PodesavanjaForm({ displayName, accentColor }: Props) {
  const router = useRouter();
  const [ime, setIme] = useState(displayName);
  const [boja, setBoja] = useState<string | null>(accentColor);
  const [stanje, setStanje] = useState<"idle" | "cuvam" | "sacuvano">("idle");

  async function sacuvaj(e: React.FormEvent) {
    e.preventDefault();
    setStanje("cuvam");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from("profiles")
      .update({ display_name: ime.trim() || null, accent_color: boja })
      .eq("id", user!.id);

    setStanje("sacuvano");
    router.refresh();
  }

  return (
    <form onSubmit={sacuvaj} className="mt-6 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="ime" className="text-sm text-muted">
          Tvoje ime
        </label>
        <input
          id="ime"
          type="text"
          value={ime}
          onChange={(e) => {
            setIme(e.target.value);
            setStanje("idle");
          }}
          placeholder="npr. Ana"
          className="min-h-[44px] rounded-xl border border-border bg-surface px-4 text-base outline-none focus:border-accent-a"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">Tvoja boja</span>
        <div className="flex gap-3">
          {BOJE.map((b) => (
            <button
              key={b.hex}
              type="button"
              onClick={() => {
                setBoja(b.hex);
                setStanje("idle");
              }}
              aria-label={b.ime}
              aria-pressed={boja === b.hex}
              className={`h-11 w-11 rounded-full transition-transform ${
                boja === b.hex
                  ? "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background"
                  : ""
              }`}
              style={{ backgroundColor: b.hex }}
            />
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={stanje === "cuvam"}
        className="min-h-[44px] rounded-xl bg-accent-a px-4 font-medium text-white transition-opacity disabled:opacity-60"
      >
        {stanje === "cuvam"
          ? "Čuvam…"
          : stanje === "sacuvano"
            ? "Sačuvano ✓"
            : "Sačuvaj"}
      </button>
    </form>
  );
}
