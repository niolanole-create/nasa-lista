-- Faza 4: komentari po osobi na aktivnost (svako svoj) + čišćenje.
-- Zamenjuje raniju jedinstvenu kolonu `memory` (bila zajednička).

create table public.activity_notes (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  body text,
  updated_at timestamptz not null default now(),
  unique (activity_id, user_id) -- najviše jedan komentar po osobi
);

create index activity_notes_activity_idx
  on public.activity_notes (activity_id);

-- RLS: čitanje u okviru para; svako upisuje/menja samo svoj komentar.
alter table public.activity_notes enable row level security;
revoke all on public.activity_notes from anon, authenticated;
grant select, insert, update on public.activity_notes to authenticated;

create policy "activity_notes_select_couple"
  on public.activity_notes for select to authenticated
  using (
    exists (
      select 1 from public.activities a
      where a.id = activity_notes.activity_id
        and a.couple_id = public.current_couple_id()
    )
  );

create policy "activity_notes_insert_own"
  on public.activity_notes for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.activities a
      where a.id = activity_notes.activity_id
        and a.couple_id = public.current_couple_id()
    )
  );

create policy "activity_notes_update_own"
  on public.activity_notes for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter publication supabase_realtime add table public.activity_notes;

-- Ukloni staru zajedničku kolonu (zamenjena komentarima po osobi).
alter table public.activities drop column memory;
