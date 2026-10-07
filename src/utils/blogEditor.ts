import type { BlogPost } from "../data/blogPosts";
import type { Locale } from "../i18n/types";
import {
  blogDocument,
  blogText,
  hasBlogBody,
  validateBlogDocument,
  normalizeBlogDocument,
  documentToSections,
  validBlogImagePath,
} from "./blogContent";
import { formatBusinessDate } from "./businessDateTime";

export type BlogStatus = "draft" | "published" | "scheduled";
export type BlogDraft = BlogPost & { locale: Locale };
export type ManagedBlogPost = BlogDraft & {
  id: string;
  status: BlogStatus;
  updatedAt: string;
};

export function blogSlug(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/, "");
}

export function validateBlogDraft(draft: BlogDraft, status: BlogStatus): string | null {
  if (!draft.title.trim() || draft.title.length > 200) return "Enter a title of 1–200 characters.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug) || draft.slug.length > 120)
    return "Use a URL slug of up to 120 lowercase letters, numbers, and single hyphens.";
  if (draft.locale !== "en" && draft.locale !== "fr") return "Choose English or French.";
  if (draft.description.length > 500 || draft.excerpt.length > 500)
    return "Keep the description and excerpt within 500 characters each.";
  if (!Number.isInteger(draft.readMinutes) || draft.readMinutes < 1 || draft.readMinutes > 60)
    return "Reading time must be between 1 and 60 minutes.";
  const date = new Date(`${draft.publishedAt}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(draft.publishedAt) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== draft.publishedAt
  )
    return "Choose a valid article date.";
  if (draft.sections.length > 30 || JSON.stringify(draft.sections).length > 200_000)
    return "Keep the article within 30 sections and 200,000 characters.";
  for (const section of draft.sections) {
    if (
      section.heading.length > 200 ||
      section.paragraphs.length > 100 ||
      section.paragraphs.some((p) => p.length > 20_000)
    )
      return "A section can contain a 200-character heading and up to 100 paragraphs of 20,000 characters each.";
  }
  if (draft.content) {
    const contentIssue = validateBlogDocument(draft.content);
    if (contentIssue) return contentIssue;
  }
  if (
    (draft.category?.length ?? 0) > 80 ||
    (draft.authorName?.length ?? 0) > 200 ||
    (draft.coverImageAlt?.length ?? 0) > 500
  )
    return "Keep category within 80 characters, author within 200, and image alt text within 500.";
  if (draft.coverImagePath && !validBlogImagePath(draft.coverImagePath))
    return "The cover image is invalid. Upload it again.";
  if (draft.publishAt && Number.isNaN(new Date(draft.publishAt).getTime()))
    return "Choose a valid publication time.";
  if (status === "scheduled" && !draft.publishAt)
    return "Choose a publication time for a scheduled article.";
  if (
    status !== "draft" &&
    (!draft.description.trim() ||
      !draft.excerpt.trim() ||
      (draft.content
        ? !hasBlogBody(draft.content)
        : !draft.sections.length ||
          draft.sections.some(
            (s) => !s.heading.trim() || !s.paragraphs.length || s.paragraphs.some((p) => !p.trim()),
          )))
  )
    return "Add a description, excerpt, and at least one section with a heading and paragraph before publishing.";
  return null;
}

export function blogPayload(draft: BlogDraft, status: BlogStatus) {
  const content = normalizeBlogDocument(blogDocument(draft));
  const text = blogText(content).trim().replace(/\s+/g, " ");
  const effectiveStatus =
    status === "published" && draft.publishAt && new Date(draft.publishAt).getTime() > Date.now()
      ? "scheduled"
      : status;
  const normalized = {
    ...draft,
    slug: draft.slug.trim(),
    title: draft.title.trim(),
    description:
      draft.description.trim() || (draft.content ? (text || draft.title).slice(0, 500) : ""),
    excerpt: draft.excerpt.trim() || (draft.content ? (text || draft.title).slice(0, 240) : ""),
    sections: draft.content
      ? documentToSections(content)
      : draft.sections.map((section) => ({
          heading: section.heading.trim(),
          paragraphs: section.paragraphs.map((p) => p.trim()).filter(Boolean),
        })),
  };
  const issue = validateBlogDraft(normalized, effectiveStatus);
  if (issue) throw new Error(issue);
  return {
    slug: normalized.slug,
    locale: normalized.locale,
    status: effectiveStatus,
    title: normalized.title,
    description: normalized.description,
    excerpt: normalized.excerpt,
    published_on: draft.publishAt ? formatBusinessDate(draft.publishAt) : normalized.publishedAt,
    read_minutes: normalized.readMinutes,
    sections: normalized.sections,
    content,
    category: draft.category?.trim() || "Shopping tips",
    author_name: draft.authorName?.trim() || "Pocketcart",
    cover_image_path: draft.coverImagePath || null,
    cover_image_alt: draft.coverImageAlt?.trim() || "",
    publish_at: draft.publishAt || null,
    is_pinned: draft.isPinned ?? false,
  };
}

export function blogIsPublic(
  post: { status: BlogStatus; publishAt?: string | null },
  now = Date.now(),
): boolean {
  return post.status !== "draft" && (!post.publishAt || new Date(post.publishAt).getTime() <= now);
}

export function localPublishInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseLocalPublishInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || localPublishInput(date.toISOString()) !== value)
    throw new Error("Choose a valid publication time in your local time zone.");
  return date.toISOString();
}

export function localizedBlogPosts(
  posts: Array<BlogPost & { locale: Locale }>,
  locale: Locale,
): BlogPost[] {
  const bySlug = new Map<string, BlogPost & { locale: Locale }>();
  for (const post of posts) {
    if (post.locale !== locale && post.locale !== "en") continue;
    const current = bySlug.get(post.slug);
    if (!current || post.locale === locale) bySlug.set(post.slug, post);
  }
  return [...bySlug.values()].sort(
    (a, b) =>
      Number(!!b.isPinned) - Number(!!a.isPinned) ||
      b.publishedAt.localeCompare(a.publishedAt) ||
      a.slug.localeCompare(b.slug),
  );
}
