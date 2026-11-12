import { toByteArray } from "base64-js";
import { supabase, supabaseUrl } from "./supabaseClient";

export const FEED_CAPTION_LIMIT = 255;

export type FeedCursor = { created_at: string; id: string };
export type FeedPost = FeedCursor & {
  sale_id: string | null;
  product: string | null;
  store: string | null;
  price: number | null;
  caption: string;
  photo_path: string | null;
  author_label: string;
  anonymous_photo: boolean;
  comment_count: number;
  like_count: number;
  liked_by_me: boolean;
  gotcha_count: number;
  photoUrl: string | null;
  isMine: boolean;
};
export type FeedPhoto = { id: string; uri: string; base64: string };
export type PostDraft = {
  id: string;
  saleId: string | null;
  anonymous: boolean;
  caption: string;
  photo: FeedPhoto | null;
};

function client() {
  if (!supabase) throw new Error("The feed is unavailable. Please try again later.");
  return supabase;
}

export async function loadFeed(
  saleId: string | null,
  cursor: FeedCursor | null,
  userId: string | null,
) {
  const db = client();
  const pageSize = 20;
  let query = db
    .from("community_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageSize + 1);
  if (saleId) query = query.eq("sale_id", saleId);
  if (cursor)
    query = query.or(
      `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
    );
  const { data, error } = await query;
  if (error) throw new Error("Could not load the feed. Please try again.");
  const rows = (data ?? []).slice(0, pageSize) as Omit<FeedPost, "photoUrl" | "isMine">[];
  const paths = rows.flatMap((row) => (row.photo_path ? [row.photo_path] : []));
  const urls = new Map<string, string>();
  if (paths.length) {
    const signed = await db.storage.from("feed-photos").createSignedUrls(paths, 24 * 3600);
    if (signed.error) throw new Error("Could not load the photos. Please try again.");
    for (const item of signed.data) {
      if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
    }
  }
  // The underlying table exposes only the caller’s rows, including their anonymous posts.
  const owned = new Set<string>();
  if (userId && rows.length) {
    const result = await db
      .from("feed_posts")
      .select("id")
      .eq("author_id", userId)
      .in(
        "id",
        rows.map((row) => row.id),
      );
    if (result.error) throw new Error("Could not load the feed. Please try again.");
    for (const row of result.data ?? []) owned.add(row.id);
  }
  const posts = rows.map((row) => ({
    ...row,
    isMine: owned.has(row.id),
    photoUrl: row.anonymous_photo
      ? `${supabaseUrl}/functions/v1/feed-photo?id=${encodeURIComponent(row.id)}`
      : (urls.get(row.photo_path ?? "") ?? null),
  }));
  const last = rows[rows.length - 1];
  const next: FeedCursor | null =
    data && data.length > pageSize ? { id: last.id, created_at: last.created_at } : null;
  return { posts, next };
}

export function validateDraft(draft: PostDraft) {
  const body = draft.caption.trim();
  if (!body && !draft.photo) return "Write something or add a photo.";
  if (Array.from(draft.caption).length > FEED_CAPTION_LIMIT)
    return `Keep your post to ${FEED_CAPTION_LIMIT} characters.`;
  return null;
}

export async function publishPost(userId: string, draft: PostDraft) {
  const validation = validateDraft(draft);
  if (validation) throw new Error(validation);
  const db = client();
  const bucket = db.storage.from("feed-photos");
  const photoPath = draft.photo ? `${userId}/${draft.photo.id}.jpg` : null;
  if (draft.photo && photoPath) {
    const bytes = toByteArray(draft.photo.base64);
    if (!bytes.length || bytes.length > 4194304)
      throw new Error("Choose a smaller photo (up to 4 MB).");
    const upload = await bucket.upload(photoPath, bytes.buffer as ArrayBuffer, {
      contentType: "image/jpeg",
    });
    // A lost response may leave this exact, immutable photo already uploaded.
    if (upload.error && !(await bucket.exists(photoPath)).data)
      throw new Error("Could not upload your photo. Please try again.");
  }
  const { error } = await db.from("feed_posts").insert({
    id: draft.id,
    author_id: userId,
    sale_id: draft.saleId,
    is_anonymous: draft.anonymous === true,
    caption: draft.caption.trim(),
    photo_path: photoPath,
  });
  if (!error) return;
  // Retry a committed post without publishing it twice or deleting its photo.
  const existing = await db
    .from("feed_posts")
    .select("id")
    .eq("id", draft.id)
    .eq("author_id", userId)
    .maybeSingle();
  if (existing.data) return;
  if (photoPath && !existing.error) await bucket.remove([photoPath]);
  if (error.code === "P0002" || error.code === "23503")
    throw new Error("The original post is no longer available.");
  throw new Error("Could not publish your post. Please try again.");
}
export type FeedComment = FeedCursor & { body: string; author_label: string };
export async function myFeedName(): Promise<string> {
  const { data, error } = await client().rpc("my_feed_name");
  if (error) throw new Error("Could not load your profile name.");
  return data ?? "";
}
export async function setFeedLike(postId: string, liked: boolean) {
  const { error } = await client().rpc("set_feed_like", { target: postId, liked });
  if (error) throw new Error("Could not update your reaction. Try again.");
}
export async function loadComments(postId: string, cursor: FeedCursor | null) {
  let q = client()
    .from("community_comments")
    .select("id,created_at,author_label,body")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(21);
  if (cursor)
    q = q.or(
      `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
    );
  const { data, error } = await q;
  if (error) throw new Error("Could not load comments.");
  const rows = (data ?? []).slice(0, 20) as FeedComment[];
  const next: FeedCursor | null = (data?.length ?? 0) > 20 ? rows[19] : null;
  return { rows, next };
}
export async function publishComment(postId: string, id: string, body: string) {
  if (!body.trim() || Array.from(body).length > FEED_CAPTION_LIMIT)
    throw new Error("Use 1–255 characters.");
  const { error } = await client()
    .from("feed_comments")
    .insert({ id, post_id: postId, body: body.trim() });
  // An acknowledged duplicate of this draft UUID is an already-delivered retry.
  if (error && error.code !== "23505") throw new Error("Could not post comment.");
}

export async function deleteFeedPost(id: string) {
  const { error } = await client().functions.invoke("delete-feed-post", { body: { id } });
  // A retry after a lost successful response sees an already absent post.
  if (error && error.context?.status !== 404)
    throw new Error("Could not delete the post. Please try again.");
}
