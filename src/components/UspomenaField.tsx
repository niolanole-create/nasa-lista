"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Kratak opis po čemu pamtimo aktivnost (uspomena). Čuva se na promenu.
export default function UspomenaField({
  activityId,
  initial,
}: {
  activityId: string;
  initial: string | null;
}) {
  const router = useRouter();
  const [tekst, setTekst] = useState(initial ?? "");
  const [stanje, setStanje] = useState<"idle" | "cuvam" | "sacuvano">("idle");

  async function sacuvaj() {
    if ((initial ?? "") === tekst.trim()) return;
    setStanje("cuvam");
    await createClient()
      .from("activities")
      .update({ memory: tekst.trim() || null })
      .eq("id", activityId);
    setStanje("sacuvano");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-muted">Po čemu ćete pamtiti?</label>
      <textarea
        value={tekst}
        onChange={(e) => {
          setTekst(e.target.value);
          setStanje("idle");
        }}
        onBlur={sacuvaj}
        rows={2}
        placeholder="npr. najbolja pizza dosad, sedeli do ponoći…"
        className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent-a"
      />
      {stanje === "sacuvano" && (
        <span className="text-xs text-muted">Sačuvano ✓</span>
      )}
    </div>
  );
}
