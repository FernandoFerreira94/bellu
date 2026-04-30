-- Allow expediente until 19:00 and update the default schedule.

alter table public.working_hours
  alter column end_time set default '19:00';

alter table public.working_hours
  drop constraint if exists working_hours_time_check;

alter table public.working_hours
  add constraint working_hours_time_check check (
    start_time >= '08:00' and end_time <= '19:00' and start_time < end_time
  );

update public.working_hours
set end_time = '19:00'
where day_of_week between 1 and 5
  and start_time = '08:00'
  and end_time = '18:00';

alter table public.bookings
  drop constraint if exists bookings_within_hours;

alter table public.bookings
  add constraint bookings_within_hours check (
    extract(hour from start_time at time zone 'America/Sao_Paulo') >= 8 and
    extract(hour from end_time at time zone 'America/Sao_Paulo') <= 19
  );
