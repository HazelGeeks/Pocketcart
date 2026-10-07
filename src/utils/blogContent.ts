import type { BlogPost } from "../data/blogPosts";

export type BlogNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: BlogMark[];
  content?: BlogNode[];
};
export type BlogMark = { type: string; attrs?: Record<string, unknown> };
export type BlogDocument = BlogNode & { type: "doc"; content: BlogNode[] };
export const EMPTY_BLOG_DOCUMENT: BlogDocument = { type: "doc", content: [{ type: "paragraph" }] };
export const BLOG_IMAGE_BUCKET = "blog-images";
export const BLOG_IMAGE_LIMIT = 5 * 1024 * 1024;
export const BLOG_FONTS = ["", "Arial", "Georgia", "Verdana", "monospace"] as const;
export const BLOG_FONT_SIZES = [
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
  "40px",
] as const;
export const BLOG_LINE_HEIGHTS = ["1", "1.3", "1.5", "1.7", "2", "2.5", "3"] as const;
const nodeTypes = new Set([
  "doc",
  "paragraph",
  "heading",
  "text",
  "hardBreak",
  "blockquote",
  "bulletList",
  "orderedList",
  "listItem",
  "codeBlock",
  "horizontalRule",
  "image",
  "table",
  "tableRow",
  "tableCell",
  "tableHeader",
]);
const markTypes = new Set(["bold", "italic", "underline", "strike", "code", "link", "textStyle"]);

export function safeBlogUrl(value: unknown, image = false): string | null {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    Array.from(value).some(
      (char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127 || char === "\\",
    )
  )
    return null;
  if (!image && /^\/(?!\/)/.test(value)) return value;
  try {
    const url = new URL(value);
    return (image ? ["https:", "http:"] : ["https:", "http:", "mailto:", "tel:"]).includes(
      url.protocol,
    )
      ? value
      : null;
  } catch {
    return null;
  }
}
export function validBlogImagePath(value: unknown): value is string {
  return (
    typeof value === "string" && /^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(?:jpg|png|webp)$/.test(value)
  );
}
export function sectionsToDocument(sections: BlogPost["sections"]): BlogDocument {
  const content: BlogNode[] = [];
  for (const section of sections) {
    if (section.heading)
      content.push({
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: section.heading }],
      });
    for (const text of section.paragraphs)
      content.push({ type: "paragraph", content: text ? [{ type: "text", text }] : undefined });
  }
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}
export function blogDocument(post: Pick<BlogPost, "content" | "sections">): BlogDocument {
  return post.content ?? sectionsToDocument(post.sections);
}
export function blogText(document: BlogNode): string {
  if (document.type === "text") return document.text ?? "";
  return (document.content ?? [])
    .map(blogText)
    .join(
      ["doc", "listItem", "blockquote", "tableCell", "tableHeader"].includes(document.type)
        ? "\n"
        : "",
    );
}
export function blogHeadings(document: BlogDocument): Array<{ text: string; id: string }> {
  const result: Array<{ text: string; id: string }> = [];
  function visit(node: BlogNode) {
    if (node.type === "heading")
      result.push({ text: blogText(node), id: `article-heading-${result.length}` });
    node.content?.forEach(visit);
  }
  visit(document);
  return result;
}
export function normalizeBlogDocument(document: BlogDocument): BlogDocument {
  function clean(node: BlogNode): BlogNode {
    const attrs = { ...node.attrs };
    if (node.type === "image" && validBlogImagePath(attrs.assetPath)) attrs.src = "";
    const cleaned: BlogNode = { type: node.type };
    if (node.text !== undefined) cleaned.text = node.text;
    if (Object.keys(attrs).length) cleaned.attrs = attrs;
    if (node.marks)
      cleaned.marks = node.marks.map((mark) => ({
        ...mark,
        attrs: mark.attrs ? { ...mark.attrs } : undefined,
      }));
    if (node.content) cleaned.content = node.content.map(clean);
    return cleaned;
  }
  return clean(document) as BlogDocument;
}
export function blogImagePaths(document: BlogDocument, coverPath = ""): string[] {
  const paths = new Set<string>();
  if (validBlogImagePath(coverPath)) paths.add(coverPath);
  function visit(node: BlogNode) {
    if (node.type === "image" && validBlogImagePath(node.attrs?.assetPath))
      paths.add(node.attrs.assetPath);
    node.content?.forEach(visit);
  }
  visit(document);
  return [...paths];
}
export function hydrateBlogImages(
  document: BlogDocument,
  urls: Record<string, string>,
): BlogDocument {
  function hydrate(node: BlogNode): BlogNode {
    return {
      ...node,
      attrs:
        node.type === "image" && validBlogImagePath(node.attrs?.assetPath)
          ? { ...node.attrs, src: urls[node.attrs.assetPath] ?? "" }
          : node.attrs,
      content: node.content?.map(hydrate),
    };
  }
  return hydrate(document) as BlogDocument;
}
export function validateBlogDocument(document: BlogDocument): string | null {
  if (
    document.type !== "doc" ||
    !Array.isArray(document.content) ||
    JSON.stringify(document).length > 200_000
  )
    return "The article body must be a document within 200,000 characters.";
  let count = 0;
  function valid(node: BlogNode, depth: number): boolean {
    if (!node || depth > 30 || ++count > 5000 || !nodeTypes.has(node.type)) return false;
    if (node.text !== undefined && (node.type !== "text" || typeof node.text !== "string"))
      return false;
    if (
      node.content &&
      (!Array.isArray(node.content) || !node.content.every((child) => valid(child, depth + 1)))
    )
      return false;
    if (
      node.type === "image" &&
      !validBlogImagePath(node.attrs?.assetPath) &&
      !safeBlogUrl(node.attrs?.src, true)
    )
      return false;
    if (
      node.marks &&
      (!Array.isArray(node.marks) ||
        !node.marks.every(
          (mark) =>
            markTypes.has(mark.type) && (mark.type !== "link" || !!safeBlogUrl(mark.attrs?.href)),
        ))
    )
      return false;
    return true;
  }
  return valid(document, 0)
    ? null
    : "The article contains unsupported content, an unsafe link, or too many nested blocks.";
}
export function hasBlogBody(document: BlogDocument): boolean {
  return (
    !!blogText(document).trim() ||
    blogImagePaths(document).length > 0 ||
    document.content.some((n) => n.type === "image" && !!safeBlogUrl(n.attrs?.src, true))
  );
}
export function documentToSections(document: BlogDocument): BlogPost["sections"] {
  const sections: BlogPost["sections"] = [];
  let section = { heading: "", paragraphs: [] as string[] };
  for (const node of document.content) {
    if (node.type === "heading") {
      if (section.heading || section.paragraphs.length) sections.push(section);
      section = { heading: blogText(node), paragraphs: [] };
    } else {
      const text = blogText(node).trim();
      if (text) section.paragraphs.push(text);
    }
  }
  if (section.heading || section.paragraphs.length) sections.push(section);
  return sections;
}
