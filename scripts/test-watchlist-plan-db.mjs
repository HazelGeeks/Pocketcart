// Run with PGLITE_MODULE pointing to an installed @electric-sql/pglite entry.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const { PGlite } = await import(process.env.PGLITE_MODULE ?? '@electric-sql/pglite');
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role;
create schema auth;
create function auth.role() returns text language sql as 'select current_setting(''role'')';
create table public.watchlist_items(id uuid primary key default gen_random_uuid(), user_id uuid not null,
product_id uuid, store_id uuid, name text not null, store text not null, target_price text,
latest_price text, created_at timestamptz not null default now());
create unique index on public.watchlist_items(user_id,product_id) where product_id is not null;
grant all on public.watchlist_items to authenticated,service_role;`);
await db.exec(await fs.readFile('supabase/migrations/20260913010000_watchlist_plan_limit.sql', 'utf8'));
const user = '10000000-0000-0000-0000-000000000001';
const product = n => `20000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const save = (n, plus = false) => db.query('select public.save_watchlist_with_plan($1,$2,null,$3,$4,null,$5)', [user, product(n), `Food ${n}`, 'Store', plus]);
await db.exec('set role service_role');
for (let i = 1; i <= 5; i++) await save(i);
await assert.rejects(save(6), /WATCHLIST_LIMIT_REACHED/);
await save(1); // Editing an existing item does not consume a slot.
await save(6, true);
await assert.rejects(save(7), /WATCHLIST_LIMIT_REACHED/); // Downgrade.
await db.exec('reset role; set role authenticated');
await assert.rejects(save(7, true), /permission denied/); // Cannot forge Plus.
await assert.rejects(db.query('insert into public.watchlist_items(user_id,name,store) values($1,$2,$3)', [user, 'Bypass', 'Store']), /5 products/);
await db.query('update public.watchlist_items set name=$1 where product_id=$2', ['Legacy edit', product(2)]);
await db.query('delete from public.watchlist_items where product_id in ($1,$2)', [product(1), product(6)]);
await db.query('insert into public.watchlist_items(user_id,product_id,name,store) values($1,$2,$3,$4)', [user, product(7), 'Legacy fifth', 'Store']);
await assert.rejects(db.query('insert into public.watchlist_items(user_id,product_id,name,store) values($1,$2,$3,$4)', [user, product(8), 'Legacy sixth', 'Store']), /5 products/);
await db.exec('reset role');
assert.equal((await db.query('select count(*)::int as count from public.watchlist_items')).rows[0].count, 5);
await db.close();
console.log('Watchlist database quota, permissions, updates and downgrade checks passed.');
