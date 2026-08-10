@AGENTS.md

# Naša lista — konvencije projekta

Privatna PWA za par: zajednička lista ideja i planova. Puna specifikacija je u
`docs/PROJECT_SPEC.md` — ona je izvor istine, ovaj fajl je sažetak konvencija.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4.
- **Supabase** (Postgres, Auth, Realtime, Storage), hosting na **Vercel**.
- Napomena: spec pominje „Next.js 15"; koristimo 16 (aktuelni stable) — App
  Router i Server Components rade isto.

## Jezik

- **Interfejs: srpski, latinica.** Ton: drugo lice jednine, bez korporativnog
  tona. Dugme kaže tačno šta radi (npr. „Predloži termin").
- **Kod, imena tabela/kolona/varijabli: engleski.**
- Fajlovi imaju `latin-ext` subset fontova zbog č, ć, š, ž, đ.

## Arhitektura

- **Server Components po defaultu**; `"use client"` samo gde treba
  interaktivnost.
- **SQL isključivo kroz migracije** u `supabase/migrations/` — nikad ručno kroz
  UI. Vidi `supabase/README.md`.
- **RLS obavezan** na svim tabelama: korisnik vidi/menja samo redove svog
  `couple_id`. Za tabele bez `couple_id` provera ide preko join-a na
  `activities`. `responses.user_id` mora biti `auth.uid()`.

## Tok stanja aktivnosti (najvažnija logika)

```
PROPOSED → ACCEPTED → SCHEDULED → COMPLETED
   ↓           ↓          ↓
DECLINED   (nazad)    (nazad)   → ARCHIVED
```

- Autor predloga ne glasa na svoj predlog (njegov „da" je implicitan).
- `SCHEDULED` zahteva **dve nezavisne potvrde istog termina**.
- Svaka promena stanja se upisuje u `activity_events` (audit trail).
- Piši kratke komentare samo gde logika nije očigledna — posebno kod prelaza
  stanja.

## Dizajn

- Paleta i fontovi su definisani u `src/app/globals.css` (`@theme`).
  Boje: `background`, `foreground`, `surface`, `muted`, `border`, `accent-a`
  (partner A), `accent-b` (partner B), `warning` (rok).
- Potpis brenda: kartica nosi traku u boji autora; kad oboje prihvate → gradijent
  obe boje.
- Mobile-first, min-tap 44px, poštuj `prefers-reduced-motion`.

## Radni tok

- **Faza po faza** (spec sekcija 7). Posle svake faze: kratak izveštaj + commit,
  pa se čeka potvrda „kreni" za sledeću.
- Ne uvoditi biblioteke koje nisu neophodne (bez state-management dok ne zatreba).
- Kod dvosmislenosti u spec-u — pitati, ne pretpostavljati.

## Komande

- `npm run dev` — dev server
- `npm run build` — mora da prođe bez grešaka i upozorenja (kriterijum prihvatanja)
- `npm run lint` — ESLint
- `npm run format` / `npm run format:check` — Prettier
