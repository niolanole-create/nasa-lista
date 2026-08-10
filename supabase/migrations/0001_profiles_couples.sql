-- Faza 1: osnovne tabele para i profila.

-- couples: jedan red po paru.
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  name text,
  invite_code text not null unique,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- profiles: jedan red po korisniku (id = auth.users.id).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  accent_color text,
  couple_id uuid references public.couples (id) on delete set null,
  created_at timestamptz not null default now()
);

create index profiles_couple_id_idx on public.profiles (couple_id);

-- Ograničenje: najviše 2 profila po paru. Proverava se i na nivou baze,
-- nezavisno od RPC funkcija koje spajaju korisnike (spec sekcija 3).
create or replace function public.enforce_couple_size()
returns trigger
language plpgsql
as $$
begin
  if new.couple_id is not null then
    if (
      select count(*)
      from public.profiles
      where couple_id = new.couple_id
        and id <> new.id
    ) >= 2 then
      raise exception 'Par već ima dva člana.' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_enforce_couple_size
  before insert or update of couple_id on public.profiles
  for each row execute function public.enforce_couple_size();
