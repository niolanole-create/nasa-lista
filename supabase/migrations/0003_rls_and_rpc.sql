-- Faza 1: RLS politike i RPC funkcije za par.

-- Helper: couple_id trenutno prijavljenog korisnika.
-- SECURITY DEFINER da bi zaobišao RLS na profiles (inače beskonačna rekurzija
-- u profiles politici koja poziva ovu funkciju).
create or replace function public.current_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select couple_id from public.profiles where id = auth.uid();
$$;

-- Generator koda za poziv: 8 znakova, bez zbunjujućih (0/O/1/I).
create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
begin
  loop
    code := '';
    for i in 1..8 loop
      code := code || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
    end loop;
    exit when not exists (select 1 from public.couples where invite_code = code);
  end loop;
  return code;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.couples enable row level security;
alter table public.profiles enable row level security;

-- Deterministične privilegije: uskrati sve pa dodeli tačno šta treba.
-- (service_role zadržava pun pristup i zaobilazi RLS.)
revoke all on public.couples from anon, authenticated;
revoke all on public.profiles from anon, authenticated;
grant select on public.couples to authenticated;
grant select, insert, update on public.profiles to authenticated;

-- PROFILES: čitaš svoj profil i profil partnera (isti couple_id).
create policy "profiles_select_own_or_partner"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or (
      couple_id is not null
      and couple_id = public.current_couple_id()
    )
  );

-- PROFILES: menjaš samo svoj profil.
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- PROFILES: insert samo za sebe (rezerva; profil inače pravi trigger).
create policy "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- COUPLES: čitaš samo svoj par. (Kreiranje/pridruživanje ide kroz RPC.)
create policy "couples_select_member"
  on public.couples for select
  to authenticated
  using (id = public.current_couple_id());

-- ---------------------------------------------------------------------------
-- RPC: kreiranje i pridruživanje paru (SECURITY DEFINER, gejtovano na auth.uid())
-- ---------------------------------------------------------------------------

-- Napravi par i priključi trenutnog korisnika kao prvog člana.
create or replace function public.create_couple(couple_name text default null)
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_couple public.couples;
begin
  if uid is null then
    raise exception 'Nisi prijavljen/a.' using errcode = 'insufficient_privilege';
  end if;

  if (select couple_id from public.profiles where id = uid) is not null then
    raise exception 'Već si u paru.' using errcode = 'check_violation';
  end if;

  insert into public.couples (name, invite_code, created_by)
  values (couple_name, public.generate_invite_code(), uid)
  returning * into new_couple;

  update public.profiles set couple_id = new_couple.id where id = uid;

  return new_couple;
end;
$$;

-- Priključi trenutnog korisnika postojećem paru preko koda.
create or replace function public.join_couple(code text)
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  target public.couples;
  member_count int;
begin
  if uid is null then
    raise exception 'Nisi prijavljen/a.' using errcode = 'insufficient_privilege';
  end if;

  if (select couple_id from public.profiles where id = uid) is not null then
    raise exception 'Već si u paru.' using errcode = 'check_violation';
  end if;

  select * into target from public.couples
  where invite_code = upper(trim(code));

  if target.id is null then
    raise exception 'Neispravan kod za poziv.' using errcode = 'no_data_found';
  end if;

  select count(*) into member_count
  from public.profiles where couple_id = target.id;

  if member_count >= 2 then
    raise exception 'Par je već popunjen.' using errcode = 'check_violation';
  end if;

  update public.profiles set couple_id = target.id where id = uid;

  return target;
end;
$$;

-- Prava izvršavanja: samo prijavljeni. Interne helpere ne izlažemo klijentu.
revoke all on function public.create_couple(text) from public, anon;
revoke all on function public.join_couple(text) from public, anon;
revoke all on function public.generate_invite_code() from public, anon, authenticated;
grant execute on function public.create_couple(text) to authenticated;
grant execute on function public.join_couple(text) to authenticated;
grant execute on function public.current_couple_id() to authenticated;
