-- Faza 2: jezgro — aktivnosti, odgovori, audit trail.

-- Enumi (spec sekcija 3).
create type activity_status as enum (
  'proposed', 'accepted', 'declined', 'scheduled', 'completed', 'archived'
);
create type response_type as enum ('yes', 'no', 'maybe');
create type category as enum (
  'izlazak', 'putovanje', 'hrana', 'kultura', 'aktivnost', 'kod_kuce', 'ostalo'
);
create type effort as enum ('spontano', 'treba_planirati', 'veliki_poduhvat');

-- activities: jedna ideja/plan.
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.current_couple_id()
    references public.couples (id) on delete cascade,
  created_by uuid not null default auth.uid()
    references auth.users (id) on delete set null,
  title text not null,
  description text,
  category category not null default 'ostalo',
  effort effort not null default 'treba_planirati',
  estimated_cost numeric, -- RSD, opciono
  location_name text,
  location_url text,
  reference_url text,
  deadline date, -- opciono (npr. koncert je 12.9.)
  status activity_status not null default 'proposed',
  scheduled_at timestamptz, -- null dok nije zakazano (Faza 3)
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index activities_couple_status_idx
  on public.activities (couple_id, status);

-- responses: odgovor partnera na ideju (hoću/neću/možda).
create table public.responses (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  response response_type not null,
  note text,
  created_at timestamptz not null default now(),
  unique (activity_id, user_id)
);

create index responses_activity_idx on public.responses (activity_id);

-- activity_events: audit trail svih promena (feed „Šta je novo").
create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index activity_events_activity_idx
  on public.activity_events (activity_id, created_at);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.activities enable row level security;
alter table public.responses enable row level security;
alter table public.activity_events enable row level security;

revoke all on public.activities from anon, authenticated;
revoke all on public.responses from anon, authenticated;
revoke all on public.activity_events from anon, authenticated;

grant select, insert, update on public.activities to authenticated;
grant select, insert, update on public.responses to authenticated;
grant select on public.activity_events to authenticated; -- upis samo kroz trigere

-- ACTIVITIES: sve unutar svog para.
create policy "activities_select_couple"
  on public.activities for select to authenticated
  using (couple_id = public.current_couple_id());

create policy "activities_insert_couple"
  on public.activities for insert to authenticated
  with check (
    couple_id = public.current_couple_id()
    and created_by = auth.uid()
  );

create policy "activities_update_couple"
  on public.activities for update to authenticated
  using (couple_id = public.current_couple_id())
  with check (couple_id = public.current_couple_id());

-- RESPONSES: čitanje u okviru para; upis samo za sebe i NE na svoj predlog.
create policy "responses_select_couple"
  on public.responses for select to authenticated
  using (
    exists (
      select 1 from public.activities a
      where a.id = responses.activity_id
        and a.couple_id = public.current_couple_id()
    )
  );

create policy "responses_insert_partner"
  on public.responses for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.activities a
      where a.id = responses.activity_id
        and a.couple_id = public.current_couple_id()
        and a.created_by <> auth.uid() -- autor ne glasa na svoj predlog
    )
  );

create policy "responses_update_own"
  on public.responses for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ACTIVITY_EVENTS: samo čitanje u okviru para (upis ide kroz definer trigere).
create policy "activity_events_select_couple"
  on public.activity_events for select to authenticated
  using (
    exists (
      select 1 from public.activities a
      where a.id = activity_events.activity_id
        and a.couple_id = public.current_couple_id()
    )
  );

-- Realtime: prati promene aktivnosti i odgovora.
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.responses;
