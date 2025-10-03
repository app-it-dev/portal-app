create schema if not exists portal;
create schema if not exists payments;
create schema if not exists security;


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

-- This helper does NOT reference any tables
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


-- Admins
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin','admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed your admin (safe to re-run)
insert into public.admins (user_id, role, is_active)
values ('5e653dc7-83a3-4b92-9eee-ec17263f3fea', 'super_admin', true)
on conflict (user_id) do nothing;

-- Merchants
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

-- Customers
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

-- Posts
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

-- Post views
create table if not exists public.post_views (
  id bigserial primary key,
  post_id bigint not null references public.posts(post_id) on delete cascade,
  viewed_at timestamptz not null default now()
);
create index if not exists post_views_post_idx on public.post_views (post_id);

-- Orders
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
  session_id uuid null,                          -- will FK later to payments.checkout_sessions
  buyer_snapshot jsonb not null default '{}'::jsonb
);
create index if not exists orders_post_idx on public.orders (post_id);
create index if not exists orders_customer_idx on public.orders (customer_id);

-- Quotes
create table if not exists public.quotes (
  id bigserial primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  total_amount numeric not null,
  currency text not null default 'SAR',
  valid_until date,
  is_accepted boolean not null default false,
  accepted_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  customer_id bigint not null references public.customers(id) on delete cascade
);


-- These depend on tables created in Step 2
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


-- Enable RLS (idempotent)
alter table public.admins     enable row level security;
alter table public.merchants  enable row level security;
alter table public.customers  enable row level security;
alter table public.posts      enable row level security;
alter table public.post_views enable row level security;
alter table public.orders     enable row level security;
alter table public.quotes     enable row level security;

-- ===== admins =====
drop policy if exists admins_self_read on public.admins;
create policy admins_self_read
  on public.admins for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists admins_write on public.admins;
create policy admins_write
  on public.admins for all
  using (public.is_admin())
  with check (public.is_admin());

-- ===== merchants =====
drop policy if exists merchants_admin_all on public.merchants;
create policy merchants_admin_all
  on public.merchants for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists merchants_self_select on public.merchants;
create policy merchants_self_select
  on public.merchants for select
  using (user_id = auth.uid());

drop policy if exists merchants_self_update on public.merchants;
create policy merchants_self_update
  on public.merchants for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists merchants_self_insert on public.merchants;
create policy merchants_self_insert
  on public.merchants for insert
  with check (auth.uid() is not null and user_id = auth.uid());

-- ===== customers =====
drop policy if exists customers_admin_all on public.customers;
create policy customers_admin_all
  on public.customers for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists customers_self_select on public.customers;
create policy customers_self_select
  on public.customers for select
  using (user_id = auth.uid());

drop policy if exists customers_self_update on public.customers;
create policy customers_self_update
  on public.customers for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists customers_self_insert on public.customers;
create policy customers_self_insert
  on public.customers for insert
  with check (auth.uid() is not null and (user_id is null or user_id = auth.uid()));

-- ===== posts =====
drop policy if exists posts_admin_all on public.posts;
create policy posts_admin_all
  on public.posts for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists posts_merchant_select on public.posts;
create policy posts_merchant_select
  on public.posts for select
  using (merchant_id = public.current_merchant_id());

drop policy if exists posts_merchant_insert on public.posts;
create policy posts_merchant_insert
  on public.posts for insert
  with check (
    public.is_merchant()
    and merchant_id = public.current_merchant_id()
    and (user_id = auth.uid() or user_id is null)
  );

drop policy if exists posts_merchant_update on public.posts;
create policy posts_merchant_update
  on public.posts for update
  using (merchant_id = public.current_merchant_id())
  with check (merchant_id = public.current_merchant_id());

drop policy if exists posts_merchant_delete on public.posts;
create policy posts_merchant_delete
  on public.posts for delete
  using (merchant_id = public.current_merchant_id());

drop policy if exists posts_public_read_rows on public.posts;
create policy posts_public_read_rows
  on public.posts for select to anon, authenticated
  using (verified = true and status = 'Available');

-- ===== post_views =====
drop policy if exists post_views_insert_any on public.post_views;
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

drop policy if exists post_views_admin_select on public.post_views;
create policy post_views_admin_select
  on public.post_views for select
  using (public.is_admin());

drop policy if exists post_views_merchant_select on public.post_views;
create policy post_views_merchant_select
  on public.post_views for select
  using (
    exists (
      select 1 from public.posts p
      where p.post_id = public.post_views.post_id
        and p.merchant_id = public.current_merchant_id()
    )
  );

-- ===== orders =====
drop policy if exists orders_admin_all on public.orders;
create policy orders_admin_all
  on public.orders for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists orders_customer_select on public.orders;
create policy orders_customer_select
  on public.orders for select
  using (
    customer_id is not null and exists (
      select 1 from public.customers c
      where c.id = public.orders.customer_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists orders_customer_update on public.orders;
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

drop policy if exists orders_merchant_select on public.orders;
create policy orders_merchant_select
  on public.orders for select
  using (
    exists (
      select 1 from public.posts p
      where p.post_id = public.orders.post_id
        and p.merchant_id = public.current_merchant_id()
    )
  );

drop policy if exists orders_merchant_insert on public.orders;
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

-- ===== quotes =====
drop policy if exists quotes_admin_all on public.quotes;
create policy quotes_admin_all
  on public.quotes for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists quotes_customer_select on public.quotes;
create policy quotes_customer_select
  on public.quotes for select
  using (
    exists (
      select 1 from public.customers c
      where c.id = public.quotes.customer_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists quotes_merchant_select on public.quotes;
create policy quotes_merchant_select
  on public.quotes for select
  using (
    exists (
      select 1
      from public.orders o
      join public.posts p on p.post_id = o.post_id
      where o.id = public.quotes.order_id
        and p.merchant_id = public.current_merchant_id()
    )
  );


-- payments.checkout_sessions
create table if not exists payments.checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  post_id bigint not null references public.posts(post_id) on delete restrict,
  amount numeric not null default 500,
  currency text not null default 'SAR',
  buyer_name text not null,
  buyer_city text not null,
  buyer_phone text not null,
  otp_id uuid null,
  customer_id bigint null references public.customers(id) on delete set null,
  order_id bigint null references public.orders(id) on delete set null,
  provider text not null,
  psp_payment_id text,
  idempotency_key text unique,
  status text not null default 'initiated',
  return_url text,
  cancel_url text,
  user_id uuid null,
  user_agent text,
  ip_inet inet,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- Recreate the FK idempotently (drop-then-add)
alter table public.orders
  drop constraint if exists orders_session_fk;

alter table public.orders
  add constraint orders_session_fk
  foreign key (session_id)
  references payments.checkout_sessions(id)
  on delete set null;

-- payments.transactions
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

-- payments.webhook_events
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

-- payments.refunds
create table if not exists payments.refunds (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references payments.transactions(id) on delete cascade,
  amount numeric not null,
  reason text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

-- Enable RLS + policies (payments)
alter table payments.checkout_sessions enable row level security;
alter table payments.transactions    enable row level security;
alter table payments.webhook_events  enable row level security;
alter table payments.refunds         enable row level security;

-- Replace these with drop-then-create (Postgres has no CREATE OR REPLACE POLICY)

-- checkout_sessions
drop policy if exists checkout_sessions_admin_all on payments.checkout_sessions;
create policy checkout_sessions_admin_all
  on payments.checkout_sessions
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- transactions
drop policy if exists payments_admin_all on payments.transactions;
create policy payments_admin_all
  on payments.transactions
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- webhook_events
drop policy if exists payments_admin_all_webhook on payments.webhook_events;
create policy payments_admin_all_webhook
  on payments.webhook_events
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- refunds
drop policy if exists payments_admin_all_refunds on payments.refunds;
create policy payments_admin_all_refunds
  on payments.refunds
  for all
  using (public.is_admin())
  with check (public.is_admin());


-- OTP table (edge-only)
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
create index if not exists otp_verify_phone_idx   on security.otp_verify(phone);
create index if not exists otp_verify_expires_idx on security.otp_verify(expires_at);

-- Optional dev table
create table if not exists security.otp_debug (
  id bigserial primary key,
  phone text not null,
  otp text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table security.otp_verify enable row level security;
alter table security.otp_debug  enable row level security;

-- Policies (drop-then-create)
drop policy if exists otp_verify_admin_all on security.otp_verify;
create policy otp_verify_admin_all
  on security.otp_verify
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists otp_debug_admin_all on security.otp_debug;
create policy otp_debug_admin_all
  on security.otp_debug
  for all
  using (public.is_admin())
  with check (public.is_admin());


-- Internal ingestion table
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

-- Enable RLS
alter table portal.portal_import_posts enable row level security;

-- Policy (drop-then-create)
drop policy if exists portal_import_admin_all on portal.portal_import_posts;
create policy portal_import_admin_all
  on portal.portal_import_posts
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Admin dashboard view
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
  and (p.post_id = any (array[1, 6]::bigint[]));

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


-- Revoke broad defaults
revoke all on all tables    in schema public  from anon, authenticated;
revoke all on all sequences in schema public  from anon, authenticated;
revoke all on all functions in schema public  from anon, authenticated;

revoke all on all tables in schema portal   from anon, authenticated;
revoke all on all tables in schema payments from anon, authenticated;
revoke all on all tables in schema security from anon, authenticated;

-- Public views for audience/broker
grant select on public.post_app   to anon, authenticated;
grant select on public.posts_app  to anon, authenticated;
grant select on public.posts_page to anon, authenticated;

-- Brokers
grant select on public.posts_dash to authenticated;

-- Portal dashboard
grant select on portal.admin_dashboard to authenticated, anon;

-- Column-level grants on posts for public reads
grant select (post_id, make, model, year, condition, price, mileage, mileage_unit,
              exterior_color, interior_color, main_image, images, specs, exterior_features,
              interior_features, safety_tech, car_history, status, country, translations,
              engine, fuel, drivetrain, created_at, updated_at, featured_posts)
on public.posts to anon, authenticated;

-- Merchants broader read (RLS still filters rows)
grant select (post_id, merchant_id, user_id, make, model, year, vin, condition, mileage,
              mileage_unit, exterior_color, interior_color, created_at, country, state, city,
              price, status, main_image)
on public.posts to authenticated;

-- Post views
grant insert on public.post_views to anon, authenticated;
grant select on public.post_views to authenticated;

-- Merchants manage their content
grant insert, update, delete on public.posts      to authenticated;
grant select, insert, update  on public.merchants to authenticated;

-- Customers & orders/quotes (RLS restricts rows)
grant select, insert, update on public.customers to authenticated;
grant select, insert, update on public.orders    to authenticated;
grant select               on public.quotes     to authenticated;

-- Admins table (RLS applies)
grant select, insert, update, delete on public.admins to authenticated;

-- Portal imports (admins-only via RLS)
grant select, insert, update, delete on portal.portal_import_posts to authenticated;


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


-- helpers used in views
grant execute on function public.convert_and_round_mileage(integer, mileage_unit) to anon, authenticated;

-- helpers referenced by policies
grant execute on function public.is_admin()          to anon, authenticated;
grant execute on function public.is_merchant()       to authenticated;
grant execute on function public.current_merchant_id() to authenticated;

-- you already granted this one earlier (ok to re-run)
grant execute on function public.is_deposit_paid(bigint) to anon, authenticated;


create index if not exists posts_status_verified_idx2 on public.posts (verified, status);
create index if not exists tx_payment_id_idx          on payments.transactions (payment_id);
create index if not exists tx_session_status_idx      on payments.transactions (session_id, status);
create index if not exists cs_idem_idx                on payments.checkout_sessions (idempotency_key);


-- one function, many tables
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end$$;

drop trigger if exists trg_posts_touch on public.posts;
create trigger trg_posts_touch
before update on public.posts
for each row execute function public.touch_updated_at();

drop trigger if exists trg_merchants_touch on public.merchants;
create trigger trg_merchants_touch
before update on public.merchants
for each row execute function public.touch_updated_at();

drop trigger if exists trg_orders_touch on public.orders;
create trigger trg_orders_touch
before update on public.orders
for each row execute function public.touch_updated_at();

drop trigger if exists trg_portal_import_touch on portal.portal_import_posts;
create trigger trg_portal_import_touch
before update on portal.portal_import_posts
for each row execute function public.touch_updated_at();


-- 1) Friendly generator: 5 digits from 2..9, with at least one double,
--    no triples, and no ascending/descending runs of length >= 4
create or replace function public.gen_post_public_code_friendly()
returns int
language plpgsql
as $$
declare
  v_code text;
  v_int  int;
  digits text[] := array['2','3','4','5','6','7','8','9'];
  d text;
  prev text;
  has_pair boolean;
  i int;
  run_up int;
  run_down int;
  vals int[];
begin
  loop
    v_code := '';
    prev := null;
    has_pair := false;
    vals := '{}';

    -- build 5 digits
    for i in 1..5 loop
      d := digits[1 + floor(random()*8)::int];
      v_code := v_code || d;

      if prev is not null and d = prev then
        has_pair := true;    -- we want at least one adjacent pair
      end if;
      prev := d;

      vals := vals || (d::int);
    end loop;

    -- reject triples like 777
    if v_code ~ '(.)\1\1' then
      continue;
    end if;

    -- reject long monotonic runs (e.g., 2345 or 9876)
    run_up := 1;
    run_down := 1;
    for i in 2..array_length(vals,1) loop
      if vals[i] = vals[i-1] + 1 then
        run_up := run_up + 1;
      else
        run_up := 1;
      end if;

      if vals[i] = vals[i-1] - 1 then
        run_down := run_down + 1;
      else
        run_down := 1;
      end if;

      if run_up >= 4 or run_down >= 4 then
        -- too sequential
        run_up := 1; run_down := 1;
        v_code := null; -- force retry
        exit;
      end if;
    end loop;

    if v_code is null then
      continue;
    end if;

    -- must have at least one pair
    if not has_pair then
      continue;
    end if;

    v_int := v_code::int;

    -- ensure uniqueness vs existing rows
    exit when not exists (select 1 from public.posts where public_code = v_int);
  end loop;

  return v_int;
end
$$;

-- 2) Ensure column + constraint + unique index exist
alter table public.posts
  add column if not exists public_code int;

do $$
declare conname text;
begin
  for conname in
    select con.conname
    from pg_constraint con
    join pg_class cls on cls.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'posts'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%public_code%'
  loop
    execute format('alter table public.posts drop constraint %I', conname);
  end loop;
end$$;

alter table public.posts
  add constraint posts_public_code_5d_chk
  check (public_code is null or public_code between 10000 and 99999);

create unique index if not exists posts_public_code_uidx
  on public.posts(public_code);

-- 3) BEFORE INSERT trigger to auto-fill friendly codes
create or replace function public.fill_post_public_code_friendly()
returns trigger
language plpgsql
as $$
begin
  if new.public_code is null then
    new.public_code := public.gen_post_public_code_friendly();
  end if;
  return new;
end$$;

drop trigger if exists trg_posts_fill_public_code on public.posts;
create trigger trg_posts_fill_public_code
before insert on public.posts
for each row
execute function public.fill_post_public_code_friendly();

-- 4) Backfill any existing posts missing a code or with out-of-range code
update public.posts
set public_code = public.gen_post_public_code_friendly()
where public_code is null or public_code < 10000 or public_code > 99999;
