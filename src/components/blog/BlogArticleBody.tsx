import type { CSSProperties, ReactNode } from "react";
import {
  blogDocument,
  safeBlogUrl,
  validBlogImagePath,
  type BlogNode,
} from "../../utils/blogContent";
import type { BlogPost } from "../../data/blogPosts";
import "./blogArticleBody.css";

function style(attrs: Record<string, unknown> = {}): CSSProperties {
  const result: CSSProperties = {};
  if (["left", "center", "right", "justify"].includes(String(attrs.textAlign)))
    result.textAlign = attrs.textAlign as CSSProperties["textAlign"];
  if (["Arial", "Georgia", "Verdana", "monospace"].includes(String(attrs.fontFamily)))
    result.fontFamily = String(attrs.fontFamily);
  if (/^(?:[89]|[1-7][0-9]|80)px$/.test(String(attrs.fontSize)))
    result.fontSize = String(attrs.fontSize);
  if (/^[1-3](?:\.\d)?$/.test(String(attrs.lineHeight)))
    result.lineHeight = String(attrs.lineHeight);
  if (/^#[\da-f]{3,8}$/i.test(String(attrs.color))) result.color = String(attrs.color);
  if (/^#[\da-f]{3,8}$/i.test(String(attrs.backgroundColor)))
    result.backgroundColor = String(attrs.backgroundColor);
  return result;
}
export default function BlogArticleBody({
  post,
}: {
  post: Pick<BlogPost, "content" | "sections" | "imageUrls">;
}) {
  let heading = 0;
  function render(node: BlogNode, key: string): ReactNode {
    if (node.type === "text") {
      let text: ReactNode = node.text ?? "";
      for (const [i, mark] of (node.marks ?? []).entries()) {
        const markKey = `${key}-mark-${i}`;
        if (mark.type === "bold") text = <strong key={markKey}>{text}</strong>;
        if (mark.type === "italic") text = <em key={markKey}>{text}</em>;
        if (mark.type === "underline") text = <u key={markKey}>{text}</u>;
        if (mark.type === "strike") text = <s key={markKey}>{text}</s>;
        if (mark.type === "code") text = <code key={markKey}>{text}</code>;
        if (mark.type === "textStyle")
          text = (
            <span key={markKey} style={style(mark.attrs)}>
              {text}
            </span>
          );
        const href = mark.type === "link" ? safeBlogUrl(mark.attrs?.href) : null;
        if (href)
          text = (
            <a key={markKey} href={href} rel="noopener noreferrer">
              {text}
            </a>
          );
      }
      return <span key={key}>{text}</span>;
    }
    // Heading numbering follows document order, including headings inside lists/tables.
    const id = node.type === "heading" ? `article-heading-${heading++}` : undefined;
    const children = node.content?.map((child, i) => render(child, `${key}-${i}`));
    const attributes = { key, style: style(node.attrs) };
    switch (node.type) {
      case "doc":
        return (
          <div className="pc-blog-body" key={key}>
            {children}
          </div>
        );
      case "paragraph":
        return <p {...attributes}>{children ?? <br />}</p>;
      case "heading": {
        const level = Math.min(6, Math.max(2, Number(node.attrs?.level) || 2));
        if (level === 2)
          return (
            <h2 {...attributes} id={id}>
              {children}
            </h2>
          );
        if (level === 3)
          return (
            <h3 {...attributes} id={id}>
              {children}
            </h3>
          );
        if (level === 4)
          return (
            <h4 {...attributes} id={id}>
              {children}
            </h4>
          );
        if (level === 5)
          return (
            <h5 {...attributes} id={id}>
              {children}
            </h5>
          );
        return (
          <h6 {...attributes} id={id}>
            {children}
          </h6>
        );
      }
      case "hardBreak":
        return <br key={key} />;
      case "horizontalRule":
        return <hr key={key} />;
      case "blockquote":
        return <blockquote key={key}>{children}</blockquote>;
      case "bulletList":
        return <ul key={key}>{children}</ul>;
      case "orderedList":
        return (
          <ol key={key} start={Math.max(1, Math.min(10000, Number(node.attrs?.start) || 1))}>
            {children}
          </ol>
        );
      case "listItem":
        return <li key={key}>{children}</li>;
      case "codeBlock":
        return (
          <pre key={key}>
            <code>{children}</code>
          </pre>
        );
      case "table":
        return (
          <div className="pc-blog-table" key={key}>
            <table>
              <tbody>{children}</tbody>
            </table>
          </div>
        );
      case "tableRow":
        return <tr key={key}>{children}</tr>;
      case "tableCell":
      case "tableHeader": {
        const span = {
          colSpan: Math.max(1, Math.min(100, Number(node.attrs?.colspan) || 1)),
          rowSpan: Math.max(1, Math.min(100, Number(node.attrs?.rowspan) || 1)),
        };
        return node.type === "tableHeader" ? (
          <th key={key} {...span}>
            {children}
          </th>
        ) : (
          <td key={key} {...span}>
            {children}
          </td>
        );
      }
      case "image": {
        const source = validBlogImagePath(node.attrs?.assetPath)
          ? post.imageUrls?.[node.attrs.assetPath]
          : safeBlogUrl(node.attrs?.src, true);
        return source ? (
          <figure key={key}>
            <img
              src={source}
              alt={String(node.attrs?.alt ?? "")}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </figure>
        ) : (
          <p key={key} className="pc-blog-image-unavailable">
            {String(node.attrs?.alt || "Image unavailable")}
          </p>
        );
      }
      default:
        return null;
    }
  }
  return render(blogDocument(post), "body");
}
