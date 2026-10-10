type Reservation =
  | { state: "claimed"; claimId: string }
  | { state: "cached"; result: Record<string, unknown> }
  | { state: "busy" }
  | { state: "limited" };

export function configuredLimit(name: string, fallback: number, maximum: number): number {
  const value = Deno.env.get(name)?.trim();
  if (!value) return fallback;
  const number = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < 1 || number > maximum)
    throw new Error(`Invalid ${name} setting.`);
  return number;
}

async function rpc(name: string, body: unknown): Promise<unknown> {
  const url = Deno.env.get("SUPABASE_URL")?.trim();
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!url || !key) throw new Error("Flyer cost controls are not configured.");
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new Error("Flyer cost controls are unavailable. Check the backend migration.");
  return response.json();
}

export async function reserveExtraction(
  userId: string,
  file: File,
  settings: unknown,
): Promise<{ key: string; reservation: Reservation }> {
  const fileHash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  const hash = [...new Uint8Array(fileHash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const keyHash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify([hash, settings])),
  );
  const key = [...new Uint8Array(keyHash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const reservation = (await rpc("claim_flyer_extraction", {
    p_user_id: userId,
    p_cache_key: key,
    p_user_limit: configuredLimit("FLYER_DAILY_USER_LIMIT", 120, 5000),
    p_global_limit: configuredLimit("FLYER_DAILY_GLOBAL_LIMIT", 300, 5000),
  })) as Reservation;
  if (!reservation || !["claimed", "cached", "busy", "limited"].includes(reservation.state))
    throw new Error("Invalid Flyer reservation response.");
  if (reservation.state === "claimed" && typeof reservation.claimId !== "string")
    throw new Error("Invalid Flyer reservation claim.");
  if (
    reservation.state === "cached" &&
    (!reservation.result || !Array.isArray(reservation.result.rows))
  )
    throw new Error("Invalid cached Flyer result.");
  return { key, reservation };
}

export async function finishExtraction(
  key: string,
  claimId: string,
  result: unknown,
): Promise<void> {
  const finished = await rpc("finish_flyer_extraction", {
    p_cache_key: key,
    p_claim_id: claimId,
    p_result: result,
  });
  if (finished !== true) throw new Error("Flyer extraction reservation expired. Please try again.");
}
