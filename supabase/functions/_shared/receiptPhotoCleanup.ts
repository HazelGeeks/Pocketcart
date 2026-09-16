// Delete private receipt objects through Storage API, never by deleting storage.objects rows.
// Listing from offset zero after each removal also covers abandoned uploads with no receipt row.
export async function removeAccountReceiptPhotos(url: string, serviceKey: string, userId: string) {
  const headers = {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
    "Content-Type": "application/json",
  };
  let previousBatch = "";
  for (;;) {
    const list = await fetch(`${url}/storage/v1/object/list/receipts`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        prefix: `${userId}/`,
        limit: 100,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      }),
      signal: AbortSignal.timeout(10000),
    });
    const payload = await list.json().catch(() => null);
    if (!list.ok) {
      // Backward compatible before the receipts bucket has been provisioned.
      if (payload?.message === "Bucket not found") return;
      throw new Error("Receipt photo cleanup failed. Please retry account deletion.");
    }
    if (!Array.isArray(payload)) throw new Error("Receipt photo cleanup failed.");
    if (!payload.length) return;
    const names = payload.map((object: { name?: unknown }) => object.name);
    if (names.some((name) => typeof name !== "string" || !/^[0-9a-f-]{36}\.(jpg|png)$/.test(name)))
      throw new Error("Receipt photo cleanup needs support.");
    const batch = JSON.stringify(names);
    if (batch === previousBatch)
      throw new Error("Receipt cleanup has not completed. Please retry.");
    previousBatch = batch;
    const result = await fetch(`${url}/storage/v1/object/receipts`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ prefixes: names.map((name) => `${userId}/${name}`) }),
      signal: AbortSignal.timeout(10000),
    });
    if (!result.ok) throw new Error("Receipt photo cleanup failed. Please retry account deletion.");
  }
}
