// Resolve only a published anonymous post ID. Never return its owner-prefixed object path.
const uuid = "[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}";
Deno.serve(async (req) => {
  if (req.method !== "GET") return new Response(null, { status: 405 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!new RegExp("^" + uuid + "$", "i").test(id)) return new Response(null, { status: 404 });
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return new Response(null, { status: 503 });
  const headers = { apikey: key, Authorization: "Bearer " + key };
  try {
    const lookup = await fetch(
      `${url}/rest/v1/feed_posts?select=photo_path&id=eq.${id}&is_anonymous=is.true&limit=1`,
      { headers, signal: AbortSignal.timeout(10000) },
    );
    if (!lookup.ok) return new Response(null, { status: 503 });
    const path = (await lookup.json())[0]?.photo_path;
    if (
      typeof path !== "string" ||
      !new RegExp("^" + uuid + "/" + uuid + "[.]jpg$", "i").test(path)
    )
      return new Response(null, { status: 404 });
    const image = await fetch(`${url}/storage/v1/object/authenticated/feed-photos/${path}`, {
      headers,
      signal: AbortSignal.timeout(15000),
    });
    if (!image.ok) return new Response(null, { status: image.status === 404 ? 404 : 503 });
    return new Response(image.body, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
});
