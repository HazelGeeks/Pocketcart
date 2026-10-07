import { getBlogPosts, type BlogPost } from "../data/blogPosts";
import { collectPagedRows } from "../utils/paginatedQuery";
import {
  blogPayload,
  localizedBlogPosts,
  blogIsPublic,
  type BlogDraft,
  type BlogStatus,
  type ManagedBlogPost,
} from "../utils/blogEditor";
import type { Locale } from "../i18n/types";
import { hasSupabaseEnv, supabase } from "./supabaseClient";
import { signBlogImages } from "./blogImages";

const LEGACY_SELECT =
  "id,slug,locale,status,title,description,excerpt,published_on,read_minutes,sections,updated_at";
const BLOG_SELECT = `${LEGACY_SELECT},content,category,author_name,cover_image_path,cover_image_alt,publish_at,is_pinned`;
type BlogRow = {
  id: string;
  slug: string;
  locale: Locale;
  status: BlogStatus;
  title: string;
  description: string;
  excerpt: string;
  published_on: string;
  read_minutes: number;
  sections: BlogPost["sections"];
  updated_at: string;
  content?: BlogPost["content"];
  category?: string;
  author_name?: string;
  cover_image_path?: string | null;
  cover_image_alt?: string;
  publish_at?: string | null;
  is_pinned?: boolean;
};
type BlogError = { code?: string; message: string };

function fromRow(row: BlogRow): ManagedBlogPost {
  return {
    id: row.id,
    slug: row.slug,
    locale: row.locale,
    status: row.status,
    title: row.title,
    description: row.description,
    excerpt: row.excerpt,
    publishedAt: row.published_on,
    readMinutes: row.read_minutes,
    sections: row.sections,
    updatedAt: row.updated_at,
    content: row.content,
    category: row.category,
    authorName: row.author_name,
    coverImagePath: row.cover_image_path ?? "",
    coverImageAlt: row.cover_image_alt ?? "",
    publishAt: row.publish_at ?? null,
    isPinned: row.is_pinned ?? false,
  };
}

function missingTable(error: BlogError) {
  return error.code === "PGRST205" || error.code === "42P01";
}
function blogError(error: BlogError): Error {
  if (missingTable(error) || error.code === "42703" || error.code === "PGRST204")
    return new Error(
      "Blog setup is incomplete. Apply both blog migrations before saving articles or uploading images.",
    );
  if (error.code === "23505")
    return new Error(
      "An article with this URL slug and language already exists. Open it from the list or choose another slug.",
    );
  if (error.code === "42501")
    return new Error("Your account does not have permission to edit blog articles.");
  return new Error(error.message);
}

export async function listPublishedBlogPosts(locale: Locale): Promise<BlogPost[]> {
  if (!hasSupabaseEnv || !supabase) return getBlogPosts(locale);
  const client = supabase;
  async function read(table: string, select: string) {
    return collectPagedRows<BlogRow, BlogError>(async (from, to) => {
      let query = client
        .from(table)
        .select(select)
        .in("locale", locale === "fr" ? ["en", "fr"] : ["en"]);
      if (table === "blog_posts") query = query.eq("status", "published");
      const response = await query
        .order("published_on", { ascending: false })
        .order("slug")
        .order("locale")
        .range(from, to);
      return { data: (response.data ?? []) as unknown as BlogRow[], error: response.error };
    });
  }
  let result = await read("published_blog_posts", BLOG_SELECT);
  if (result.error && missingTable(result.error)) result = await read("blog_posts", LEGACY_SELECT);
  // Compatibility is limited to missing migrations. Empty results and outages
  // never restore intentionally unpublished articles.
  if (result.error) {
    if (missingTable(result.error)) return getBlogPosts(locale);
    throw blogError(result.error);
  }
  const posts = result.data.map(fromRow).filter((post) => blogIsPublic(post));
  return signBlogImages(localizedBlogPosts(posts, locale));
}

export async function listAdminBlogPosts(): Promise<ManagedBlogPost[]> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const client = supabase;
  const result = await collectPagedRows<BlogRow, BlogError>(async (from, to) => {
    const response = await client
      .from("blog_posts")
      .select(BLOG_SELECT)
      .order("updated_at", { ascending: false })
      .order("id")
      .range(from, to);
    return { data: (response.data ?? []) as unknown as BlogRow[], error: response.error };
  });
  if (result.error) throw blogError(result.error);
  return signBlogImages(result.data.map(fromRow));
}

export async function saveBlogPost(
  draft: BlogDraft,
  status: BlogStatus,
  existing: ManagedBlogPost | null,
): Promise<ManagedBlogPost> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const payload = blogPayload(draft, status);
  const response = existing
    ? await supabase
        .from("blog_posts")
        .update(payload)
        .eq("id", existing.id)
        .eq("updated_at", existing.updatedAt)
        .select(BLOG_SELECT)
        .maybeSingle()
    : await supabase.from("blog_posts").insert(payload).select(BLOG_SELECT).single();
  if (response.error) throw blogError(response.error);
  if (!response.data)
    throw new Error(
      "This article changed in another session, or your access changed. Refresh the list and reopen it before saving. Your unsaved text is still here.",
    );
  return (await signBlogImages([fromRow(response.data as BlogRow)]))[0];
}
