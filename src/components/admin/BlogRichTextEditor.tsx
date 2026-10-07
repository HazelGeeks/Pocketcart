import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor, JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { TableKit } from "@tiptap/extension-table";
import Bold from "lucide-react-native/icons/bold";
import Italic from "lucide-react-native/icons/italic";
import Underline from "lucide-react-native/icons/underline";
import Strikethrough from "lucide-react-native/icons/strikethrough";
import Code from "lucide-react-native/icons/code";
import CodeXml from "lucide-react-native/icons/code-xml";
import AlignLeft from "lucide-react-native/icons/text-align-start";
import AlignCenter from "lucide-react-native/icons/text-align-center";
import AlignRight from "lucide-react-native/icons/text-align-end";
import AlignJustify from "lucide-react-native/icons/text-align-justify";
import List from "lucide-react-native/icons/list";
import ListOrdered from "lucide-react-native/icons/list-ordered";
import Quote from "lucide-react-native/icons/quote";
import Minus from "lucide-react-native/icons/minus";
import Link from "lucide-react-native/icons/link";
import ImagePlus from "lucide-react-native/icons/image-plus";
import ImageIcon from "lucide-react-native/icons/image";
import Table from "lucide-react-native/icons/table";
import Eraser from "lucide-react-native/icons/eraser";
import Undo2 from "lucide-react-native/icons/undo-2";
import Redo2 from "lucide-react-native/icons/redo-2";
import Type from "lucide-react-native/icons/type";
import Highlighter from "lucide-react-native/icons/highlighter";
import {
  BLOG_FONTS,
  BLOG_FONT_SIZES,
  BLOG_LINE_HEIGHTS,
  hydrateBlogImages,
  safeBlogUrl,
  type BlogDocument,
} from "../../utils/blogContent";

const ArticleImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      assetPath: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-blog-asset"),
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.assetPath ? { "data-blog-asset": attrs.assetPath } : {},
      },
    };
  },
});
type Props = {
  value: BlogDocument;
  imageUrls: Record<string, string>;
  disabled: boolean;
  onChange: (value: BlogDocument) => void;
  onUpload: (file: File) => Promise<{ path: string; url: string } | null>;
};
export default function BlogRichTextEditor({
  value,
  imageUrls,
  disabled,
  onChange,
  onUpload,
}: Props) {
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const uploadRef = useRef(onUpload);
  uploadRef.current = onUpload;
  const fileRef = useRef<HTMLInputElement>(null);
  const urlInput = useRef<HTMLInputElement>(null);
  const [dialog, setDialog] = useState<"link" | "image" | null>(null);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [issue, setIssue] = useState("");
  const [uploading, setUploading] = useState(false);
  const uploadLock = useRef(false);

  async function insertFiles(files: File[], target: Editor, position?: number) {
    if (uploadLock.current || target.isDestroyed) return;
    uploadLock.current = true;
    setUploading(true);
    setIssue("");
    try {
      let at = position;
      for (const file of files) {
        const image = await uploadRef.current(file);
        if (!image || target.isDestroyed) continue;
        const node: JSONContent = {
          type: "image",
          attrs: {
            src: image.url,
            assetPath: image.path,
            alt: file.name === "image.png" ? "" : file.name.replace(/\.[^.]+$/, ""),
          },
        };
        if (at !== undefined) {
          target.chain().focus().insertContentAt(at, node).run();
          at = target.state.selection.to;
        } else target.chain().focus().insertContent(node).run();
      }
    } finally {
      uploadLock.current = false;
      setUploading(false);
    }
  }
  const editor: Editor | null = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          isAllowedUri: (url) => !!safeBlogUrl(url),
        },
      }),
      TextStyleKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ArticleImage.configure({ allowBase64: false }),
      TableKit.configure({ table: { resizable: true } }),
      Placeholder.configure({ placeholder: "Write your article or paste an image…" }),
    ],
    content: hydrateBlogImages(value, imageUrls),
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor }) => changeRef.current(editor.getJSON() as BlogDocument),
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": "Article body",
        "aria-multiline": "true",
        spellcheck: "true",
      },
      handlePaste: (view, event) => {
        const files = Array.from(event.clipboardData?.items ?? [])
          .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
          .map((item) => item.getAsFile())
          .filter((file): file is File => !!file);
        if (!files.length || !editor) return false;
        event.preventDefault();
        void insertFiles(files, editor, view.state.selection.from);
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((file) =>
          file.type.startsWith("image/"),
        );
        if (moved || !files.length || !editor) return false;
        event.preventDefault();
        const position = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        void insertFiles(files, editor, position);
        return true;
      },
    },
  });
  useEffect(() => {
    if (dialog) urlInput.current?.focus();
  }, [dialog]);
  useEffect(() => {
    editor?.setEditable(!disabled && !uploading, false);
  }, [editor, disabled, uploading]);
  useEffect(() => {
    if (!editor) return;
    const hydrated = hydrateBlogImages(value, imageUrls);
    if (!editor.state.doc.eq(editor.schema.nodeFromJSON(hydrated)))
      editor.commands.setContent(hydrated, { emitUpdate: false });
  }, [editor, value, imageUrls]);
  if (!editor)
    return (
      <div className="pc-rich-editor-loading" role="status">
        Loading editor…
      </div>
    );
  const locked = disabled || uploading;
  const commandButton = (
    label: string,
    icon: React.ReactNode,
    action: () => void,
    active = false,
    unavailable = false,
  ) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={locked || unavailable}
      className={`pc-rich-tool${active ? " is-active" : ""}`}
      onMouseDown={(event) => event.preventDefault()}
      onClick={action}
    >
      {icon}
    </button>
  );
  function openUrl(kind: "link" | "image") {
    setDialog(kind);
    setUrl(kind === "link" ? String(editor?.getAttributes("link").href ?? "") : "");
    setAlt("");
    setIssue("");
  }
  function insertUrl() {
    const href = safeBlogUrl(url.trim(), dialog === "image");
    if (!href || !editor) {
      setIssue("Enter a valid URL. Image URLs must start with https:// or http://.");
      return;
    }
    if (dialog === "image") editor.chain().focus().setImage({ src: href, alt }).run();
    else if (editor.state.selection.empty)
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] })
        .run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setDialog(null);
    setIssue("");
  }
  const iconProps = { size: 16, color: "#677583", strokeWidth: 1.6 };
  return (
    <div className="pc-rich-editor-wrap">
      <div className="pc-rich-editor-label">
        <span>Body</span>
        <span>{editor.getText().length.toLocaleString()} characters</span>
      </div>
      <div className="pc-rich-editor">
        <div className="pc-rich-toolbar" role="toolbar" aria-label="Text formatting">
          <select
            aria-label="Text style"
            disabled={locked}
            value={
              editor.isActive("heading")
                ? String(editor.getAttributes("heading").level)
                : "paragraph"
            }
            onChange={(event) =>
              event.target.value === "paragraph"
                ? editor.chain().focus().setParagraph().run()
                : editor
                    .chain()
                    .focus()
                    .toggleHeading({ level: Number(event.target.value) as 2 | 3 | 4 })
                    .run()
            }
          >
            <option value="paragraph">Paragraph</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option value="4">Heading 4</option>
          </select>
          <select
            aria-label="Font family"
            disabled={locked}
            value={editor.getAttributes("textStyle").fontFamily ?? ""}
            onChange={(event) =>
              event.target.value
                ? editor.chain().focus().setFontFamily(event.target.value).run()
                : editor.chain().focus().unsetFontFamily().run()
            }
          >
            {BLOG_FONTS.map((font) => (
              <option key={font} value={font}>
                {font || "Default font"}
              </option>
            ))}
          </select>
          <select
            aria-label="Font size"
            disabled={locked}
            value={editor.getAttributes("textStyle").fontSize ?? "16px"}
            onChange={(event) => editor.chain().focus().setFontSize(event.target.value).run()}
          >
            {BLOG_FONT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size.replace("px", "")}
              </option>
            ))}
          </select>
          <select
            aria-label="Line height"
            disabled={locked}
            value={editor.getAttributes("textStyle").lineHeight ?? "1.7"}
            onChange={(event) => editor.chain().focus().setLineHeight(event.target.value).run()}
          >
            {BLOG_LINE_HEIGHTS.map((height) => (
              <option key={height} value={height}>
                Line {height}
              </option>
            ))}
          </select>
          <span className="pc-rich-divider" />
          {commandButton(
            "Bold",
            <Bold {...iconProps} />,
            () => editor.chain().focus().toggleBold().run(),
            editor.isActive("bold"),
          )}
          {commandButton(
            "Italic",
            <Italic {...iconProps} />,
            () => editor.chain().focus().toggleItalic().run(),
            editor.isActive("italic"),
          )}
          {commandButton(
            "Underline",
            <Underline {...iconProps} />,
            () => editor.chain().focus().toggleUnderline().run(),
            editor.isActive("underline"),
          )}
          {commandButton(
            "Strikethrough",
            <Strikethrough {...iconProps} />,
            () => editor.chain().focus().toggleStrike().run(),
            editor.isActive("strike"),
          )}
          {commandButton(
            "Inline code",
            <Code {...iconProps} />,
            () => editor.chain().focus().toggleCode().run(),
            editor.isActive("code"),
          )}
          {commandButton(
            "Code block",
            <CodeXml {...iconProps} />,
            () => editor.chain().focus().toggleCodeBlock().run(),
            editor.isActive("codeBlock"),
          )}
          <label className="pc-rich-color" title="Text color">
            <Type {...iconProps} />
            <input
              type="color"
              aria-label="Text color"
              disabled={locked}
              value={editor.getAttributes("textStyle").color ?? "#1f2937"}
              onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
            />
          </label>
          <label className="pc-rich-color" title="Highlight color">
            <Highlighter {...iconProps} />
            <input
              type="color"
              aria-label="Highlight color"
              disabled={locked}
              value={editor.getAttributes("textStyle").backgroundColor ?? "#fff3b0"}
              onChange={(event) =>
                editor.chain().focus().setBackgroundColor(event.target.value).run()
              }
            />
          </label>
          <span className="pc-rich-divider" />
          {commandButton(
            "Align left",
            <AlignLeft {...iconProps} />,
            () => editor.chain().focus().setTextAlign("left").run(),
            editor.isActive({ textAlign: "left" }),
          )}
          {commandButton(
            "Align center",
            <AlignCenter {...iconProps} />,
            () => editor.chain().focus().setTextAlign("center").run(),
            editor.isActive({ textAlign: "center" }),
          )}
          {commandButton(
            "Align right",
            <AlignRight {...iconProps} />,
            () => editor.chain().focus().setTextAlign("right").run(),
            editor.isActive({ textAlign: "right" }),
          )}
          {commandButton(
            "Justify",
            <AlignJustify {...iconProps} />,
            () => editor.chain().focus().setTextAlign("justify").run(),
            editor.isActive({ textAlign: "justify" }),
          )}
          {commandButton(
            "Bullet list",
            <List {...iconProps} />,
            () => editor.chain().focus().toggleBulletList().run(),
            editor.isActive("bulletList"),
          )}
          {commandButton(
            "Numbered list",
            <ListOrdered {...iconProps} />,
            () => editor.chain().focus().toggleOrderedList().run(),
            editor.isActive("orderedList"),
          )}
          {commandButton(
            "Quote",
            <Quote {...iconProps} />,
            () => editor.chain().focus().toggleBlockquote().run(),
            editor.isActive("blockquote"),
          )}
          {commandButton("Horizontal rule", <Minus {...iconProps} />, () =>
            editor.chain().focus().setHorizontalRule().run(),
          )}
          <span className="pc-rich-divider" />
          {commandButton(
            "Insert link",
            <Link {...iconProps} />,
            () => openUrl("link"),
            editor.isActive("link"),
          )}
          {commandButton("Upload image", <ImagePlus {...iconProps} />, () =>
            fileRef.current?.click(),
          )}
          {commandButton("Insert image URL", <ImageIcon {...iconProps} />, () => openUrl("image"))}
          {commandButton("Insert table", <Table {...iconProps} />, () =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
          )}
          {commandButton("Clear formatting", <Eraser {...iconProps} />, () =>
            editor.chain().focus().unsetAllMarks().clearNodes().unsetTextAlign().run(),
          )}
          {commandButton(
            "Undo",
            <Undo2 {...iconProps} />,
            () => editor.chain().focus().undo().run(),
            false,
            !editor.can().undo(),
          )}
          {commandButton(
            "Redo",
            <Redo2 {...iconProps} />,
            () => editor.chain().focus().redo().run(),
            false,
            !editor.can().redo(),
          )}
          {editor.isActive("table") ? (
            <select
              aria-label="Table actions"
              disabled={locked}
              value=""
              onChange={(event) => {
                const actions = {
                  addRowBefore: () => editor.chain().focus().addRowBefore().run(),
                  addRowAfter: () => editor.chain().focus().addRowAfter().run(),
                  addColumnBefore: () => editor.chain().focus().addColumnBefore().run(),
                  addColumnAfter: () => editor.chain().focus().addColumnAfter().run(),
                  deleteRow: () => editor.chain().focus().deleteRow().run(),
                  deleteColumn: () => editor.chain().focus().deleteColumn().run(),
                  mergeCells: () => editor.chain().focus().mergeCells().run(),
                  splitCell: () => editor.chain().focus().splitCell().run(),
                  deleteTable: () => editor.chain().focus().deleteTable().run(),
                };
                actions[event.target.value as keyof typeof actions]?.();
              }}
            >
              <option value="">Table actions</option>
              <option value="addRowBefore">Row before</option>
              <option value="addRowAfter">Row after</option>
              <option value="addColumnBefore">Column before</option>
              <option value="addColumnAfter">Column after</option>
              <option value="deleteRow">Delete row</option>
              <option value="deleteColumn">Delete column</option>
              <option value="mergeCells">Merge cells</option>
              <option value="splitCell">Split cell</option>
              <option value="deleteTable">Delete table</option>
            </select>
          ) : null}
        </div>
        {dialog ? (
          <div
            className="pc-rich-dialog"
            role="dialog"
            aria-label={dialog === "link" ? "Insert link" : "Insert image URL"}
          >
            <label>
              URL
              <input ref={urlInput} value={url} onChange={(event) => setUrl(event.target.value)} />
            </label>
            {dialog === "image" ? (
              <label>
                Image alt text
                <input value={alt} onChange={(event) => setAlt(event.target.value)} />
              </label>
            ) : null}
            <button type="button" onClick={insertUrl}>
              Insert
            </button>
            <button
              type="button"
              onClick={() => {
                setDialog(null);
                setIssue("");
              }}
            >
              Cancel
            </button>
          </div>
        ) : null}
        {issue ? (
          <p role="alert" className="pc-rich-editor-issue">
            {issue}
          </p>
        ) : null}
        {uploading ? (
          <p role="status" className="pc-rich-editor-issue">
            Uploading image…
          </p>
        ) : null}
        <EditorContent editor={editor} />
        {editor.isActive("image") ? (
          <label className="pc-rich-image-alt">
            Selected image alt text
            <input
              value={String(editor.getAttributes("image").alt ?? "")}
              disabled={locked}
              maxLength={500}
              onChange={(event) =>
                editor.chain().updateAttributes("image", { alt: event.target.value }).run()
              }
            />
          </label>
        ) : null}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          void insertFiles(files, editor);
        }}
      />
    </div>
  );
}
