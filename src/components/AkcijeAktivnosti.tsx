"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ActivityStatus } from "@/lib/database.types";

export default function AkcijeAktivnosti({
  activityId,
  status,
}: {
  activityId: string;
  status: ActivityStatus;
}) {
  const router = useRouter();
  const [radim, setRadim] = useState(false);

  async function arhiviraj() {
    setRadim(true);
    const supabase = createClient();
    await supabase
      .from("activities")
      .update({ status: "archived" })
      .eq("id", activityId);
    router.replace("/");
    router.refresh();
  }

  async function ozivi() {
    setRadim(true);
    const supabase = createClient();
    await supabase.rpc("revive_activity", { activity_id: activityId });
    router.refresh();
    setRadim(false);
  }

  return (
    <div className="flex flex-wrap gap-3">
      {status === "declined" && (
        <button
          type="button"
          onClick={ozivi}
          disabled={radim}
          className="min-h-[44px] rounded-xl border border-border px-4 text-sm font-medium disabled:opacity-60"
        >
          Oživi ideju
        </button>
      )}
      {status !== "archived" && (
        <button
          type="button"
          onClick={arhiviraj}
          disabled={radim}
          className="min-h-[44px] rounded-xl border border-border px-4 text-sm text-muted disabled:opacity-60"
        >
          Arhiviraj
        </button>
      )}
    </div>
  );
}
