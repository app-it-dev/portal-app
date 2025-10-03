# CarsGate Secure Supabase Schema (Updated)
> Production-ready SQL with strict RLS and purpose-scoped schemas (`public`, `portal`, `payments`, `security`).  
> This update introduces a **single checkout thread** via `payments.checkout_sessions` that links **OTP → Customer → Order → Transaction**.  
> OTP is **Edge-handled** (no hashing), stored in `security` with short TTL and admin/service-only access.  
> Payment/gateway artifacts live in `payments` and are **not** exposed to anon/auth.  
> Replace the two ADMIN UUIDs in the seed section.

```sql
-- =========================================================
-- CarsGate Supabase Secure Schema (RLS-first, production-ready) — UPDATED
-- =========================================================
-- Assumes: Supabase Postgres 15+, PostgREST
-- IMPORTANT: Update ADMIN UUIDs in the seed section below.
-- OTP flow: issued and verified by Edge Functions (service role). No hashing required per design.
-- This version adds:
--   - payments.checkout_sessions (single-thread id)
--   - security.otp_verify.session_id (FK -> checkout_sessions)
--   - customers UNIQUE(phone) for coherent identity
--   - orders.session_id + buyer_snapshot jsonb
--   - payments.transactions.session_id
--   - public.is_deposit_paid(order_id) RPC (SECURITY DEFINER)
-- =========================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ---------- Schemas ----------
create schema if not exists portal;
create schema if not exists payments;
create schema if not exists security;

-- ---------- Enums ----------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'merchant_status') then
    create type merchant_status as enum ('pending', 'active', 'suspended');
  end if;

  if not exists (select 1 from pg_type where typname = 'post_status') then
    create type post_status as enum ('Available', 'Reserved', 'Sold', 'Hidden');
  end if;

  if not exists (select 1 from pg_type where typname = 'mileage_unit') then
    create type mileage_unit as enum ('mi', 'km');
  end if;

  if not exists (select 1 from pg_type where typname = 'condition_type') then
    create type condition_type as enum ('New', 'Used', 'Certified');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum ('initiated','deposit_paid','in_progress','completed','cancelled','refunded');
  end if;
end$$;

-- ---------- Helper Functions ----------
create or replace function public.convert_and_round_mileage(mileage int, unit mileage_unit)
returns int
language sql
immutable
as $$
  select case
    when mileage is null then null
    when unit = 'km' then mileage
    else round(mileage * 1.60934)::int
  end
$$;

create or replace function public.is_admin() 
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where a.user_id = auth.uid()
      and a.is_active = true
  );
$$;

create or replace function public.is_merchant() 
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.merchants m
    where m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.current_merchant_id()
returns bigint
language sql
stable
as $$
  select m.merchant_id
  from public.merchants m
  where m.user_id = auth.uid()
  and m.status = 'active'
  limit 1
$$;

-- =========================================================
-- PUBLIC SCHEMA (domain data, RLS accessible to apps)
-- =========================================================

-- ---------- Admins ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin','admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists admins_self_read on public.admins;
create policy admins_self_read
  on public.admins
  for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists admins_write on public.admins;
create policy admins_write
  on public.admins
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Seed (replace with your IDs, then run once):
-- insert into public.admins(user_id, role, is_active) values
--   ('00000000-0000-0000-0000-000000000001','super_admin',true),
--   ('00000000-0000-0000-0000-000000000002','admin',true)
-- on conflict (user_id) do nothing;

-- ---------- Merchants ----------
create table if not exists public.merchants (
  merchant_id bigserial primary key,
  user_id uuid unique references auth.users(id) on delete set null,
  business_name text not null,
  business_type text,
  logo_url text,
  website_url text,
  email text not null unique,
  phone text not null unique,
  secondary_phone text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text,
  postal_code text not null,
  country text not null,
  business_hours jsonb not null default '{}'::jsonb,
  status merchant_status not null default 'pending',
  description text,
  social_media jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.merchants enable row level security;

create policy merchants_admin_all
  on public.merchants for all
  using (public.is_admin()) with check (public.is_admin());

create policy merchants_self_select
  on public.merchants for select
  using (user_id = auth.uid());

create policy merchants_self_update
  on public.merchants for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy merchants_self_insert
  on public.merchants for insert
  with check (auth.uid() is not null and user_id = auth.uid());

-- ---------- Customers (audience durable identity) ----------
create table if not exists public.customers (
  id bigserial primary key,
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  phone text not null,
  city text not null,
  created_at timestamptz not null default now(),
  constraint customers_phone_unique unique (phone)
);
create index if not exists customers_phone_idx on public.customers (phone);

alter table public.customers enable row level security;

create policy customers_admin_all
  on public.customers for all
  using (public.is_admin()) with check (public.is_admin());

create policy customers_self_select
  on public.customers for select
  using (user_id = auth.uid());

create policy customers_self_update
  on public.customers for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy customers_self_insert
  on public.customers for insert
  with check (auth.uid() is not null and (user_id is null or user_id = auth.uid()));

-- ---------- Posts ----------
create table if not exists public.posts (
  post_id bigserial primary key,
  merchant_id bigint references public.merchants(merchant_id) on delete set null,
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  verified boolean not null default false,
  status post_status not null default 'Available',
  vin text,
  make text not null,
  model text not null,
  year int not null check (year between 1950 and extract(year from now())::int + 1),
  engine text,
  fuel text,
  drivetrain text,
  mileage int,
  mileage_unit mileage_unit not null default 'mi',
  country text not null,
  state text,
  city text,
  condition condition_type not null,
  price bigint not null check (price >= 0),
  exterior_color text,
  interior_color text,
  main_image text,
  images jsonb,
  specs jsonb not null default '{}'::jsonb,
  exterior_features jsonb,
  interior_features jsonb,
  safety_tech jsonb,
  car_history jsonb,
  translations jsonb not null default '{}'::jsonb,
  post_source text not null default 'website',
  source_url text,
  featured_posts boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_status_verified_idx on public.posts (status, verified);
create index if not exists posts_merchant_idx on public.posts (merchant_id);
alter table public.posts enable row level security;

create policy posts_admin_all
  on public.posts for all
  using (public.is_admin()) with check (public.is_admin());

create policy posts_merchant_select
  on public.posts for select
  using (merchant_id = public.current_merchant_id());

create policy posts_merchant_insert
  on public.posts for insert
  with check (
    public.is_merchant()
    and merchant_id = public.current_merchant_id()
    and (user_id = auth.uid() or user_id is null)
  );

create policy posts_merchant_update
  on public.posts for update
  using (merchant_id = public.current_merchant_id())
  with check (merchant_id = public.current_merchant_id());

create policy posts_merchant_delete
  on public.posts for delete
  using (merchant_id = public.current_merchant_id());

create policy posts_public_read_rows
  on public.posts for select to anon, authenticated
  using (verified = true and status = 'Available');

-- ---------- Post Views ----------
create table if not exists public.post_views (
  id bigserial primary key,
  post_id bigint not null references public.posts(post_id) on delete cascade,
  viewed_at timestamptz not null default now()
);
create index if not exists post_views_post_idx on public.post_views (post_id);

alter table public.post_views enable row level security;

create policy post_views_insert_any
  on public.post_views for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.posts p
      where p.post_id = public.post_views.post_id
        and p.verified = true
        and p.status = 'Available'
    )
  );

create policy post_views_admin_select
  on public.post_views for select
  using (public.is_admin());

create policy post_views_merchant_select
  on public.post_views for select
  using (
    exists (
      select 1 from public.posts p
      where p.post_id = public.post_views.post_id
        and p.merchant_id = public.current_merchant_id()
    )
  );

-- ---------- Orders (now tied to checkout_sessions) ----------
create table if not exists public.orders (
  id bigserial primary key,
  post_id bigint not null references public.posts(post_id) on delete restrict,
  status order_status not null default 'initiated',
  deposit_amount numeric,
  final_payment_method text,
  final_payment_received_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  customer_id bigint references public.customers(id) on delete set null,
  session_id uuid null,  -- FK added later after payments.checkout_sessions exists
  buyer_snapshot jsonb not null default '{}'::jsonb
);

create index if not exists orders_post_idx on public.orders (post_id);
create index if not exists orders_customer_idx on public.orders (customer_id);
alter table public.orders enable row level security;

create policy orders_admin_all
  on public.orders for all
  using (public.is_admin()) with check (public.is_admin());

create policy orders_customer_select
  on public.orders for select
  using (
    customer_id is not null and exists (
      select 1 from public.customers c
      where c.id = public.orders.customer_id
        and c.user_id = auth.uid()
    )
  );

create policy orders_customer_update
  on public.orders for update
  using (
    customer_id is not null and exists (
      select 1 from public.customers c
      where c.id = public.orders.customer_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    customer_id is not null and exists (
      select 1 from public.customers c
      where c.id = public.orders.customer_id
        and c.user_id = auth.uid()
    )
  );

create policy orders_merchant_select
  on public.orders for select
  using (
    exists (
      select 1 from public.posts p
      where p.post_id = public.orders.post_id
        and p.merchant_id = public.current_merchant_id()
    )
  );

create policy orders_merchant_insert
  on public.orders for insert
  with check (
    public.is_admin()
    or exists (
      select 1 from public.posts p
      where p.post_id = public.orders.post_id
        and p.merchant_id = public.current_merchant_id()
    )
  );

-- =========================================================
-- PAYMENTS SCHEMA (Edge-only; no anon/auth grants)
-- =========================================================

-- ---------- Checkout Sessions (single-thread id) ----------
create table if not exists payments.checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  post_id bigint not null references public.posts(post_id) on delete restrict,
  amount numeric not null default 500,
  currency text not null default 'SAR',
  buyer_name text not null,
  buyer_city text not null,
  buyer_phone text not null,
  otp_id uuid null,            -- set after OTP row created
  customer_id bigint null references public.customers(id) on delete set null,
  order_id bigint null references public.orders(id) on delete set null,
  provider text not null,      -- 'Moyasar'/'Tap'/etc.
  psp_payment_id text,
  idempotency_key text unique,
  status text not null default 'initiated', -- initiated->otp_sent->otp_verified->payment_created->captured/failed
  return_url text,
  cancel_url text,
  user_id uuid null,
  user_agent text,
  ip_inet inet,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);
alter table payments.checkout_sessions enable row level security;

create policy checkout_sessions_admin_all on payments.checkout_sessions
  for all using (public.is_admin()) with check (public.is_admin());

-- Wire up orders.session_id FK now that table exists
alter table public.orders
  add constraint orders_session_fk
  foreign key (session_id) references payments.checkout_sessions(id) on delete set null;

-- ---------- Transactions (tie to session) ----------
create table if not exists payments.transactions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references payments.checkout_sessions(id) on delete cascade,
  order_id bigint not null references public.orders(id) on delete cascade,
  post_id bigint not null references public.posts(post_id) on delete cascade,
  customer_id bigint references public.customers(id) on delete set null,
  provider text not null,
  payment_id text,
  status text not null,  -- 'initiated','authorized','captured','failed','refunded'
  amount numeric not null,
  currency text not null default 'SAR',
  idempotency_key text unique,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table payments.transactions enable row level security;
create policy payments_admin_all on payments.transactions
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Webhook events & refunds ----------
create table if not exists payments.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  event_id text,
  payload jsonb not null,
  signature text,
  received_at timestamptz not null default now(),
  processed boolean not null default false,
  processed_at timestamptz,
  error text
);
alter table payments.webhook_events enable row level security;
create policy payments_admin_all_webhook on payments.webhook_events
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists payments.refunds (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references payments.transactions(id) on delete cascade,
  amount numeric not null,
  reason text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
alter table payments.refunds enable row level security;
create policy payments_admin_all_refunds on payments.refunds
  for all using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- SECURITY SCHEMA (OTP, Edge-only)
-- =========================================================

create table if not exists security.otp_verify (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references payments.checkout_sessions(id) on delete cascade,
  phone text not null,
  otp_code text not null,
  expires_at timestamptz not null,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  city text,
  name text,
  attempts int not null default 0,
  last_attempt_at timestamptz
);
create index if not exists otp_verify_phone_idx on security.otp_verify(phone);
create index if not exists otp_verify_expires_idx on security.otp_verify(expires_at);

-- Optional dev table (admin-only)
create table if not exists security.otp_debug (
  id bigserial primary key,
  phone text not null,
  otp text not null,
  created_at timestamptz not null default now()
);

alter table security.otp_verify enable row level security;
alter table security.otp_debug  enable row level security;

create policy otp_verify_admin_all on security.otp_verify
  for all using (public.is_admin()) with check (public.is_admin());
create policy otp_debug_admin_all on security.otp_debug
  for all using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- PORTAL SCHEMA (internal ops/ingestion)
-- =========================================================
create table if not exists portal.portal_import_posts (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.admins(user_id) on delete cascade,
  url text not null,
  source text,
  note text,
  status text not null default 'pending' check (status in ('pending','analyzing','analyzed','rejected','completed')),
  raw_content text,
  raw_analysis jsonb,
  title text,
  description text,
  price numeric,
  currency text default 'USD',
  year int,
  make text,
  model text,
  trim text,
  body_type text,
  fuel_type text,
  transmission text,
  engine text,
  mileage int,
  color text,
  condition text,
  features jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  main_image_url text,
  car_price numeric,
  shipping_cost numeric not null default 0,
  broker_fee numeric not null default 0,
  platform_fee numeric not null default 0,
  customs_fee numeric not null default 0,
  vat_amount numeric not null default 0,
  total_cost numeric not null default 0,
  workflow_step text default 'raw' check (workflow_step in ('raw','details','images','pricing','complete')),
  step_completed jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_analyzed_at timestamptz,
  completed_at timestamptz
);
alter table portal.portal_import_posts enable row level security;
create policy portal_import_admin_all
  on portal.portal_import_posts for all
  using (public.is_admin()) with check (public.is_admin());

create or replace view portal.admin_dashboard as
select
  a.user_id,
  a.role,
  a.is_active,
  a.created_at as admin_since,
  count(pip.id) as total_posts,
  count(*) filter (where pip.status = 'pending')   as pending_posts,
  count(*) filter (where pip.status = 'rejected')  as rejected_posts,
  count(*) filter (where pip.status = 'completed') as completed_posts
from public.admins a
left join portal.portal_import_posts pip
  on pip.admin_user_id = a.user_id
where a.is_active = true
group by a.user_id, a.role, a.is_active, a.created_at;

-- =========================================================
-- PUBLIC/APP & DASH VIEWS (audience-safe)
-- =========================================================
create or replace view public.post_app as
select
  p.post_id,
  p.make,
  p.model,
  p.year,
  p.condition,
  p.price,
  public.convert_and_round_mileage(p.mileage, p.mileage_unit) as mileage_km,
  p.exterior_color,
  p.interior_color,
  p.main_image,
  p.images,
  p.engine,
  p.fuel,
  p.drivetrain,
  p.exterior_features,
  p.interior_features,
  p.safety_tech,
  p.car_history,
  p.status,
  p.country,
  p.translations
from public.posts p
where p.status = 'Available' and p.verified = true;

create or replace view public.posts_app as
select
  p.post_id,
  p.make,
  p.model,
  p.year,
  p.condition,
  p.price,
  public.convert_and_round_mileage(p.mileage, p.mileage_unit) as mileage_km,
  p.main_image,
  p.featured_posts,
  jsonb_build_object(
    'ar',
    jsonb_build_object(
      'make',  p.translations->>'make_ar',
      'model', p.translations->>'model_ar'
    )
  ) as translations
from public.posts p
where p.status = 'Available' and p.verified = true;

create or replace view public.posts_page as
select
  p.post_id,
  p.make,
  p.model,
  p.year,
  p.condition,
  p.price,
  public.convert_and_round_mileage(p.mileage, p.mileage_unit) as mileage_km,
  p.main_image,
  jsonb_build_object(
    'ar',
    jsonb_build_object(
      'make',  p.translations->>'make_ar',
      'model', p.translations->>'model_ar'
    )
  ) as translations
from public.posts p
where p.status = 'Available' and p.verified = true
  and (p.post_id = any (array[24262, 24463, 94083]::bigint[]));

create or replace view public.posts_dash as
select
  p.post_id,
  p.user_id,
  p.merchant_id,
  p.make,
  p.model,
  p.year,
  p.status,
  p.main_image
from public.posts p;

create or replace view public.post_dash as
select
  p.post_id,
  p.merchant_id,
  p.user_id,
  p.make,
  p.model,
  p.year,
  p.vin,
  p.condition,
  p.mileage,
  p.mileage_unit,
  p.exterior_color,
  p.interior_color,
  p.created_at,
  p.country,
  p.state,
  p.city,
  p.price,
  p.status
from public.posts p;

-- =========================================================
-- PRIVILEGES & GRANTS
-- =========================================================
-- Revoke broad defaults
revoke all on all tables in schema public  from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

revoke all on all tables in schema portal   from anon, authenticated;
revoke all on all tables in schema payments from anon, authenticated;
revoke all on all tables in schema security from anon, authenticated;

-- Views allowed for audience
grant select on public.post_app   to anon, authenticated;
grant select on public.posts_app  to anon, authenticated;
grant select on public.posts_page to anon, authenticated;

-- Brokers (authenticated) need posts_dash
grant select on public.posts_dash to authenticated;

-- Portal dashboard view
grant select on portal.admin_dashboard to authenticated, anon;

-- Column-level grants on posts (public-safe subset)
grant select (post_id, make, model, year, condition, price, mileage, mileage_unit,
              exterior_color, interior_color, main_image, images, specs, exterior_features,
              interior_features, safety_tech, car_history, status, country, translations,
              engine, fuel, drivetrain, created_at, updated_at, featured_posts)
on public.posts to anon, authenticated;

-- Merchants broader read on posts (their rows via RLS)
grant select (post_id, merchant_id, user_id, make, model, year, vin, condition, mileage,
              mileage_unit, exterior_color, interior_color, created_at, country, state, city,
              price, status, main_image)
on public.posts to authenticated;

-- Post views
grant insert on public.post_views to anon, authenticated;
grant select on public.post_views to authenticated;

-- Merchants manage posts & their merchant row
grant insert, update, delete on public.posts      to authenticated;
grant select, insert, update  on public.merchants to authenticated;

-- Customers & orders/quotes (RLS restricts rows)
grant select, insert, update on public.customers to authenticated;
grant select, insert, update on public.orders    to authenticated;
grant select               on public.quotes     to authenticated;

-- Admins table access (RLS enforces visibility)
grant select, insert, update, delete on public.admins to authenticated;

-- Portal imports (admins only via RLS)
grant select, insert, update, delete on portal.portal_import_posts to authenticated;

-- SECURITY & PAYMENTS: **no grants** to anon/auth. service_role bypasses RLS.

-- =========================================================
-- FINAL SAFETY: Ensure RLS is ON everywhere
-- =========================================================
do $$
declare r record;
begin
  for r in
    select table_schema, table_name
    from information_schema.tables
    where table_schema in ('public','portal','payments','security') and table_type='BASE TABLE'
  loop
    execute format('alter table %I.%I enable row level security', r.table_schema, r.table_name);
  end loop;
end$$;

-- =========================================================
-- RPCs (SECURITY DEFINER) minimal exposure
-- =========================================================
create or replace function public.is_deposit_paid(p_order_id bigint)
returns boolean
language sql
security definer
set search_path = public, payments
as $$
  select exists(
    select 1
    from payments.transactions t
    join public.orders o on o.id = t.order_id
    where o.id = p_order_id
      and t.status in ('authorized','captured')
  );
$$;
grant execute on function public.is_deposit_paid(bigint) to authenticated, anon;

-- =========================================================
-- END
-- =========================================================
```
