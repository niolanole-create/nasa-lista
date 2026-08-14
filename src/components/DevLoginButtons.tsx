"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DEV_USERS = [
  { email: "marko@example.com", name: "Nikola", accent: "#B0335F" },
  { email: "ana@example.com", name: "Jelena", accent: "#0F6B6B" },
];
const DEV_PASSWORD = "sviđamiseNikolamnogo";

export default function DevLoginButtons() {
  const router = useRouter();
  const [greska, setGreska] = useState<string | null>(null);
  const [radim, setRadim] = useState<string | null>(null);

  async function udji(email: string) {
    setRadim(email);
    setGreska(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: DEV_PASSWORD,
    });
    if (error) {
      setGreska(`${error.message} — jesi li pokrenuo seed?`);
      setRadim(null);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      {DEV_USERS.map((u) => (
        <button
          key={u.email}
          type="button"
          onClick={() => udji(u.email)}
          disabled={radim !== null}
          className="flex min-h-[48px] items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 font-medium disabled:opacity-60"
        >
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: u.accent }}
          />
          {radim === u.email ? "Ulazim…" : u.name}
        </button>
      ))}
      {greska && <p className="text-sm text-accent-b">{greska}</p>}
    </div>
  );
}
