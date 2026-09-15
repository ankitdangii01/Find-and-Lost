-- CampusFind schema - source of truth for the Supabase backend.
-- Idempotent: safe to re-run (drops/creates policies and functions defensively).
-- Single admin account is recognized ONLY from the email below, at the database level.

create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- ============ STORAGE BUCKET ============
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

-- ============ PROFILES ============
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'student' check (role in ('student', 'admin')),
  department text,
  year integer,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Migrate any legacy role values to the new vocabulary.
alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = 'student' where role = 'staff';
alter table public.profiles add constraint profiles_role_check check (role in ('student', 'admin'));

alter table public.profiles enable row level security;

-- The only admin is the account whose email matches. Never trust client input for this.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- Protect the role column: clients (authenticated + anon) can never write it.
-- A column-level revoke is a no-op while table-level UPDATE is granted, so first
-- revoke table-level UPDATE, then re-grant UPDATE on only the editable columns.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, department, year, avatar_url) on public.profiles to authenticated;

-- Defense in depth: force role back to its previous value on any UPDATE.
create or replace function public.protect_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.role := old.role;
  return new;
end;
$$;

-- (Re)assert the single admin before re-arming the trigger.
drop trigger if exists protect_role_on_update on public.profiles;
update public.profiles set role = case when lower(trim(email)) = 'ankitdangi864@gmail.com' then 'admin' else 'student' end;
create trigger protect_role_on_update
  before update on public.profiles
  for each row execute procedure public.protect_role();

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_select_basic" on public.profiles;
create policy "profiles_select_basic"
  on public.profiles for select
  using (true);

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============ ITEMS ============
create table if not exists public.items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('lost', 'found')),
  title text not null,
  description text not null,
  category text,
  location text,
  date_occurred date,
  occurred_time time,
  image_url text,
  status text not null default 'active' check (status in ('active', 'claim_pending', 'resolved', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure columns added to a pre-existing items table (create table above may be a no-op).
alter table public.items add column if not exists occurred_time time;

create index if not exists items_status_idx on public.items (status);
create index if not exists items_type_idx on public.items (type);
create index if not exists items_category_idx on public.items (category);
create index if not exists items_created_at_idx on public.items (created_at);
create index if not exists items_user_type_idx on public.items (user_id, type);

alter table public.items enable row level security;

-- At most 1 lost + 1 found report per user per day.
create or replace function public.limit_daily_reports()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.items i
    where i.user_id = new.user_id
      and i.type = new.type
      and i.created_at::date = current_date
  ) then
    raise exception 'DAILY_REPORT_LIMIT';
  end if;
  return new;
end;
$$;

drop trigger if exists limit_daily_reports_on_insert on public.items;
create trigger limit_daily_reports_on_insert
  before insert on public.items
  for each row execute procedure public.limit_daily_reports();

-- Anyone (authenticated or anonymous) can read active items
drop policy if exists "items_select_active" on public.items;
create policy "items_select_active"
  on public.items for select
  using (status = 'active');

-- Owners can always read their own items (even resolved/removed)
drop policy if exists "items_select_own" on public.items;
create policy "items_select_own"
  on public.items for select
  using (auth.uid() = user_id);

-- Claimants can read items they have claimed (needed for claim history)
create or replace function public.is_claimant(target_item uuid, uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.claims c
    where c.item_id = target_item and c.claimant_id = uid
  );
$$;

drop policy if exists "items_select_claimed" on public.items;
create policy "items_select_claimed"
  on public.items for select
  using (public.is_claimant(id));

-- Admin can inspect all reports (moderation / reports management).
drop policy if exists "items_select_admin" on public.items;
create policy "items_select_admin"
  on public.items for select
  using (public.is_admin());

drop policy if exists "items_insert_own" on public.items;
create policy "items_insert_own"
  on public.items for insert
  with check (auth.uid() = user_id);

drop policy if exists "items_update_own" on public.items;
create policy "items_update_own"
  on public.items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admin can remove/close inappropriate reports.
drop policy if exists "items_update_admin" on public.items;
create policy "items_update_admin"
  on public.items for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "items_delete_own" on public.items;
create policy "items_delete_own"
  on public.items for delete
  using (auth.uid() = user_id);

-- ============ CLAIMS ============
create table if not exists public.claims (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references public.items (id) on delete cascade,
  claimant_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, claimant_id)
);

-- Migrate legacy status vocabulary.
alter table public.claims drop constraint if exists claims_status_check;
update public.claims set status = 'approved' where status = 'accepted';
alter table public.claims add constraint claims_status_check check (status in ('pending', 'approved', 'rejected', 'cancelled'));

create index if not exists claims_item_idx on public.claims (item_id);
create index if not exists claims_claimant_idx on public.claims (claimant_id);
create index if not exists claims_status_idx on public.claims (status);

alter table public.claims enable row level security;

-- No one may claim their own item.
create or replace function public.prevent_self_claim()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.items i
    where i.id = new.item_id and i.user_id = new.claimant_id
  ) then
    raise exception 'CANNOT_CLAIM_OWN_ITEM';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_self_claim_on_insert on public.claims;
create trigger prevent_self_claim_on_insert
  before insert on public.claims
  for each row execute procedure public.prevent_self_claim();

-- Claimants can see their own claims
drop policy if exists "claims_select_claimant" on public.claims;
create policy "claims_select_claimant"
  on public.claims for select
  using (auth.uid() = claimant_id);

-- Item owners can see claims on their items
drop policy if exists "claims_select_owner" on public.claims;
create policy "claims_select_owner"
  on public.claims for select
  using (
    exists (
      select 1 from public.items i
      where i.id = claims.item_id and i.user_id = auth.uid()
    )
  );

-- Admin reviews claim information.
drop policy if exists "claims_select_admin" on public.claims;
create policy "claims_select_admin"
  on public.claims for select
  using (public.is_admin());

drop policy if exists "claims_insert_claimant" on public.claims;
create policy "claims_insert_claimant"
  on public.claims for insert
  with check (auth.uid() = claimant_id);

-- Only the item owner can update claim status (approve/reject).
drop policy if exists "claims_update_owner" on public.claims;
create policy "claims_update_owner"
  on public.claims for update
  using (
    exists (
      select 1 from public.items i
      where i.id = claims.item_id and i.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.items i
      where i.id = claims.item_id and i.user_id = auth.uid()
    )
  );

-- A claimant may only cancel their own still-pending claim.
-- In RLS expressions column names refer to the row being written (new row).
drop policy if exists "claims_update_claimant_cancel" on public.claims;
create policy "claims_update_claimant_cancel"
  on public.claims for update
  using (auth.uid() = claimant_id and status = 'pending')
  with check (auth.uid() = claimant_id and status = 'cancelled');

-- Admin approves/rejects/cancels claims during moderation.
drop policy if exists "claims_update_admin" on public.claims;
create policy "claims_update_admin"
  on public.claims for update
  using (public.is_admin())
  with check (public.is_admin());

-- ============ NOTIFICATIONS ============
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  message text,
  type text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id);
create index if not exists notifications_read_idx on public.notifications (user_id, is_read);

alter table public.notifications enable row level security;

-- Clients never insert notifications directly; database triggers do it server-side.
drop policy if exists "notifications_insert_server" on public.notifications;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============ SERVER-SIDE NOTIFICATION TRIGGERS ============
-- On claim: notify the item owner.
create or replace function public.on_claim_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_title text; v_owner uuid; v_name text;
begin
  select title, user_id into v_title, v_owner from public.items where id = new.item_id;
  select coalesce(full_name, 'Someone') into v_name from public.profiles where id = new.claimant_id;
  insert into public.notifications (user_id, title, message, type)
  values (
    v_owner,
    'New claim on your item',
    v_name || ' claimed "' || v_title || '". Review it and verify ownership.',
    'claim'
  );
  return new;
end;
$$;

drop trigger if exists on_claim_insert on public.claims;
create trigger on_claim_insert
  after insert on public.claims
  for each row execute procedure public.on_claim_insert();

-- On claim status change: notify the claimant.
create or replace function public.on_claim_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.notifications (user_id, title, message, type)
    values (
      old.claimant_id,
      case new.status
        when 'approved' then 'Claim approved'
        when 'rejected' then 'Claim rejected'
        when 'cancelled' then 'Claim cancelled'
        else 'Claim updated'
      end,
      'The owner responded to your claim on "' ||
      coalesce((select title from public.items where id = old.item_id), 'this item') || '".',
      'claim'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_claim_update on public.claims;
create trigger on_claim_update
  after update on public.claims
  for each row execute procedure public.on_claim_update();

-- On item resolved: notify the approved claimant.
create or replace function public.on_item_resolved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_title text;
begin
  if new.status = 'resolved' and old.status is distinct from new.status then
    v_title := new.title;
    insert into public.notifications (user_id, title, message, type)
    select claimant_id, 'Item returned', 'You got "' || v_title || '" back. Keep it safe!', 'resolved'
    from public.claims
    where item_id = old.id and status = 'approved';
  end if;
  return new;
end;
$$;

drop trigger if exists on_item_resolved on public.items;
create trigger on_item_resolved
  after update on public.items
  for each row execute procedure public.on_item_resolved();

-- ============ HANDLE NEW USER PROFILE ============
drop trigger if exists on_auth_user_created on auth.users;
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    case
      when lower(trim(new.email)) = 'ankitdangi864@gmail.com' then 'admin'
      else 'student'
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============ SMART MATCHING ============
-- Explainable score (0-100): title similarity(0-50), category(+10),
-- location(+10), description keyword overlap(+4 each, max 20), date proximity(+10).
create or replace function public.match_item(p_item_id uuid)
returns table (
  matched_item_id uuid,
  title text,
  item_type text,
  location text,
  date_occurred date,
  score integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_target public.items%rowtype;
begin
  select * into v_target from public.items where id = p_item_id;
  if not found then
    return;
  end if;

  return query
  select
    i.id,
    i.title,
    i.type,
    i.location,
    i.date_occurred,
    (
      round(greatest(similarity(lower(v_target.title), lower(i.title)), 0)::numeric * 50)
      + case when i.category = v_target.category then 10 else 0 end
      + case when lower(coalesce(i.location, '')) = lower(coalesce(v_target.location, '')) then 10 else 0 end
      + least(
          (
            select count(*)::int from (
              select w from unnest(string_to_array(lower(v_target.description), E' ,.;:!?-')) w where length(w) > 2
              intersect
              select w from unnest(string_to_array(lower(i.description), E' ,.;:!?-')) w where length(w) > 2
            ) t
          ) * 4,
          20
        )
      + case when abs(v_target.date_occurred - i.date_occurred) <= 7 then 10 else 0 end
    )::int as score
  from public.items i
  where i.id <> p_item_id
    and i.type <> v_target.type
    and i.status = 'active'
  order by score desc
  limit 8;
end;
$$;

-- ============ STORAGE POLICY ============
drop policy if exists "item_images_public_read" on storage.objects;
create policy "item_images_public_read"
  on storage.objects for select
  using (bucket_id = 'item-images');

drop policy if exists "item_images_auth_insert" on storage.objects;
create policy "item_images_auth_insert"
  on storage.objects for insert
  with check (bucket_id = 'item-images' and auth.role() = 'authenticated');

select 'Schema applied successfully' as status;