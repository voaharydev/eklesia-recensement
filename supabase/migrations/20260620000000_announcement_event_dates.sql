alter table public.announcements
  add column event_dates date[] not null default '{}';

update public.announcements
set event_dates = array[event_date]
where event_date is not null;

alter table public.announcements drop column event_date;
alter table public.announcements drop column event_time;
