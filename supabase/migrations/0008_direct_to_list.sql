-- Faza 4: pojednostavljenje za par.
-- Ideja ide pravo na listu — nova aktivnost je odmah 'accepted', bez odobravanja.
-- (Reakcije Hoću/Neću/Možda ostaju moguće, ali nisu uslov da ideja bude na listi.)

alter table public.activities alter column status set default 'accepted';

-- Postojeće predloge koji su čekali odobrenje prebaci na listu.
update public.activities set status = 'accepted' where status = 'proposed';
