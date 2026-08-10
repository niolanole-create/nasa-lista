"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ResponseType } from "@/lib/database.types";

type Props = {
  activityId: string;
  userId: string;
  current?: ResponseType | null;
};

const OPCIJE: { value: ResponseType; label: string; klasa: string }[] = [
  { value: "yes", label: "Hoću", klasa: "bg-accent-a text-white" },
  {
    value: "maybe",
    label: "Možda kasnije",
    klasa: "bg-surface text-foreground",
  },
  { value: "no", label: "Neću", klasa: "bg-surface text-accent-b" },
];

export default function OdgovorDugmad({ activityId, userId, current }: Props) {
  const router = useRouter();
  const [radim, setRadim] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  async function odgovori(response: ResponseType) {
    setRadim(true);
    setGreska(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("responses")
      .upsert(
        { activity_id: activityId, user_id: userId, response },
        { onConflict: "activity_id,user_id" },
      );
    if (error) {
      setGreska(error.message);
      setRadim(false);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {OPCIJE.map((o) => (
          <button
            key={o.value}
            type="button"
            disabled={radim}
            onClick={() => odgovori(o.value)}
            className={`min-h-[44px] flex-1 rounded-xl border border-border px-3 text-sm font-medium disabled:opacity-60 ${o.klasa} ${
              current === o.value ? "ring-2 ring-foreground ring-offset-1" : ""
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {greska && <p className="mt-2 text-sm text-accent-b">{greska}</p>}
    </div>
  );
}
