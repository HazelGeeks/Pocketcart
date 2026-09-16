import { toByteArray } from "base64-js";
import { supabase } from "./supabaseClient";
import { collectPagedRows } from "../utils/paginatedQuery";
import { validateReceipt, type Receipt, type ReceiptValues } from "../utils/receipts";
import type { ReceiptPhoto } from "../utils/receiptDraft";

const FIELDS =
  "id,user_id,store_name,purchased_on,currency,total_cents,tax_cents,discount_cents,items,photo_path,created_at,updated_at,deleted_at";
export function receiptError(error: unknown): string {
  const e = error as { code?: string; message?: string } | null;
  if (["42P01", "PGRST205"].includes(e?.code ?? ""))
    return "Receipts is not available yet. Please try again after the next update.";
  return e?.message || "Could not sync receipts. Check your connection and try again.";
}
async function clientFor(userId: string) {
  if (!supabase) throw new Error("Please sign in to use Receipts.");
  const { data, error } = await supabase.auth.getSession();
  if (error || data.session?.user.id !== userId)
    throw new Error("Your account changed. Please reopen Receipts.");
  return supabase;
}
async function purgeDeleted(userId: string, rows: Receipt[]) {
  const client = await clientFor(userId);
  for (const receipt of rows.filter((r) => r.deleted_at)) {
    if (receipt.photo_path) {
      const { error } = await client.storage.from("receipts").remove([receipt.photo_path]);
      if (error) continue; // Tombstone retains the path for a later retry.
    }
    await client
      .from("receipts")
      .delete()
      .eq("user_id", userId)
      .eq("id", receipt.id)
      .not("deleted_at", "is", null);
  }
}
export async function listReceipts(userId: string): Promise<Receipt[]> {
  const client = await clientFor(userId);
  const { data, error } = await collectPagedRows<Receipt, { message: string; code?: string }>(
    async (from, to) => {
      const result = await client
        .from("receipts")
        .select(FIELDS)
        .eq("user_id", userId)
        .order("purchased_on", { ascending: false })
        .order("id")
        .range(from, to);
      return { data: result.data as Receipt[] | null, error: result.error };
    },
  );
  if (error) throw error;
  void purgeDeleted(userId, data).catch(() => {});
  return data.filter((r) => !r.deleted_at);
}
function photoBytes(photo: ReceiptPhoto): ArrayBuffer {
  if (
    !photo.base64 ||
    photo.base64.length % 4 !== 0 ||
    photo.base64.length > 8_000_000 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(photo.base64)
  )
    throw new Error("This photo is too large or unreadable. Please retake it.");
  const bytes = toByteArray(photo.base64);
  if (bytes.length > 6_000_000)
    throw new Error("Photo must be smaller than 6 MB. Please retake it.");
  return new Uint8Array(bytes).buffer;
}
export async function saveReceipt(params: {
  userId: string;
  id: string;
  values: ReceiptValues;
  photo: ReceiptPhoto | null;
  existing?: Receipt;
}): Promise<Receipt> {
  const validation = validateReceipt(params.values);
  if (validation) throw new Error(validation);
  const client = await clientFor(params.userId);
  if (params.existing) {
    const { data, error } = await client
      .from("receipts")
      .update(params.values)
      .eq("user_id", params.userId)
      .eq("id", params.id)
      .eq("updated_at", params.existing.updated_at)
      .is("deleted_at", null)
      .select(FIELDS)
      .maybeSingle();
    if (error) throw error;
    if (!data)
      throw new Error(
        "This receipt changed on another device. Close and refresh Receipts before editing again.",
      );
    return data as Receipt;
  }
  // A stable draft ID makes retrying after a dropped response safe.
  const existing = await client
    .from("receipts")
    .select(FIELDS)
    .eq("user_id", params.userId)
    .eq("id", params.id)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) {
    if (existing.data.deleted_at) throw new Error("This receipt was deleted. Start a new receipt.");
    const stored = existing.data as Receipt;
    const scalarKeys = [
      "store_name",
      "purchased_on",
      "currency",
      "total_cents",
      "tax_cents",
      "discount_cents",
    ] as const;
    const canonicalItems = (values: ReceiptValues) =>
      values.items.map((item) => [
        item.name,
        item.quantity,
        item.unitPriceCents,
        item.lineTotalCents,
      ]);
    if (
      scalarKeys.some((key) => stored[key] !== params.values[key]) ||
      JSON.stringify(canonicalItems(stored)) !== JSON.stringify(canonicalItems(params.values))
    ) {
      throw new Error(
        "This receipt was already saved. Close this draft and reopen the saved receipt to edit it.",
      );
    }
    return stored;
  }
  const photoPath = params.photo
    ? `${params.userId}/${params.id}.${params.photo.mimeType === "image/png" ? "png" : "jpg"}`
    : null;
  if (params.photo && photoPath) {
    const { error } = await client.storage
      .from("receipts")
      .upload(photoPath, photoBytes(params.photo), {
        contentType: params.photo.mimeType,
        upsert: false,
      });
    if (
      error &&
      String(error.statusCode) !== "409" &&
      error.message !== "The resource already exists"
    )
      throw error;
  }
  const { data, error } = await client
    .from("receipts")
    .insert({ ...params.values, id: params.id, user_id: params.userId, photo_path: photoPath })
    .select(FIELDS)
    .single();
  if (error) throw error; // Keep photo for a retry; never delete a possibly committed photo.
  return data as Receipt;
}
export async function deleteReceipt(userId: string, receipt: Receipt): Promise<void> {
  const client = await clientFor(userId);
  const { data, error } = await client
    .from("receipts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", receipt.id)
    .eq("updated_at", receipt.updated_at)
    .is("deleted_at", null)
    .select(FIELDS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("This receipt changed. Refresh and try again.");
  await purgeDeleted(userId, [data as Receipt]).catch(() => {}); // Logical deletion already committed; refresh retries photo cleanup.
}
export async function receiptPhotoUrl(userId: string, path: string): Promise<string> {
  const client = await clientFor(userId);
  const { data, error } = await client.storage.from("receipts").createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}
export async function readReceiptPhoto(userId: string, photo: ReceiptPhoto): Promise<unknown> {
  const client = await clientFor(userId);
  photoBytes(photo);
  const { data, error } = await client.functions.invoke("receipt-scan", {
    body: { imageBase64: photo.base64, mimeType: photo.mimeType },
  });
  if (error || !data?.result) {
    const details = await error?.context?.json?.().catch(() => null);
    throw new Error(
      details?.error || "Could not read this receipt. Try again or enter the details yourself.",
    );
  }
  return data.result;
}
