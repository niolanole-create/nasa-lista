"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Category, Effort } from "@/lib/database.types";
import { CATEGORIES, EFFORTS } from "@/lib/enums";

const polje =
  "min-h-[44px] rounded-xl border border-border bg-surface px-4 text-base outline-none focus:border-accent-a";

export default function DodajForm() {
  const router = useRouter();
  const [radim, setRadim] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("izlazak");
  const [effort, setEffort] = useState<Effort>("treba_planirati");
  const [cost, setCost] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [deadline, setDeadline] = useState("");

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setRadim(true);
    setGreska(null);

    const supabase = createClient();
    // couple_id i created_by popunjavaju DB default-i (current_couple_id / auth.uid).
    const { error } = await supabase.from("activities").insert({
      title: title.trim(),
      description: description.trim() || null,
      category,
      effort,
      estimated_cost: cost ? Number(cost) : null,
      location_name: locationName.trim() || null,
      location_url: locationUrl.trim() || null,
      reference_url: referenceUrl.trim() || null,
      deadline: deadline || null,
    });

    if (error) {
      setGreska(error.message);
      setRadim(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={posalji} className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-sm text-muted">
          Šta biste voleli da uradite? *
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="npr. Vikend u Sarajevu"
          className={polje}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm text-muted">
          Opis (opciono)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={`${polje} py-3`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="category" className="text-sm text-muted">
            Kategorija
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className={polje}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="effort" className="text-sm text-muted">
            Koliko truda
          </label>
          <select
            id="effort"
            value={effort}
            onChange={(e) => setEffort(e.target.value as Effort)}
            className={polje}
          >
            {EFFORTS.map((ef) => (
              <option key={ef.value} value={ef.value}>
                {ef.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="cost" className="text-sm text-muted">
            Okvirni trošak (RSD)
          </label>
          <input
            id="cost"
            type="number"
            inputMode="numeric"
            min={0}
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className={polje}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="deadline" className="text-sm text-muted">
            Rok (opciono)
          </label>
          <input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={polje}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="locationName" className="text-sm text-muted">
          Mesto (opciono)
        </label>
        <input
          id="locationName"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="npr. Kalemegdan"
          className={polje}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="locationUrl" className="text-sm text-muted">
          Google Maps link (opciono)
        </label>
        <input
          id="locationUrl"
          type="url"
          value={locationUrl}
          onChange={(e) => setLocationUrl(e.target.value)}
          placeholder="https://maps.google.com/…"
          className={polje}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="referenceUrl" className="text-sm text-muted">
          Link ka događaju/sajtu (opciono)
        </label>
        <input
          id="referenceUrl"
          type="url"
          value={referenceUrl}
          onChange={(e) => setReferenceUrl(e.target.value)}
          placeholder="https://…"
          className={polje}
        />
      </div>

      <button
        type="submit"
        disabled={radim}
        className="mt-2 min-h-[48px] rounded-xl bg-accent-a px-4 font-medium text-white transition-opacity disabled:opacity-60"
      >
        {radim ? "Dodajem…" : "Predloži ideju"}
      </button>
      {greska && <p className="text-sm text-accent-b">{greska}</p>}
    </form>
  );
}
