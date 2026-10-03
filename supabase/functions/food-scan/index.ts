// Temporary shutdown handler. Never import analysis.ts or call an AI provider.
export function handleFoodScan(request: Request): Response {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
  };
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  return new Response(JSON.stringify({ code: "FEATURE_DISABLED", error: "Food Scan is temporarily unavailable." }), {
    status: 503, headers: { ...headers, "Content-Type": "application/json" },
  });
}

Deno.serve(handleFoodScan);
