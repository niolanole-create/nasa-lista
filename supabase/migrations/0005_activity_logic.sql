-- Faza 2: automatska logika stanja i audit trail.

-- updated_at se osvežava pri svakoj izmeni aktivnosti.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

-- Audit: upis događaja pri kreiranju i pri promeni stanja aktivnosti.
-- SECURITY DEFINER da bi mogao da upiše u activity_events (klijent nema insert).
create or replace function public.log_activity_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_events (activity_id, actor_id, event_type, payload)
    values (
      new.id, new.created_by, 'created',
      jsonb_build_object('status', new.status, 'title', new.title)
    );
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.activity_events (activity_id, actor_id, event_type, payload)
    values (
      new.id, auth.uid(), 'status_changed',
      jsonb_build_object('from', old.status, 'to', new.status)
    );
  end if;
  return new;
end;
$$;

create trigger activities_audit
  after insert or update on public.activities
  for each row execute function public.log_activity_change();

-- Kad partner odgovori: upiši događaj i izvedi novo stanje aktivnosti.
--  yes   → accepted (ako je bila proposed)
--  no    → declined (ako je bila proposed ili accepted)
--  maybe → ostaje proposed (pada u „Razmisliću" preko postojanja odgovora)
create or replace function public.apply_response()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  current_status activity_status;
begin
  select status into current_status
  from public.activities where id = new.activity_id;

  insert into public.activity_events (activity_id, actor_id, event_type, payload)
  values (
    new.activity_id, new.user_id, 'responded',
    jsonb_build_object('response', new.response, 'note', new.note)
  );

  if new.response = 'yes' and current_status = 'proposed' then
    update public.activities set status = 'accepted' where id = new.activity_id;
  elsif new.response = 'no' and current_status in ('proposed', 'accepted') then
    update public.activities set status = 'declined' where id = new.activity_id;
  end if;

  return new;
end;
$$;

create trigger responses_apply
  after insert or update on public.responses
  for each row execute function public.apply_response();

-- „Oživi" odbijenu ideju: vrati u proposed i obriši prethodne odgovore,
-- da bi partner ponovo mogao da odgovori. SECURITY DEFINER + provera para.
create or replace function public.revive_activity(activity_id uuid)
returns public.activities
language plpgsql security definer set search_path = public as $$
declare
  target public.activities;
begin
  select * into target from public.activities where id = activity_id;

  if target.id is null or target.couple_id <> public.current_couple_id() then
    raise exception 'Nije dozvoljeno.' using errcode = 'insufficient_privilege';
  end if;

  delete from public.responses where responses.activity_id = revive_activity.activity_id;
  update public.activities set status = 'proposed' where id = activity_id
  returning * into target;

  return target;
end;
$$;

revoke all on function public.revive_activity(uuid) from public, anon;
grant execute on function public.revive_activity(uuid) to authenticated;
