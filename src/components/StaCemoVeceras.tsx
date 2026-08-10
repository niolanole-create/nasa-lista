"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// „Šta ćemo večeras?" — nasumično izvlači spontanu ideju (spec sekcija 4.2).
export default function StaCemoVeceras({
  ideas,
}: {
  ideas: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [prikaz, setPrikaz] = useState<string | null>(null);

  function izvuci() {
    if (ideas.length === 0) return;
    // Kratka animacija „izvlačenja": promena naslova pa odlazak na detalj.
    let i = 0;
    const koraci = Math.min(10, Math.max(4, ideas.length * 2));
    const timer = setInterval(() => {
      setPrikaz(ideas[i % ideas.length].title);
      i++;
      if (i >= koraci) {
        clearInterval(timer);
        const izabrana = ideas[Math.floor(Math.random() * ideas.length)];
        setPrikaz(izabrana.title);
        setTimeout(() => router.push(`/aktivnost/${izabrana.id}`), 350);
      }
    }, 90);
  }

  if (ideas.length === 0) return null;

  return (
    <button
      type="button"
      onClick={izvuci}
      className="w-full rounded-2xl bg-foreground px-5 py-4 text-center font-medium text-background transition-transform active:scale-[0.98] motion-reduce:active:scale-100"
    >
      {prikaz ? (
        <span className="font-display text-lg">{prikaz}</span>
      ) : (
        <>🎲 Šta ćemo večeras?</>
      )}
    </button>
  );
}
