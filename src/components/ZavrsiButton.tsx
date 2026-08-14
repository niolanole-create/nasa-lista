"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Označi aktivnost kao urađenu (ili je vrati na listu).
// Datum „urađeno" = zakazani datum iz kalendara; ako termin nije zadat, danas.
export default function ZavrsiButton({
  activityId,
  scheduledAt,
  completed,
}: {
  activityId: string;
  scheduledAt: string | null;
  completed: boolean;
}) {
  const router = useRouter();
  const [radim, setRadim] = useState(false);

  async function prebaci() {
    setRadim(true);
    const izmena = completed
      ? { status: "accepted" as const, completed_at: null }
      : {
          status: "completed" as const,
          completed_at: scheduledAt ?? new Date().toISOString(),
        };
    await createClient().from("activities").update(izmena).eq("id", activityId);
    router.refresh();
    setRadim(false);
  }

  return (
    <button
      type="button"
      onClick={prebaci}
      disabled={radim}
      className={`min-h-[44px] rounded-xl border px-4 text-sm font-medium disabled:opacity-60 ${
        completed
          ? "border-border text-muted"
          : "border-accent-a text-accent-a"
      }`}
    >
      {completed ? "Vrati na listu" : "Označi kao urađeno"}
    </button>
  );
}
