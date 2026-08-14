"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Activity, Category, Effort } from "@/lib/database.types";
import { CATEGORIES, EFFORTS } from "@/lib/enums";

const polje =
  "min-h-[44px] rounded-xl border border-border bg-surface px-4 text-base outline-none focus:border-accent-a";

// Izmena sadržaja ideje. Datum/termin se menja na „Termin" sekciji, ne ovde.
export default function IzmeniForm({ activity }: { activity: Activity }) {
  const router = useRouter();
  const [radim, setRadim] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  const [title, setTitle] = useState(activity.title);
  const [description, setDescription] = useState(activity.description ?? "");
  const [category, setCategory] = useState<Category>(activity.category);
  const [effort, setEffort] = useState<Effort>(activity.effort);
  const [locationName, setLocationName] = useState(activity.location_name ?? "");
  const [locationUrl, setLocationUrl] = useState(activity.location_url ?? "");
  const [referenceUrl, setReferenceUrl] = useState(activity.reference_url ?? "");
  const [deadline, setDeadline] = useState(activity.deadline ?? "");

  async function sacuvaj(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setRadim(true);
    setGreska(null);

    const { error } = await createClient()
      .from("activities")
      .update({
        title: title.trim(),
        description: description.trim() || null,
        category,
        effort,
        location_name: locationName.trim() || null,
        location_url: locationUrl.trim() || null,
        reference_url: referenceUrl.trim() || null,
        deadline: deadline || null,
      })
      .eq("id", activity.id);

    if (error) {
      setGreska(error.message);
      setRadim(false);
      return;
    }
    router.replace(`/aktivnost/${activity.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={sacuvaj} className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-sm text-muted">
          Šta biste voleli da uradite? *
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
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

      <div className="mt-2 flex gap-3">
        <button
          type="submit"
          disabled={radim}
          className="min-h-[48px] flex-1 rounded-xl bg-accent-a px-4 font-medium text-white transition-opacity disabled:opacity-60"
        >
          {radim ? "Čuvam…" : "Sačuvaj izmene"}
        </button>
        <button
          type="button"
          onClick={() => router.replace(`/aktivnost/${activity.id}`)}
          className="min-h-[48px] rounded-xl border border-border px-4 text-sm"
        >
          Otkaži
        </button>
      </div>
      {greska && <p className="text-sm text-accent-b">{greska}</p>}
    </form>
  );
}
