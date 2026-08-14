"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Lični komentar (po osobi) na aktivnost. Čuva se kad izađeš iz polja.
export default function KomentarField({
  activityId,
  userId,
  initial,
  label = "Tvoj komentar",
}: {
  activityId: string;
  userId: string;
  initial: string | null;
  label?: string;
}) {
  const router = useRouter();
  const [tekst, setTekst] = useState(initial ?? "");
  const [stanje, setStanje] = useState<"idle" | "cuvam" | "sacuvano">("idle");

  async function sacuvaj() {
    if ((initial ?? "") === tekst.trim()) return;
    setStanje("cuvam");
    await createClient()
      .from("activity_notes")
      .upsert(
        {
          activity_id: activityId,
          user_id: userId,
          body: tekst.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "activity_id,user_id" },
      );
    setStanje("sacuvano");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-muted">{label}</label>
      <textarea
        value={tekst}
        onChange={(e) => {
          setTekst(e.target.value);
          setStanje("idle");
        }}
        onBlur={sacuvaj}
        rows={2}
        placeholder="Kako je bilo? Po čemu ćeš pamtiti…"
        className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent-a"
      />
      {stanje === "sacuvano" && (
        <span className="text-xs text-muted">Sačuvano ✓</span>
      )}
    </div>
  );
}
