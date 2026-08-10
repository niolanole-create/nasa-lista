# Supabase

Sve promene šeme idu **isključivo kroz migracione fajlove** u `migrations/`
(spec sekcija 9). Nikad ručno kroz Supabase UI.

## Konvencija za migracije

- Ime fajla: `<redni_broj>_<kratki_opis>.sql`, npr. `0001_init_enums.sql`.
- Redosled po broju; svaka migracija je idempotentna gde je moguće.
- Enumi, tabele, RLS politike i funkcije — svaka logička celina u svom fajlu.

## Postavka (Faza 1)

Kad napraviš Supabase projekat / lokalno okruženje:

```
npx supabase init          # kreira supabase/config.toml
npx supabase link          # poveži sa cloud projektom (ili `supabase start` za lokalno preko Docker-a)
npx supabase db push       # primeni migracije
```

Ključevi idu u `.env.local` (vidi `.env.local.example`).
