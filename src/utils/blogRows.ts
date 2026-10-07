import type { BlogPost } from "../data/blogPosts";
import type { Locale } from "../i18n/types";
import type { BlogStatus, ManagedBlogPost } from "./blogEditor";

export type BlogRow = {
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

export function fromRow(row: BlogRow): ManagedBlogPost {
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
