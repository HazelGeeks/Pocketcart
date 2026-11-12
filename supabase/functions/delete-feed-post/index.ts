// Verify the caller with Auth, then scope both the lookup and deletion to that account.
Deno.serve(async (request) => {
  const respond = (status: number) => Response.json({ deleted: status === 200 }, { status });
  if (request.method !== "POST") return respond(405);
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return respond(401);
  const body = await request.json().catch(() => null);
  const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
  if (typeof body?.id !== "string" || !uuid.test(body.id)) return respond(400);
  const base = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !key) return respond(503);
  try {
    const auth = await fetch(base + "/auth/v1/user", {
      headers: { apikey: key, authorization },
      signal: AbortSignal.timeout(10000),
    });
    if (!auth.ok) return respond(auth.status >= 500 ? 503 : 401);
    const user = await auth.json();
    if (!uuid.test(user.id)) return respond(401);
    const headers = {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    };
    const row = base + "/rest/v1/feed_posts?id=eq." + body.id + "&author_id=eq." + user.id;
    const read = await fetch(row + "&select=photo_path", {
      headers,
      signal: AbortSignal.timeout(10000),
    });
    if (!read.ok) return respond(503);
    const [post] = await read.json();
    if (!post) return respond(404);
    // Storage removal by prefix list is idempotent. Keep the row available for retry if it fails.
    if (post.photo_path) {
      const [folder, file, ...extra] = post.photo_path.split("/");
      if (
        folder !== user.id ||
        extra.length ||
        !file?.endsWith(".jpg") ||
        !uuid.test(file.slice(0, -4))
      )
        return respond(503);
      const photo = await fetch(base + "/storage/v1/object/feed-photos", {
        method: "DELETE",
        headers,
        body: JSON.stringify({ prefixes: [post.photo_path] }),
        signal: AbortSignal.timeout(10000),
      });
      if (!photo.ok) return respond(503);
    }
    const deleted = await fetch(row, {
      method: "DELETE",
      headers,
      signal: AbortSignal.timeout(10000),
    });
    return respond(deleted.ok ? 200 : 503);
  } catch {
    return respond(503);
  }
});
