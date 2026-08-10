-- Faza 3: RPC logika za termine (dvostruka potvrda).

-- Predloži termin. Prethodni „pending" predlog postaje „superseded".
-- Dozvoljeno samo kad je aktivnost „accepted".
create or replace function public.propose_date(
  p_activity_id uuid,
  p_proposed_at timestamptz,
  p_note text default null
)
returns public.date_proposals
language plpgsql security definer set search_path = public as $$
declare
  a public.activities;
  novi public.date_proposals;
begin
  select * into a from public.activities where id = p_activity_id;
  if a.id is null or a.couple_id <> public.current_couple_id() then
    raise exception 'Nije dozvoljeno.' using errcode = 'insufficient_privilege';
  end if;
  if a.status <> 'accepted' then
    raise exception 'Termin se predlaže tek kad oboje prihvatite ideju.'
      using errcode = 'check_violation';
  end if;

  update public.date_proposals
    set status = 'superseded', responded_at = now()
    where activity_id = p_activity_id and status = 'pending';

  insert into public.date_proposals (activity_id, proposed_at, note)
    values (p_activity_id, p_proposed_at, p_note)
    returning * into novi;

  insert into public.activity_events (activity_id, actor_id, event_type, payload)
    values (
      p_activity_id, auth.uid(), 'date_proposed',
      jsonb_build_object('proposed_at', p_proposed_at)
    );

  return novi;
end;
$$;

-- Potvrdi termin. Sme SAMO onaj ko NIJE predložio (dve nezavisne potvrde).
-- Tek tada aktivnost prelazi u „scheduled".
create or replace function public.accept_date(p_proposal_id uuid)
returns public.activities
language plpgsql security definer set search_path = public as $$
declare
  p public.date_proposals;
  a public.activities;
begin
  select * into p from public.date_proposals where id = p_proposal_id;
  if p.id is null then
    raise exception 'Predlog ne postoji.' using errcode = 'no_data_found';
  end if;

  select * into a from public.activities where id = p.activity_id;
  if a.couple_id <> public.current_couple_id() then
    raise exception 'Nije dozvoljeno.' using errcode = 'insufficient_privilege';
  end if;
  if p.status <> 'pending' then
    raise exception 'Predlog termina više nije aktuelan.'
      using errcode = 'check_violation';
  end if;
  if p.proposed_by = auth.uid() then
    raise exception 'Termin mora da potvrdi drugi partner.'
      using errcode = 'check_violation';
  end if;

  update public.date_proposals
    set status = 'accepted', responded_at = now()
    where id = p_proposal_id;

  update public.activities
    set status = 'scheduled', scheduled_at = p.proposed_at
    where id = a.id
    returning * into a;

  return a;
end;
$$;

-- Otkaži termin: vrati u „accepted", obriši scheduled_at. Razlog je obavezan.
create or replace function public.cancel_schedule(
  p_activity_id uuid,
  p_reason text
)
returns public.activities
language plpgsql security definer set search_path = public as $$
declare
  a public.activities;
begin
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'Razlog otkazivanja je obavezan.'
      using errcode = 'check_violation';
  end if;

  select * into a from public.activities where id = p_activity_id;
  if a.id is null or a.couple_id <> public.current_couple_id() then
    raise exception 'Nije dozvoljeno.' using errcode = 'insufficient_privilege';
  end if;
  if a.status <> 'scheduled' then
    raise exception 'Aktivnost nije zakazana.' using errcode = 'check_violation';
  end if;

  update public.date_proposals
    set status = 'superseded'
    where activity_id = p_activity_id and status in ('pending', 'accepted');

  update public.activities
    set status = 'accepted', scheduled_at = null
    where id = p_activity_id
    returning * into a;

  insert into public.activity_events (activity_id, actor_id, event_type, payload)
    values (
      p_activity_id, auth.uid(), 'schedule_cancelled',
      jsonb_build_object('reason', trim(p_reason))
    );

  return a;
end;
$$;

revoke all on function public.propose_date(uuid, timestamptz, text) from public, anon;
revoke all on function public.accept_date(uuid) from public, anon;
revoke all on function public.cancel_schedule(uuid, text) from public, anon;
grant execute on function public.propose_date(uuid, timestamptz, text) to authenticated;
grant execute on function public.accept_date(uuid) to authenticated;
grant execute on function public.cancel_schedule(uuid, text) to authenticated;
