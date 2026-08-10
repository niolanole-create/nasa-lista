"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OdjavaButton() {
  const router = useRouter();

  async function odjava() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/prijava");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={odjava}
      className="text-muted hover:text-accent-b"
    >
      Odjava
    </button>
  );
}
