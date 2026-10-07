// Optional PostgreSQL/WASM integration test: install @electric-sql/pglite@0.5.8 in a temporary folder.
// Set POCKETCART_PGLITE_MODULE to its absolute dist/index.js path, then run this file.
const { PGlite } = await import(process.env.POCKETCART_PGLITE_MODULE ?? "@electric-sql/pglite");
import fs from "node:fs";
import assert from "node:assert/strict";
import { migrationTransaction, sha256 } from "../../scripts/supabase-release-lib.mjs";
import { featureChecks } from "../../scripts/supabase-release-checks.mjs";
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create table public.admin_users(user_id uuid primary key);
insert into public.admin_users values ('00000000-0000-0000-0000-000000000001');
create function public.is_admin() returns boolean language sql security definer set search_path=public stable as $$ select exists(select 1 from public.admin_users where user_id=auth.uid()) $$;
grant usage on schema public,auth to anon,authenticated;
grant execute on function auth.uid(),public.is_admin() to authenticated;
create schema storage;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;
create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
grant usage on schema storage to anon,authenticated;
grant select on storage.objects to anon,authenticated;
grant insert on storage.objects to authenticated;`);
const migrations = ["20261007010000_blog_posts.sql", "20261007020000_blog_rich_editor.sql"].map(
  (name) => {
    const source = fs.readFileSync(
      new URL(`../../supabase/migrations/${name}`, import.meta.url),
      "utf8",
    );
    return { version: name.slice(0, 14), name, source, hash: sha256(source) };
  },
);
await db.exec(migrationTransaction(migrations, { checks: featureChecks(migrations) }));
await db.exec(migrationTransaction(migrations, { checks: featureChecks(migrations) }));
assert.equal((await db.query("select count(*)::int n from public.blog_posts")).rows[0].n, 12);
assert.equal((await db.query("select count(*)::int n from public.blog_posts where author_name='Pocketcart'")).rows[0].n, 12);
const bucket = (await db.query("select public,file_size_limit,allowed_mime_types from storage.buckets where id='blog-images'")).rows[0];
assert.equal(bucket.public, false);
assert.equal(Number(bucket.file_size_limit), 5 * 1024 * 1024);
assert.deepEqual(bucket.allowed_mime_types, ["image/jpeg", "image/png", "image/webp"]);
const input = {
  slug: "audit-new-article",
  locale: "en",
  status: "draft",
  title: "A draft",
  description: "Description",
  excerpt: "Excerpt",
  published_on: "2026-10-07",
  read_minutes: 3,
  sections: [{ heading: "Heading", paragraphs: ["Body <script>literal text</script>"] }],
};
await db.exec(
  `set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001'`,
);
const cols = Object.keys(input);
const vals = Object.values(input).map((v) => (typeof v === "object" ? JSON.stringify(v) : v));
const inserted = (
  await db.query(
    `insert into public.blog_posts(${cols.join(",")}) values (${cols.map((_, i) => "$" + (i + 1)).join(",")}) returning *`,
    vals,
  )
).rows[0];
assert.ok(inserted.id);
await db.exec(`reset role; set role anon`);
assert.equal((await db.query("select count(*)::int n from blog_posts")).rows[0].n, 12);
await assert.rejects(
  db.query("insert into blog_posts(slug,locale,title) values('forbidden','en','Forbidden')"),
  /permission denied/,
);
await assert.rejects(db.query("update blog_posts set title='Forbidden'"), /permission denied/);
await assert.rejects(db.query("delete from blog_posts"), /permission denied/);
await db.exec(
  `reset role; set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002'`,
);
assert.equal((await db.query("select count(*)::int n from blog_posts")).rows[0].n, 12);
await assert.rejects(
  db.query("insert into blog_posts(slug,locale,title) values('forbidden','en','Forbidden')"),
  /row-level security/,
);
assert.equal(
  (await db.query("update blog_posts set title='Forbidden' returning id")).rows.length,
  0,
);
await db.exec(
  `reset role; set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001'`,
);
assert.equal((await db.query("select count(*)::int n from blog_posts")).rows[0].n, 13);
await assert.rejects(
  db.query("update blog_posts set status='published',sections='[]' where id=$1", [inserted.id]),
  /Published articles/,
);
await assert.rejects(
  db.query("update blog_posts set slug='changed' where id=$1", [inserted.id]),
  /URL and language/,
);
await assert.rejects(
  db.query("update blog_posts set sections='{}' where id=$1", [inserted.id]),
  /cannot extract elements|Unsupported|Invalid/,
);
await db.query("update blog_posts set status='published' where id=$1", [inserted.id]);
await db.exec(`reset role; set role anon`);
assert.equal((await db.query("select count(*)::int n from blog_posts")).rows[0].n, 13);
assert.equal(
  (await db.query("select sections from blog_posts where id=$1", [inserted.id])).rows[0].sections[0]
    .paragraphs[0],
  input.sections[0].paragraphs[0],
);
await db.exec(
  `reset role; set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001'`,
);
const revision = (
  await db.query("select updated_at::text from blog_posts where id=$1", [inserted.id])
).rows[0].updated_at;
await db.query("update blog_posts set title='Edited' where id=$1 and updated_at=$2 returning *", [
  inserted.id,
  revision,
]);
assert.equal(
  (
    await db.query(
      "update blog_posts set title='Overwrite' where id=$1 and updated_at=$2 returning *",
      [inserted.id, revision],
    )
  ).rows.length,
  0,
);
await db.query("update blog_posts set status='draft' where id=$1", [inserted.id]);
await db.exec(`reset role; set role anon`);
assert.equal((await db.query("select count(*)::int n from blog_posts")).rows[0].n, 12);

await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001'`);
const imagePath = "00000000-0000-0000-0000-000000000001/00000000-0000-0000-0000-000000000009.png";
await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values('blog-images',$1)", ["00000000-0000-0000-0000-000000000002/00000000-0000-0000-0000-000000000009.png"]), /row-level security/);
await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002'`);
await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values('blog-images',$1)", ["00000000-0000-0000-0000-000000000002/00000000-0000-0000-0000-000000000009.png"]), /row-level security/);
await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001'`);
await db.query("insert into storage.objects(bucket_id,name) values('blog-images',$1)", [imagePath]);
const document = { type: "doc", content: [
  { type: "paragraph", content: [{ type: "text", text: "Formatted article", marks: [{ type: "bold" }] }] },
  { type: "image", attrs: { assetPath: imagePath, src: "", alt: "Private draft image" } },
] };
const rich = (await db.query("insert into blog_posts(slug,locale,title,description,excerpt,content) values('rich-article','en','Rich article','Description','Excerpt',$1) returning id", [JSON.stringify(document)])).rows[0];
assert.equal((await db.query("select image_paths from blog_posts where id=$1", [rich.id])).rows[0].image_paths[0], imagePath);
await db.exec('reset role; set role anon');
assert.equal((await db.query("select * from storage.objects where name=$1", [imagePath])).rows.length, 0);
await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001'`);
await db.query("update blog_posts set status='scheduled',publish_at=now()+interval '1 day' where id=$1", [rich.id]);
assert.equal((await db.query("select * from published_blog_posts where id=$1", [rich.id])).rows.length, 0);
await db.exec('reset role; set role anon');
assert.equal((await db.query("select * from blog_posts where id=$1", [rich.id])).rows.length, 0);
assert.equal((await db.query("select * from storage.objects where name=$1", [imagePath])).rows.length, 0);
await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001'`);
await db.query("update blog_posts set publish_at=now()-interval '1 minute',is_pinned=true where id=$1", [rich.id]);
await db.exec('reset role; set role anon');
assert.equal((await db.query("select * from published_blog_posts where id=$1", [rich.id])).rows.length, 1);
assert.equal((await db.query("select * from storage.objects where name=$1", [imagePath])).rows.length, 1);
await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001'`);
await assert.rejects(db.query("update blog_posts set content=$1 where id=$2", [JSON.stringify({type:"doc",content:[{type:"image",attrs:{src:"javascript:alert(1)"}}]}),rich.id]), /Invalid article image URL/);
await assert.rejects(db.query("update blog_posts set content=$1 where id=$2", [JSON.stringify({type:"doc",content:[{type:"paragraph",content:[{type:"text",text:"Click",marks:[{type:"link",attrs:{href:"javascript:alert(1)"}}]}]}]}),rich.id]), /Invalid article link/);
await db.query("update blog_posts set status='draft' where id=$1", [rich.id]);
await db.exec('reset role; set role anon');
assert.equal((await db.query("select * from storage.objects where name=$1", [imagePath])).rows.length, 0);
console.log(
  "PASS: 12 legacy articles; admin CRUD without deletion; anonymous/member draft isolation; publish/unpublish; immutable URLs; content validation; revision conflicts; rich content; private draft images; server-clock scheduling.",
);
await db.close();
