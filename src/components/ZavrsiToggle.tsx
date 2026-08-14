"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Štikliranje: označi aktivnost kao urađenu (ili vrati na listu).
export default function ZavrsiToggle({
  activityId,
  completed,
}: {
  activityId: string;
  completed: boolean;
}) {
  const router = useRouter();
  const [radim, setRadim] = useState(false);

  async function prebaci() {
    setRadim(true);
    const now = new Date().toISOString();
    const izmena = completed
      ? { status: "accepted" as const, completed_at: null }
      : { status: "completed" as const, completed_at: now };
    await createClient().from("activities").update(izmena).eq("id", activityId);
    router.refresh();
    setRadim(false);
  }

  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={completed}
        disabled={radim}
        onChange={prebaci}
        className="h-5 w-5 accent-accent-a"
      />
      <span className={completed ? "text-muted line-through" : ""}>
        {completed ? "Urađeno" : "Označi kao urađeno"}
      </span>
    </label>
  );
}
