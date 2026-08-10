# Specifikacija: "Naša lista" — zajednička platforma za planiranje aktivnosti u dvoje

> **Uputstvo za korišćenje:** ovaj fajl prosledi Claude Code-u kao početni prompt (ili ga sačuvaj kao `PROJECT_SPEC.md` u praznom folderu i reci: *"Pročitaj PROJECT_SPEC.md i kreni sa Fazom 0"*). Pre nego što ga pošalješ, proveri sekciju **0. Pretpostavke** i promeni ono što ti ne odgovara.

---

## 0. Pretpostavke (izmeni po potrebi pre slanja)

- Stack: **Next.js 15 (App Router) + TypeScript + Tailwind CSS + Supabase** (Postgres, Auth, Realtime, Storage), hosting na **Vercel**.
- Aplikacija je **PWA** — primarno se koristi na telefonu, mora da se doda na home screen i radi offline za čitanje.
- Jezik celog interfejsa je **srpski (latinica)**. Kod, imena tabela, kolona i varijabli su na **engleskom**.
- Aplikacija ima **tačno dva korisnika** po "paru", ali model podataka mora da podrži više parova (multi-tenant) da bi RLS bio ispravan.
- Login: **Supabase Auth, magic link preko e-maila** (bez lozinki). Povezivanje partnera preko **koda za poziv**.
- Nema plaćanja, nema javnog sadržaja, nema deljenja sa trećim licima.

---

## 1. Šta gradimo

Privatna web aplikacija za par. Služi kao **zajednička lista ideja i planova** — mesto gde oboje ubacuju šta bi voleli da urade zajedno (izlazak, putovanje, film, restoran, koncert, aktivnost), drugi partner potvrđuje da li mu se ideja sviđa, a tek kada oboje kažu "da" — dogovara se konkretan datum.

Ključna razlika u odnosu na običnu To-Do listu: **ništa ne postaje plan dok se oboje ne saglase.** Aplikacija vodi ideju kroz jasan tok stanja i uvek pokazuje **na kome je red da odreaguje**.

---

## 2. Tok stanja (najvažniji deo — implementirati precizno)

Svaka stavka (`activity`) prolazi kroz sledeća stanja:

```
PROPOSED  →  ACCEPTED  →  SCHEDULED  →  COMPLETED
    ↓            ↓            ↓
 DECLINED    (može nazad)  (može nazad)   →  ARCHIVED
```

1. **PROPOSED (Predloženo)** — jedan partner unese ideju. Automatski se računa da je autor rekao "da". Drugi partner dobija stavku u sekciji "Čeka tvoj odgovor".
2. Drugi partner odgovara: **Hoću / Neću / Možda kasnije**.
   - "Hoću" → stavka prelazi u **ACCEPTED (Prihvaćeno)**.
   - "Neću" → **DECLINED (Odbijeno)**, ide u arhivu sa opcionim komentarom zašto. Može se kasnije "oživeti".
   - "Možda kasnije" → ostaje u **PROPOSED**, ali se sklanja iz "Čeka tvoj odgovor" i pada u listu "Razmisliću" (bez notifikacija, dok se ne promeni odgovor).
3. **ACCEPTED** — oboje hoće, ali nema termina. Ovo je "banka ideja" — najvažniji ekran u aplikaciji.
4. Bilo ko predlaže **datum i vreme** (`date_proposal`). Drugi partner potvrđuje ili kontrira novim predlogom termina. Kad oboje potvrde isti termin → **SCHEDULED (Zakazano)**.
5. Posle datuma stavka automatski nudi da se obeleži kao **COMPLETED (Urađeno)** — sa opcionom ocenom (1–5) od svakog partnera i kratkim utiskom + fotografijom.
6. **ARCHIVED** — ručno sklonjeno sa liste.

**Pravila koja moraju da važe:**
- Autor predloga ne može da odgovori na sopstveni predlog (njegov "da" je implicitan).
- Prelaz u `SCHEDULED` zahteva **dve potvrde istog termina** — ne sme jedna strana sama da zakaže.
- Svaka promena stanja se upisuje u `activity_events` (audit trail) — koristi se za feed "Šta je novo".
- Stavka u `SCHEDULED` može da se vrati u `ACCEPTED` ako neko otkaže termin (uz obavezan razlog).

---

## 3. Model podataka (Supabase / Postgres)

Koristi `uuid` primarne ključeve, `timestamptz` za vremena, i **enum tipove** za statuse.

```sql
-- enumi
activity_status: 'proposed' | 'accepted' | 'declined' | 'scheduled' | 'completed' | 'archived'
response_type:   'yes' | 'no' | 'maybe'
category:        'izlazak' | 'putovanje' | 'hrana' | 'kultura' | 'aktivnost' | 'kod_kuce' | 'ostalo'
effort:          'spontano' | 'treba_planirati' | 'veliki_poduhvat'
```

**profiles** — `id (=auth.users.id)`, `display_name`, `avatar_url`, `accent_color`, `couple_id`, `created_at`

**couples** — `id`, `name`, `invite_code (unique, 8 znakova)`, `created_by`, `created_at`
- Constraint / provera u aplikaciji: maksimalno 2 profila po `couple_id`.

**activities** — `id`, `couple_id`, `created_by`, `title`, `description`, `category`, `effort`, `estimated_cost` (numeric, RSD, opciono), `location_name`, `location_url` (Google Maps link), `reference_url` (link ka događaju/sajtu), `deadline` (opciono — npr. "koncert je 12.9., posle toga nema smisla"), `status`, `scheduled_at` (timestamptz, null dok nije zakazano), `completed_at`, `created_at`, `updated_at`

**responses** — `id`, `activity_id`, `user_id`, `response (response_type)`, `note`, `created_at` — unique (`activity_id`, `user_id`)

**date_proposals** — `id`, `activity_id`, `proposed_by`, `proposed_at (timestamptz)`, `note`, `status ('pending'|'accepted'|'rejected'|'superseded')`, `responded_at`

**comments** — `id`, `activity_id`, `user_id`, `body`, `created_at`

**memories** — `id`, `activity_id`, `user_id`, `rating (1-5)`, `note`, `photo_url`, `created_at`

**activity_events** — `id`, `activity_id`, `actor_id`, `event_type`, `payload jsonb`, `created_at`

### RLS (obavezno, ne preskakati)
- Uključi RLS na svim tabelama.
- Osnovno pravilo: korisnik vidi i menja **samo redove čiji `couple_id` odgovara njegovom `couple_id`** (kroz `profiles`).
- Za tabele bez `couple_id` (responses, comments, date_proposals, memories) — provera ide preko `join`-a na `activities`.
- `responses.user_id` mora biti `auth.uid()` — niko ne može da odgovori u ime partnera.
- Napiši i **testove RLS-a**: skripta koja se prijavi kao korisnik B i pokuša da pročita/izmeni tuđe podatke i očekuje neuspeh.

---

## 4. Ekrani

### 4.1 Danas (početni ekran)
Tri bloka, tim redom:
1. **Čeka tvoj odgovor** — predlozi partnera na koje nisi reagovao. Velike kartice, dugmad *Hoću / Možda kasnije / Neću* direktno na kartici.
2. **Zakazano** — sledeća 1–3 termina, sa odbrojavanjem ("za 4 dana").
3. **Čeka partnera** — tvoji predlozi na koje on/ona nije odgovorio/la. Sa mogućnošću "podseti" (jedan podsetnik dnevno max).

Ako nema ničega ni u jednom bloku → prazan ekran koji poziva na akciju: dugme *Dodaj ideju* i 3 nasumična predloga iz banke ideja.

### 4.2 Naše ideje
Sve `accepted` stavke bez termina. Filteri: kategorija, koliko košta, koliko traje (`effort`), ko je predložio. Sortiranje: najnovije / najstarije / po roku (`deadline`).
- Dugme **"Šta ćemo večeras?"** — nasumično izvlači jednu ideju iz `accepted` sa `effort = 'spontano'`. Mala animacija izvlačenja. Ovo je "signature" funkcija aplikacije.

### 4.3 Kalendar
Mesečni prikaz `scheduled` stavki + lista nadolazećih. Klik na dan → predloži aktivnost za taj dan. Export pojedinačnog termina kao `.ics` fajl.

### 4.4 Detalj aktivnosti
Naslov, opis, kategorija, ko je predložio i kada, trenutno stanje sa jasnom porukom ("Čeka se Anin odgovor", "Oboje hoćete — dogovorite termin"), predlozi termina sa dugmadima, komentari (realtime), istorija promena, i akcije zavisne od stanja.

### 4.5 Uspomene
Završene aktivnosti, obrnutim hronološkim redom, sa ocenama oboje i fotografijama. Godišnja statistika: koliko planova realizovano, ko je više predlagao, najbolja ocena, najduže čekana ideja.

### 4.6 Podešavanja
Ime, avatar, boja, povezivanje partnera preko koda, notifikacije, odjava.

---

## 5. Notifikacije

- **Faza 1:** in-app badge + Supabase Realtime (kartice se ažuriraju uživo bez refreša).
- **Faza 2:** Web Push (VAPID) za četiri događaja: novi predlog, odgovor na tvoj predlog, novi predlog termina, podsetnik dan pre zakazanog termina.
- Nikad više od jedne notifikacije po događaju. Podsetnik "šutni partnera" ograničen na jednom dnevno po stavci.

---

## 6. Dizajn

Ne pravi generičnu SaaS aplikaciju sa belim karticama i plavim dugmadima. Vodeća ideja: **dva autora, jedan prostor.**

- Svaki partner ima svoju **akcentnu boju**, bira je pri registraciji. Svaka kartica nosi tanku vertikalnu traku u boji onoga ko je predložio. **Kada oboje prihvate, traka postaje gradijent obe boje** — vizuelno se odmah vidi šta je "naše", a šta još "moje". Ovo je prepoznatljivi element aplikacije, sve ostalo drži mirno i disciplinovano.
- Predlog palete (slobodno predloži bolju, ali obrazloži): pozadina `#F4F5F2`, tekst `#1A1B18`, akcent A `#0F6B6B`, akcent B `#B0335F`, upozorenje/rok `#E8B33C`.
- Tipografija: karakterni display font za naslove (npr. Bricolage Grotesque ili Fraunces) + neutralan body font (Instrument Sans ili Inter) + mono za datume i brojeve. Ne koristi isti font za sve.
- Mobile-first. Palac dohvata sve primarne akcije. Minimalna veličina tapa 44px.
- Animacije samo tamo gde nose značenje: prelaz stanja kartice, izvlačenje nasumične ideje. Poštuj `prefers-reduced-motion`.
- Tekst u interfejsu na srpskom, u drugom licu jednine, bez korporativnog tona. Dugme kaže tačno šta radi: *Predloži termin*, *Prihvati termin*, *Označi kao urađeno*.

---

## 7. Faze izrade

Radi fazu po fazu. **Posle svake faze stani, napiši šta si uradio i sačekaj potvrdu.** Svaka faza završava sa commit-om.

**Faza 0 — Setup**
Next.js + TS + Tailwind, Supabase projekat, `.env.local` template, ESLint/Prettier, folder struktura, `CLAUDE.md` sa konvencijama projekta. Deploy prazne aplikacije na Vercel da se lanac potvrdi odmah.

**Faza 1 — Auth i par**
Magic link login, kreiranje profila, kreiranje para, pridruživanje preko koda za poziv. RLS politike + testovi RLS-a. Bez ovoga se ne ide dalje.

**Faza 2 — Jezgro: aktivnosti i odgovori**
CRUD za aktivnosti, odgovori (hoću/neću/možda), prelazi stanja, ekrani "Danas" i "Naše ideje". Realtime ažuriranje.

**Faza 3 — Termini**
`date_proposals`, dvostruka potvrda, kalendar, `.ics` export, otkazivanje termina.

**Faza 4 — Uspomene i komentari**
Završavanje aktivnosti, ocene, fotografije (Supabase Storage), komentari, statistika.

**Faza 5 — PWA i notifikacije**
Manifest, service worker, offline čitanje, install prompt, Web Push.

---

## 8. Kriterijumi prihvatanja

- [ ] Korisnik B nikada ne može da pročita ni izmeni podatke drugog para (dokazano testom).
- [ ] Aktivnost ne može da uđe u `scheduled` bez dve nezavisne potvrde istog termina.
- [ ] Autor ne može da glasa na sopstveni predlog.
- [ ] Sve promene stanja vidljive su u istoriji aktivnosti.
- [ ] Aplikacija radi na telefonu, može se instalirati na home screen.
- [ ] Kada partner odgovori, ekran se ažurira bez refreša.
- [ ] Ceo interfejs je na srpskom, bez zaostalog engleskog teksta.
- [ ] `npm run build` prolazi bez grešaka i upozorenja.

---

## 9. Kako želim da radiš

- Pre kodiranja svake faze, napiši kratak plan i sačekaj "kreni".
- Ne uvodi biblioteke koje nisu neophodne. Bez state-management biblioteka dok se stvarno ne pokaže potreba.
- Server Components gde god je moguće; `"use client"` samo tamo gde treba interaktivnost.
- Svaki SQL menjaj kroz migracione fajlove u `supabase/migrations/`, nikad ručno kroz UI.
- Piši kratke komentare samo tamo gde logika nije očigledna (posebno kod prelaza stanja).
- Ako naiđeš na dvosmislenost u ovoj specifikaciji — pitaj, nemoj da pretpostavljaš.
