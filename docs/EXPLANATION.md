
# CarsGate Schema Migration & Security Guide

This document explains **what changed**, **why it changed**, and **how to integrate** your apps (portal, broker, audience) with the new secure schema. Use it with `old.sql` (legacy reference) and `new_sql.md` (production schema).

---

## 1) Big-Picture Overview

- We adopted a **purpose-scoped schema layout**:
  - **public** → domain tables (posts, merchants, customers, orders, quotes, post_views) with **strict RLS**.
  - **portal** → internal ops (portal_import_posts, admin dashboard view).
  - **payments** → **Edge-only** checkout sessions, transactions, refunds, webhooks.
  - **security** → **Edge-only** OTP tables (and optional debug).

- A single **checkout thread** now anchors the flow:
  `payments.checkout_sessions (id)` → `security.otp_verify` → `public.customers` (upsert) →
  `public.orders` (snapshot) → `payments.transactions` (+ webhooks).

- Audience apps keep using **public views** (safe columns only). Merchants use **RLS** to only access their own data. **Admins** get broad access via the `public.admins` membership table—no service role in browser.

---

## 2) What Changed (Short List)

- **One OTP table**: moved to `security.otp_verify` and linked to a **checkout session** (`session_id`).  
- **Customers**: durable identity with `UNIQUE(phone)`.  
- **Orders**: added `session_id` and `buyer_snapshot` JSON to freeze name/city/phone as of checkout.  
- **Payments**: split from `gateway` into `payments.checkout_sessions` + `payments.transactions` + `payments.webhook_events` + `payments.refunds`.  
- **RLS everywhere**: admins via `public.admins`, merchants via `current_merchant_id()`, audience via views + column grants.  
- **Public views** (`posts_app`, `post_app`, `posts_page`) expose only safe columns—no VIN.

---

## 3) End-to-End Reservation & Payment Flow

1. **Create checkout session (Edge Function)**
   - Input: `{ post_id, buyer_name, buyer_city, buyer_phone }` 
   - Create `payments.checkout_sessions` (status=`initiated`) with `idempotency_key` and PSP provider.
   - Create `security.otp_verify` with `session_id`. Update session `status='otp_sent'`.

2. **Verify OTP (Edge Function)**
   - Validate `{ phone, otp_code, session_id }` and expiry.
   - On success: mark `otp_verify.is_verified=true`, `checkout_sessions.status='otp_verified'`.
   - **Upsert customer** by `phone` → get `customer_id`.
   - **Create order** with `session_id`, `customer_id`, `post_id`, and `buyer_snapshot`.

3. **Create PSP Payment (Edge Function)**
   - Call PSP with `amount=500 SAR` and return/cancel URLs.
   - Insert `payments.transactions` (`status='initiated'`, link `session_id` + `order_id`).
   - Save `psp_payment_id` on session. Set `status='payment_created'`. Redirect to PSP webview.

4. **Webhook (Edge Function)**
   - Verify signature. Lookup `transactions` by PSP `payment_id` → resolve `session_id`, `order_id`, `customer_id`, `post_id`.
   - Update `transactions.status` & timestamps.
   - If paid: set `orders.status='deposit_paid'`, `orders.deposit_amount=amount`, `checkout_sessions.status='captured'`.

---

## 4) Auth & Portal Integration

### Admin Model
- Insert your two user UUIDs into `public.admins`. RLS then recognizes you as admin everywhere.
- Toggle access with `is_active`.

### Next.js Portal
- **Middleware** gate `/portal/*` routes:
  - If no session → redirect to `/login`.
  - If not found in `public.admins` → rewrite to `/403`.
- Use **Server Components/Route Handlers** with the user JWT (via `@supabase/auth-helpers-nextjs`)—**do not** use service role on the client.
- Example checks:
  - Admin dashboard → `select * from portal.admin_dashboard`.
  - Posts overview → `select * from post_dash order by created_at desc limit 50`.
  - Orders + payment flag → `select * from orders` + `rpc('is_deposit_paid')` per order.

### Broker & Audience
- **Audience** apps query `public.posts_app` / `public.post_app` / `public.posts_page` (no auth required or session from anon key).
- **Broker** app uses authenticated client; RLS restricts to **their own** posts/orders by merchant mapping (`current_merchant_id()`).

---

## 5) Security Implementation Details

- **RLS Everywhere**: All base tables enable RLS with minimal, explicit policies.
- **Admins**: `public.is_admin()` checks membership in `public.admins` (simple, auditable).
- **Merchants**: constrained by `public.current_merchant_id()`; CRUD only on their own rows.
- **Audience**: read-only via views + column grants; **VIN** and other sensitive fields are excluded.
- **payments & security**: **no grants** to `anon` or `authenticated` roles; only **service role** (Edge Functions) or admins can access.
- **RPCs**: prefer read-only SECURITY DEFINER RPCs (e.g., `public.is_deposit_paid`) when you need payment facts in apps without exposing `payments.*`.

**Secrets & Keys**
- Never ship the service role key to the browser.
- Store PSP API keys in Edge Function secrets. Verify **webhook signatures** and **idempotency** for create-payment handlers.

---

## 6) Mapping (Old → New) — Short Reference

- `public.gateway` → `payments.transactions` + `payments.webhook_events` + `payments.refunds`
- `public.otp_verify` → `security.otp_verify` (+ `session_id` FK)
- `public.customers` → `public.customers` (+ `user_id`, `UNIQUE(phone)`)
- `public.orders` → `public.orders` (+ `session_id` FK, `buyer_snapshot` jsonb)
- `public.posts` → `public.posts` (same domain; stronger constraints/RLS)
- `portal.portal_admin` → `public.admins` (simplified); dashboard view remains in `portal`

---

## 7) Migration Playbook (High-Level)

1. **Deploy new schemas** from `new_sql.md` (leave old production running).
2. **Backfill data**:
   - Copy `public.otp_verify` → `security.otp_verify` if needed (optional if you start fresh).
   - Build `payments.checkout_sessions` only for **new** checkouts.
3. **Enable portal admins**: insert your two user IDs into `public.admins`.
4. **Switch apps**:
   - Audience: keep existing queries (views unchanged).
   - Broker: check CRUD paths still work under RLS.
   - Portal: add middleware + server-side Supabase client.
5. **Webhooks/Edge**: add handlers later; schema is ready.
6. **Decommission** legacy `gateway` usage after transactions live.

---

## 8) Testing Checklist

- Anonymous user can read `posts_app`, not raw `posts` columns like `vin`.
- Merchant A cannot see Merchant B’s posts/orders.
- Admin can read/write everything via user JWT (no service role).
- OTP: `security.otp_verify` rows only visible to admins/service role.
- Payment webhook sets `transactions.status='captured'` and order becomes `deposit_paid`.
- `rpc('is_deposit_paid', { p_order_id })` returns correct boolean.

---

## 9) Failure & Recovery Notes

- **Duplicate payments**: enforce `idempotency_key` unique; PSP retries become safe.
- **Webhook reorder**: process by status transitions; keep events idempotent.
- **OTP reuse**: tie to `session_id`; mark consumed with `is_verified=true` & expiry.
- **Customer edits**: order uses `buyer_snapshot`; reporting can join to latest `customers` if needed.

---

## 10) Env Vars & Minimal Wiring

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- (Edge) `SUPABASE_SERVICE_ROLE`
- PSP keys: `PSP_SECRET_KEY`, `PSP_WEBHOOK_SECRET`
- App URLs: `PORTAL_URL`, `AUDIENCE_URL`, `BROKER_URL`

**Middleware matcher**: `/portal/:path*`  
**Anon access**: Only to public views and `rpc('is_deposit_paid')` if you want it public (keep if needed).

---

## 11) Minimal Code Sketches

**Server client**:
```ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/auth-helpers-nextjs'

export function getServerSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )
}
```

**Admin gate (middleware)**:
```ts
// Only for /portal
// If not admin, rewrite to /403
```

**Portal queries**:
```ts
const supabase = getServerSupabase()
await supabase.from('post_dash').select('*').order('created_at', { ascending: false }).limit(50)
await supabase.from('orders').select('id, post_id, status, deposit_amount').limit(100)
await supabase.rpc('is_deposit_paid', { p_order_id: someId })
```

---

### That’s it
This doc plus `old.sql` and `new_sql.md` is everything Cursor needs to map, migrate, and wire your apps securely.
