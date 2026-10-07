import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listAdminBlogPosts, saveBlogPost } from "../services/blog";
import { uploadBlogImage } from "../services/blogImages";
import { EMPTY_BLOG_DOCUMENT, blogDocument, type BlogDocument } from "../utils/blogContent";
import { formatBusinessDate } from "../utils/businessDateTime";
import {
  blogSlug,
  type BlogDraft,
  type BlogStatus,
  type ManagedBlogPost,
} from "../utils/blogEditor";

export function emptyBlogDraft(): BlogDraft {
  return {
    slug: "",
    locale: "en",
    title: "",
    description: "",
    excerpt: "",
    publishedAt: formatBusinessDate(new Date().toISOString()),
    readMinutes: 5,
    sections: [],
    content: EMPTY_BLOG_DOCUMENT,
    category: "Shopping tips",
    authorName: "Pocketcart",
    coverImagePath: "",
    coverImageAlt: "",
    publishAt: null,
    isPinned: false,
    imageUrls: {},
  };
}

export default function useAdminBlogEditor(active: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "blog"],
    queryFn: listAdminBlogPosts,
    enabled: active,
    staleTime: 30_000,
  });
  const [draft, setDraft] = useState<BlogDraft>(emptyBlogDraft);
  const [existing, setExisting] = useState<ManagedBlogPost | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0);
  const uploadCount = useRef(0);
  const [editorStatus, setEditorStatus] = useState<BlogStatus>("draft");
  const [documentKey, setDocumentKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const protect = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [dirty]);

  function edit(next: Partial<BlogDraft>) {
    setDraft((current) => ({ ...current, ...next }));
    setDirty(true);
    setNotice("");
  }
  function open(post: ManagedBlogPost | null) {
    if (lock.current || uploadCount.current) return false;
    if (dirty && !window.confirm("Discard the unsaved changes to this article?")) return false;
    setExisting(post);
    setEditorStatus(post?.status ?? "draft");
    setDocumentKey((key) => key + 1);
    setDraft(
      post
        ? {
            ...post,
            content: blogDocument(post),
            category: post.category ?? "Shopping tips",
            authorName: post.authorName ?? "Pocketcart",
            sections: post.sections.map((s) => ({ ...s, paragraphs: [...s.paragraphs] })),
          }
        : emptyBlogDraft(),
    );
    setDirty(false);
    setPreview(false);
    setNotice("");
    return true;
  }
  async function save(status: BlogStatus) {
    if (lock.current || uploadCount.current) return;
    lock.current = true;
    setBusy(true);
    setNotice("");
    try {
      const publishImmediately =
        status === "published" &&
        !draft.publishAt &&
        (!existing || (existing.publishAt && new Date(existing.publishAt).getTime() > Date.now()));
      const normalized = {
        ...draft,
        slug: draft.slug || blogSlug(draft.title),
        publishedAt: publishImmediately
          ? formatBusinessDate(new Date().toISOString())
          : draft.publishedAt,
      };
      const saved = await saveBlogPost(normalized, status, existing);
      if (mounted.current) {
        setExisting(saved);
        setEditorStatus(saved.status);
        setDraft(saved);
        setDirty(false);
        setNotice(
          saved.status === "scheduled"
            ? "Article scheduled. It becomes public at the publication time."
            : saved.status === "published"
              ? "Article published. Changes are now visible on the blog."
              : "Draft saved. This article is not public.",
        );
      }
      queryClient.setQueryData<ManagedBlogPost[]>(["admin", "blog"], (current) => [
        saved,
        ...(current ?? []).filter((p) => p.id !== saved.id),
      ]);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "blog"] }),
        queryClient.invalidateQueries({ queryKey: ["blog", "published"] }),
      ]);
    } catch (error) {
      if (mounted.current)
        setNotice(
          error instanceof Error
            ? error.message
            : "Unable to save the article. Your text is still here; try again.",
        );
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function uploadImage(file: File) {
    if (lock.current) return null;
    uploadCount.current++;
    setUploads(uploadCount.current);
    setNotice("");
    try {
      const image = await uploadBlogImage(file);
      if (!mounted.current) return null;
      setDraft((current) => ({
        ...current,
        imageUrls: { ...current.imageUrls, [image.path]: image.url },
      }));
      setDirty(true);
      return image;
    } catch (error) {
      if (mounted.current)
        setNotice(error instanceof Error ? error.message : "Unable to upload the image.");
      return null;
    } finally {
      uploadCount.current--;
      if (mounted.current) setUploads(uploadCount.current);
    }
  }
  function changeContent(content: BlogDocument) {
    edit({ content });
  }
  return {
    query,
    editorStatus,
    setEditorStatus: (status: BlogStatus) => {
      setEditorStatus(status);
      setDirty(true);
    },
    documentKey,
    uploads,
    uploadImage,
    changeContent,
    draft,
    existing,
    dirty,
    busy,
    notice,
    preview,
    setPreview,
    edit,
    open,
    save,
  };
}
