-- קליל · סכמת סנכרון ל-Supabase (Postgres) עם Row Level Security
-- להריץ פעם אחת ב-SQL Editor של פרויקט Supabase חדש. אין כאן נתונים, סכומים או סודות.
-- עקרונות:
--   * משק בית אחד = בדיוק שני חברים (slot 'gavir' ו-'esti'), כל אחד עם חשבון Auth משלו (magic link במייל).
--   * כל משתמש כותב, מעדכן ומוחק רק שורות שלו (user_id = auth.uid()).
--   * בן הזוג קורא: תקציב הבית, הקטגוריות, ההוצאות המשותפות וההכנסות (סך הבית מחושב מהן).
--   * הוצאות אישיות ותקציב אישי של בן הזוג לא נקראים בכלל. רק הפונקציה partner_remaining מחזירה מספר אחד: היתרה.

create extension if not exists pgcrypto;

-- ---------- משק בית וחברים ----------
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'הבית שלנו',
  invite_code text unique,                      -- קוד הצטרפות חד-פעמי, מתאפס אחרי שהחבר השני מצטרף
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  slot text not null check (slot in ('gavir','esti')),
  user_id uuid not null unique references auth.users(id) on delete cascade, -- משתמש שייך למשק בית אחד בלבד
  joined_at timestamptz not null default now(),
  primary key (household_id, slot)              -- לכל היותר שני חברים, אחד לכל slot
);

-- פונקציות עזר (security definer כדי למנוע רקורסיה במדיניות RLS)
create or replace function public.my_household() returns uuid
language sql stable security definer set search_path = public as $$
  select household_id from household_members where user_id = auth.uid()
$$;

create or replace function public.is_member(h uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from household_members where household_id = h and user_id = auth.uid())
$$;

-- יצירת משק בית: הראשון בוחר slot ומקבל קוד הזמנה לבן/בת הזוג
create or replace function public.create_household(p_slot text) returns table (household_id uuid, invite_code text)
language plpgsql security definer set search_path = public as $$
declare h uuid; code text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_slot not in ('gavir','esti') then raise exception 'bad slot'; end if;
  if exists (select 1 from household_members where user_id = auth.uid()) then raise exception 'already in a household'; end if;
  code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
  insert into households (created_by, invite_code) values (auth.uid(), code) returning id into h;
  insert into household_members (household_id, slot, user_id) values (h, p_slot, auth.uid());
  insert into household_state (household_id) values (h);
  return query select h, code;
end $$;

-- הצטרפות עם קוד: מקבלים את ה-slot הפנוי. אחרי ההצטרפות הקוד נמחק ומשק הבית סגור
create or replace function public.join_household(p_code text) returns table (household_id uuid, slot text)
language plpgsql security definer set search_path = public as $$
declare h uuid; free_slot text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if exists (select 1 from household_members where user_id = auth.uid()) then raise exception 'already in a household'; end if;
  select id into h from households where invite_code = upper(trim(p_code));
  if h is null then raise exception 'invalid code'; end if;
  select s into free_slot from unnest(array['gavir','esti']) s
    where s not in (select m.slot from household_members m where m.household_id = h) limit 1;
  if free_slot is null then raise exception 'household full'; end if;
  insert into household_members (household_id, slot, user_id) values (h, free_slot, auth.uid());
  update households set invite_code = null where id = h;
  return query select h, free_slot;
end $$;

-- ---------- נתונים משותפים לבית (שני החברים קוראים וכותבים) ----------
create table public.categories (
  household_id uuid not null references public.households(id) on delete cascade,
  id text not null,
  name text not null,
  kind text not null default 'want' check (kind in ('need','want')),
  budget numeric(12,2) not null default 0 check (budget >= 0),
  sort int not null default 0,
  updated_by uuid default auth.uid(),
  updated_at timestamptz not null default now(),
  primary key (household_id, id)
);

create table public.household_state (
  household_id uuid primary key references public.households(id) on delete cascade,
  fund_name text not null default 'קרן חירום',
  fund_target numeric(12,2) not null default 0,
  fund_saved numeric(12,2) not null default 0,
  plans jsonb not null default '{}'::jsonb,       -- אישורי תוכנית חודשית משותפת
  subs_reviewed timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------- נתונים אישיים (כל אחד כותב רק את שלו) ----------
create table public.incomes (
  id text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text not null,
  amount numeric(12,2) not null check (amount >= 0),
  day int not null check (day between 1 and 31),
  updated_at timestamptz not null default now()
);

create table public.expenses (
  id text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  scope text not null check (scope in ('shared','personal')),
  cat text not null,
  amount numeric(12,2) not null check (amount > 0),
  note text,
  date date not null,
  ts text,
  updated_at timestamptz not null default now()
);
create index on public.expenses (household_id, date);

create table public.personal_budgets (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  updated_at timestamptz not null default now()
);

create table public.templates (
  id text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text not null,
  amount numeric(12,2) not null check (amount > 0),
  cat text not null,
  scope text not null check (scope in ('shared','personal'))
);

-- התקדמות והישגים: פרטי לכל משתמש
create table public.user_state (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,        -- unlocked, openDays, guideViews, fastAdds, deposits, recentCats
  updated_at timestamptz not null default now()
);

-- ---------- RLS ----------
alter table public.households        enable row level security;
alter table public.household_members enable row level security;
alter table public.categories        enable row level security;
alter table public.household_state   enable row level security;
alter table public.incomes           enable row level security;
alter table public.expenses          enable row level security;
alter table public.personal_budgets  enable row level security;
alter table public.templates         enable row level security;
alter table public.user_state        enable row level security;

-- משק בית וחברים: קריאה לחברים בלבד. יצירה והצטרפות רק דרך הפונקציות למעלה
create policy hh_read  on public.households        for select using (public.is_member(id));
create policy mem_read on public.household_members for select using (public.is_member(household_id));

-- קטגוריות ומצב הבית: נתונים משותפים, שני החברים קוראים וכותבים
create policy cat_read  on public.categories for select using (public.is_member(household_id));
create policy cat_ins   on public.categories for insert with check (public.is_member(household_id));
create policy cat_upd   on public.categories for update using (public.is_member(household_id)) with check (public.is_member(household_id));
create policy cat_del   on public.categories for delete using (public.is_member(household_id));
create policy hs_read   on public.household_state for select using (public.is_member(household_id));
create policy hs_upd    on public.household_state for update using (public.is_member(household_id)) with check (public.is_member(household_id));

-- הכנסות: בן הזוג רואה (סך הבית מחושב מהן), עריכה רק של שלך
create policy inc_read on public.incomes for select using (public.is_member(household_id));
create policy inc_ins  on public.incomes for insert with check (user_id = auth.uid() and household_id = public.my_household());
create policy inc_upd  on public.incomes for update using (user_id = auth.uid()) with check (user_id = auth.uid() and household_id = public.my_household());
create policy inc_del  on public.incomes for delete using (user_id = auth.uid());

-- הוצאות: משותפות גלויות לשניים, אישיות רק לבעלים. כתיבה רק של שלך
create policy exp_read on public.expenses for select using (
  public.is_member(household_id) and (scope = 'shared' or user_id = auth.uid()));
create policy exp_ins  on public.expenses for insert with check (user_id = auth.uid() and household_id = public.my_household());
create policy exp_upd  on public.expenses for update using (user_id = auth.uid()) with check (user_id = auth.uid() and household_id = public.my_household());
create policy exp_del  on public.expenses for delete using (user_id = auth.uid());

-- תקציב אישי: רק הבעלים קורא וכותב. בן הזוג מקבל רק יתרה דרך partner_remaining
create policy pb_all on public.personal_budgets for all using (user_id = auth.uid())
  with check (user_id = auth.uid() and household_id = public.my_household());

-- תבניות: אישיות של הבעלים, משותפות גלויות לבית. כתיבה רק של שלך
create policy tpl_read on public.templates for select using (
  public.is_member(household_id) and (scope = 'shared' or user_id = auth.uid()));
create policy tpl_ins  on public.templates for insert with check (user_id = auth.uid() and household_id = public.my_household());
create policy tpl_upd  on public.templates for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy tpl_del  on public.templates for delete using (user_id = auth.uid());

-- התקדמות: פרטית
create policy us_all on public.user_state for all using (user_id = auth.uid())
  with check (user_id = auth.uid() and household_id = public.my_household());

-- היתרה האישית של בן הזוג לחודש מסוים ('YYYY-MM'): מספר אחד, בלי תקרה, בלי סכום שנוצל ובלי פירוט
create or replace function public.partner_remaining(p_month text) returns numeric
language plpgsql stable security definer set search_path = public as $$
declare h uuid := public.my_household(); partner uuid; b numeric; s numeric;
begin
  if h is null then return null; end if;
  select user_id into partner from household_members where household_id = h and user_id <> auth.uid();
  if partner is null then return null; end if;
  select coalesce(amount,0) into b from personal_budgets where user_id = partner;
  select coalesce(sum(amount),0) into s from expenses
    where user_id = partner and scope = 'personal' and to_char(date,'YYYY-MM') = p_month;
  return coalesce(b,0) - coalesce(s,0);
end $$;

revoke all on function public.partner_remaining(text) from public, anon;
grant execute on function public.partner_remaining(text) to authenticated;
revoke all on function public.create_household(text) from public, anon;
grant execute on function public.create_household(text) to authenticated;
revoke all on function public.join_household(text) from public, anon;
grant execute on function public.join_household(text) to authenticated;
revoke all on function public.my_household() from public, anon;
grant execute on function public.my_household() to authenticated;
revoke all on function public.is_member(uuid) from public, anon;
grant execute on function public.is_member(uuid) to authenticated;

-- שינויים בזמן אמת (אופציונלי): האפליקציה מאזינה ומושכת מחדש כשבן הזוג מעדכן
alter publication supabase_realtime add table public.expenses, public.incomes, public.categories, public.household_state, public.templates;
