const test = require("node:test");
const assert = require("node:assert/strict");
const { sourceModule } = require("./helpers/sourceModule.cjs");
const id = "post-id";
const photo = { id: "photo-id", uri: "local.jpg", base64: "AQID" };
const draft = {
  id,
  saleId: null,
  caption: " Limes were half price today! ",
  photo: null,
};

function setup({ uploaded = false, insertError = null, committed = false } = {}) {
  const ops = [];
  const bucket = {
    async upload(path) {
      ops.push(["upload", path]);
      return { error: uploaded ? new Error("duplicate") : null };
    },
    async exists() {
      return { data: uploaded };
    },
    async remove(paths) {
      ops.push(["remove", ...paths]);
    },
  };
  const table = {
    async insert(row) {
      ops.push(["insert", row]);
      return { error: insertError };
    },
    select() {
      return this;
    },
    eq() {
      return this;
    },
    async maybeSingle() {
      return { data: committed ? { id } : null, error: null };
    },
  };
  const feed = sourceModule("src/services/communityFeed.ts", {
    "base64-js": require("base64-js"),
    "./supabaseClient": {
      supabase: { from: () => table, storage: { from: () => bucket } },
    },
  });
  return { feed, ops };
}

test("a freeform post accepts text, a photo, or both without classification or sale fields", async () => {
  const { feed, ops } = setup();
  for (const caption of ["   ", "\n", "🥕".repeat(256)])
    await assert.rejects(feed.publishPost("shopper", { ...draft, caption }));
  assert.equal(ops.length, 0);
  await feed.publishPost("shopper", draft);
  assert.deepEqual(Object.keys(ops[0][1]).sort(), [
    "author_id",
    "caption",
    "id",
    "is_anonymous",
    "photo_path",
    "sale_id",
  ]);
  assert.equal(ops[0][1].caption, "Limes were half price today!");
  await feed.publishPost("shopper", { ...draft, caption: "", photo });
  assert.equal(ops.at(-1)[1].photo_path, "shopper/photo-id.jpg");
});

test("255 Unicode code points fit in a post, including emoji", () => {
  const { feed } = setup();
  assert.equal(feed.validateDraft({ ...draft, caption: "🥕".repeat(255) }), null);
  assert.match(feed.validateDraft({ ...draft, caption: "🥕".repeat(255) + "!" }), /255/);
});

test("linked Gotcha uploads the selected photo and references the original sale", async () => {
  const { feed, ops } = setup();
  await feed.publishPost("shopper", {
    ...draft,
    saleId: "sale",
    photo,
  });
  assert.deepEqual(ops[0], ["upload", "shopper/photo-id.jpg"]);
  assert.equal(ops[1][1].sale_id, "sale");
  assert.equal(ops[1][1].photo_path, ops[0][1]);
});

test("a retry reuses a committed post and never removes its published photo", async () => {
  const { feed, ops } = setup({
    uploaded: true,
    insertError: { code: "23505" },
    committed: true,
  });
  await feed.publishPost("shopper", { ...draft, photo });
  assert.equal(ops[1][1].id, id);
  assert.equal(
    ops.some((op) => op[0] === "remove"),
    false,
  );
});

test("a sale removed before publication leaves no published purchase photo", async () => {
  const { feed, ops } = setup({ insertError: { code: "P0002" } });
  await assert.rejects(
    feed.publishPost("shopper", {
      ...draft,
      saleId: "gone",
      photo,
    }),
    /no longer available/,
  );
  assert.deepEqual(ops.at(-1), ["remove", "shopper/photo-id.jpg"]);
});
