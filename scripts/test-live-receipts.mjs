// Explicit live-receipts release smoke. Creates only disposable QA users/data and removes them.
// SUPABASE_CLI is optional when service-role and anon keys are supplied via environment.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { createCanvas } from "@napi-rs/canvas";

const project = process.env.SUPABASE_PROJECT_ID;
if (project !== "jmxbvqrvxshlybeomagw")
  throw new Error("Expected the approved Pocketcart project.");
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let anonKey = process.env.SUPABASE_ANON_KEY;
if ((!serviceKey || !anonKey) && process.env.SUPABASE_CLI) {
  let keys;
  try {
    keys = JSON.parse(
      execFileSync(
        process.env.SUPABASE_CLI,
        ["projects", "api-keys", "--project-ref", project, "--output", "json"],
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      ),
    );
  } catch {
    throw new Error("Could not obtain deployment test credentials from the signed-in CLI.");
  }
  serviceKey = keys.find((k) => k.name === "service_role")?.api_key;
  anonKey = keys.find((k) => k.name === "anon")?.api_key;
}
if (!serviceKey || !anonKey) throw new Error("Missing test credentials. Values are never logged.");
const base = `https://${project}.supabase.co`;
const options = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};
const admin = createClient(base, serviceKey, options);
const users = [];
const evidence = [];
const evidenceDir = process.env.RECEIPTS_EVIDENCE_DIR;
const mark = (text) => {
  evidence.push(text);
  console.log(`PASS: ${text}`);
};
function must(result, label) {
  assert.ok(!result.error, `${label}: ${result.error?.message ?? "failed"}`);
  return result.data;
}
const canvas = createCanvas(850, 1050);
const ctx = canvas.getContext("2d");
ctx.fillStyle = "white";
ctx.fillRect(0, 0, 850, 1050);
ctx.fillStyle = "black";
ctx.font = "30px monospace";
const date = new Date().toISOString().slice(0, 10);
const lines = [
  "POCKETCART QA MARKET",
  "SYNTHETIC TEST RECEIPT",
  "Vancouver, BC, Canada",
  `Date: ${date}`,
  "Currency: CAD",
  "",
  "Milk 2 L",
  "2 x 4.99                 9.98",
  "Bread",
  "1 x 3.00                 3.00",
  "",
  "Subtotal                12.98",
  "Tax                      0.65",
  "Discount                 0.00",
  "TOTAL CAD               13.63",
  "",
  "No real purchase or payment",
];
lines.forEach((line, i) => {
  ctx.fillText(line, 45, 60 + i * 49);
});
const image = canvas.toBuffer("image/jpeg");
const newClient = () => createClient(base, anonKey, options);
try {
  const anonymous = newClient();
  assert.ok(
    (await anonymous.from("receipts").select("id")).error,
    "Anonymous receipts must be denied",
  );
  const unauthenticatedScan = await fetch(`${base}/functions/v1/receipt-scan`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(unauthenticatedScan.status, 401);
  mark("anonymous receipt access and unauthenticated photo reading are denied");
  for (let i = 0; i < 2; i++) {
    const email = `pocketcart-receipts-qa-${crypto.randomUUID()}@example.com`;
    const password = `Pc!${crypto.randomUUID()}A9`;
    const created = must(
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: `Disposable Receipts QA ${i + 1}` },
      }),
      "Create QA account",
    );
    const user = { id: created.user.id, email, password, client: newClient(), deleted: false };
    users.push(user);
    if (evidenceDir)
      await fs.writeFile(
        `${evidenceDir}/qa-users.json`,
        JSON.stringify(users.map((u) => ({ id: u.id, deleted: u.deleted }))),
        { mode: 0o600 },
      );
    const signedIn = must(
      await user.client.auth.signInWithPassword({ email, password }),
      "Sign in QA account",
    );
    user.token = signedIn.session.access_token;
  }
  const [owner, outsider] = users;
  const otherSession = newClient();
  must(
    await otherSession.auth.signInWithPassword({ email: owner.email, password: owner.password }),
    "Sign in second owner session",
  );
  const id = crypto.randomUUID();
  const path = `${owner.id}/${id}.jpg`;
  must(
    await owner.client.storage.from("receipts").upload(path, image, { contentType: "image/jpeg" }),
    "Upload private photo",
  );
  const values = {
    id,
    user_id: owner.id,
    store_name: "Pocketcart QA Market",
    purchased_on: date,
    currency: "CAD",
    total_cents: 1363,
    tax_cents: 65,
    discount_cents: 0,
    items: [
      { name: "Milk 2 L", quantity: 2, unitPriceCents: 499, lineTotalCents: 998 },
      { name: "Bread", quantity: 1, unitPriceCents: 300, lineTotalCents: 300 },
    ],
    photo_path: path,
  };
  const stored = must(
    await owner.client.from("receipts").insert(values).select().single(),
    "Save receipt",
  );
  const secondRead = must(
    await otherSession.from("receipts").select().eq("id", id).single(),
    "Read receipt from second session",
  );
  assert.equal(secondRead.total_cents, 1363);
  assert.deepEqual(secondRead.items, values.items);
  assert.ok(
    (await owner.client.from("receipts").insert(values)).error,
    "Same ID cannot create a duplicate",
  );
  const signed = must(
    await otherSession.storage.from("receipts").createSignedUrl(path, 60),
    "Read owner photo from second session",
  );
  assert.equal((await fetch(signed.signedUrl)).status, 200);
  mark(
    "private photo and itemized receipt persist and sync across two independent account sessions; duplicate ID rejected",
  );
  assert.equal(
    must(await outsider.client.from("receipts").select("id").eq("id", id), "Read as outsider")
      .length,
    0,
  );
  assert.ok(
    (await outsider.client.from("receipts").insert({ ...values, id: crypto.randomUUID() })).error,
  );
  assert.equal(
    must(
      await outsider.client.from("receipts").update({ total_cents: 1 }).eq("id", id).select("id"),
      "Outsider update",
    ).length,
    0,
  );
  assert.ok((await outsider.client.storage.from("receipts").createSignedUrl(path, 60)).error);
  assert.ok(
    (
      await outsider.client.storage
        .from("receipts")
        .upload(`${owner.id}/${crypto.randomUUID()}.jpg`, image, { contentType: "image/jpeg" })
    ).error,
  );
  assert.equal((await fetch(`${base}/storage/v1/object/public/receipts/${path}`)).ok, false);
  mark(
    "other accounts cannot read, edit, impersonate ownership, view or upload the owner's receipt photo; public access denied",
  );
  const edited = must(
    await otherSession
      .from("receipts")
      .update({ total_cents: 1364 })
      .eq("id", id)
      .eq("updated_at", stored.updated_at)
      .select()
      .single(),
    "Edit receipt",
  );
  const stale = must(
    await owner.client
      .from("receipts")
      .update({ total_cents: 1 })
      .eq("id", id)
      .eq("updated_at", stored.updated_at)
      .select("id"),
    "Stale edit",
  );
  assert.equal(stale.length, 0);
  assert.equal(edited.total_cents, 1364);
  mark("cross-session edits sync and stale versions cannot overwrite newer purchases");
  // Only synthetic text is sent to the model; no user receipt, card or identity data.
  const read = await fetch(`${base}/functions/v1/receipt-scan`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${owner.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageBase64: image.toString("base64"), mimeType: "image/jpeg" }),
    signal: AbortSignal.timeout(65000),
  });
  const scanned = await read.json();
  assert.equal(read.status, 200, `Live reading failed: ${scanned.error ?? read.status}`);
  assert.equal(scanned.result.total_cents, 1363);
  assert.equal(scanned.result.tax_cents, 65);
  assert.equal(scanned.result.currency, "CAD");
  assert.equal(scanned.result.purchased_on, date);
  assert.equal(scanned.result.items.length, 2);
  assert.deepEqual(
    scanned.result.items.map((i) => i.lineTotalCents).sort((a, b) => a - b),
    [300, 998],
  );
  mark(
    "live OpenAI reading correctly extracts date, CAD, 2 purchased items, tax and the 13.63 total from a synthetic receipt",
  );
  // One claim was consumed by the actual scan; enforce the remaining server quota.
  for (let i = 0; i < 29; i++)
    assert.equal(must(await owner.client.rpc("claim_receipt_scan"), "Claim scan quota"), true);
  assert.equal(must(await owner.client.rpc("claim_receipt_scan"), "Quota ceiling"), false);
  assert.equal(
    must(await outsider.client.rpc("claim_receipt_scan"), "Separate account quota"),
    true,
  );
  const limited = await fetch(`${base}/functions/v1/receipt-scan`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${owner.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageBase64: image.toString("base64"), mimeType: "image/jpeg" }),
  });
  assert.equal(limited.status, 429);
  mark("daily scan limit is atomic, account-specific and enforced before another model request");
  must(
    await owner.client
      .from("receipts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("updated_at", edited.updated_at),
    "Mark receipt deleted",
  );
  assert.equal(
    must(
      await otherSession.from("receipts").select("id").is("deleted_at", null),
      "Deleted receipt hidden",
    ).length,
    0,
  );
  must(await owner.client.storage.from("receipts").remove([path]), "Remove deleted photo");
  must(await owner.client.from("receipts").delete().eq("id", id), "Purge receipt tombstone");
  assert.ok((await owner.client.storage.from("receipts").createSignedUrl(path, 60)).error);
  mark("receipt deletion removes the purchase from other sessions and removes its photo");
  const orphanPath = `${owner.id}/${crypto.randomUUID()}.jpg`;
  const savedId = crypto.randomUUID();
  const savedPath = `${owner.id}/${savedId}.jpg`;
  must(
    await owner.client.storage
      .from("receipts")
      .upload(orphanPath, image, { contentType: "image/jpeg" }),
    "Create abandoned draft photo",
  );
  must(
    await owner.client.storage
      .from("receipts")
      .upload(savedPath, image, { contentType: "image/jpeg" }),
    "Create saved account photo",
  );
  must(
    await owner.client.from("receipts").insert({ ...values, id: savedId, photo_path: savedPath }),
    "Create account cleanup receipt",
  );
  const removal = await fetch(`${base}/functions/v1/delete-account`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${owner.token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  const removed = await removal.json();
  assert.equal(
    removal.status,
    200,
    `Account cleanup failed: ${removed.error ?? removed.message ?? removal.status}`,
  );
  assert.equal(removed.deleted, true);
  owner.deleted = true;
  assert.equal(
    must(await admin.storage.from("receipts").list(owner.id), "Account photo cleanup").length,
    0,
  );
  assert.equal(
    must(await admin.from("receipts").select("id").eq("user_id", owner.id), "Account row cleanup")
      .length,
    0,
  );
  assert.equal(
    must(
      await admin.from("receipt_scan_usage").select("user_id").eq("user_id", owner.id),
      "Account quota cleanup",
    ).length,
    0,
  );
  mark(
    "deployed account deletion removes saved receipts, quota rows, saved photos and abandoned draft photos",
  );
} finally {
  const failures = [];
  for (const user of users) {
    const objects = await admin.storage.from("receipts").list(user.id, { limit: 1000 });
    if (objects.error) {
      failures.push(user.id);
      continue;
    }
    if (objects.data?.length) {
      const removal = await admin.storage
        .from("receipts")
        .remove(objects.data.map((o) => `${user.id}/${o.name}`));
      if (removal.error) {
        failures.push(user.id);
        continue;
      }
    }
    if (!user.deleted) {
      const removal = await admin.auth.admin.deleteUser(user.id);
      if (removal.error) failures.push(user.id);
      else user.deleted = true;
    }
  }
  if (evidenceDir) {
    await fs.writeFile(
      `${evidenceDir}/qa-users.json`,
      JSON.stringify(users.map((u) => ({ id: u.id, deleted: u.deleted }))),
      { mode: 0o600 },
    );
    await fs.writeFile(
      `${evidenceDir}/live-smoke.json`,
      JSON.stringify(
        {
          at: new Date().toISOString(),
          project,
          passed: evidence,
          cleanupComplete: failures.length === 0,
        },
        null,
        2,
      ),
    );
  }
  assert.equal(
    failures.length,
    0,
    `Disposable QA cleanup requires attention for ${failures.length} accounts.`,
  );
  console.log("Disposable QA users, receipt rows and photos removed.");
}
