-- Faza 3: predlozi termina.

create type proposal_status as enum (
  'pending', 'accepted', 'rejected', 'superseded'
);

create table public.date_proposals (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  proposed_by uuid not null default auth.uid()
    references auth.users (id) on delete set null,
  proposed_at timestamptz not null, -- predloženi datum i vreme
  note text,
  status proposal_status not null default 'pending',
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

create index date_proposals_activity_idx
  on public.date_proposals (activity_id, status);

-- RLS: čitanje u okviru para; upisi idu kroz SECURITY DEFINER RPC.
alter table public.date_proposals enable row level security;
revoke all on public.date_proposals from anon, authenticated;
grant select on public.date_proposals to authenticated;

create policy "date_proposals_select_couple"
  on public.date_proposals for select to authenticated
  using (
    exists (
      select 1 from public.activities a
      where a.id = date_proposals.activity_id
        and a.couple_id = public.current_couple_id()
    )
  );

alter publication supabase_realtime add table public.date_proposals;
