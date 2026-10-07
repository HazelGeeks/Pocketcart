import {
  BLOG_IMAGE_BUCKET,
  BLOG_IMAGE_LIMIT,
  blogImagePaths,
  blogDocument,
} from "../utils/blogContent";
import type { BlogPost } from "../data/blogPosts";
import { supabase } from "./supabaseClient";

export async function signBlogImages<T extends BlogPost>(posts: T[]): Promise<T[]> {
  const paths = [
    ...new Set(posts.flatMap((post) => blogImagePaths(blogDocument(post), post.coverImagePath))),
  ];
  if (!supabase || !paths.length) return posts;
  const { data, error } = await supabase.storage
    .from(BLOG_IMAGE_BUCKET)
    .createSignedUrls(paths, 3600);
  if (error)
    throw new Error(
      "Unable to load article images. Check the blog image storage setup and try again.",
    );
  const urls: Record<string, string> = {};
  for (const image of data ?? [])
    if (image.path && image.signedUrl && !image.error) urls[image.path] = image.signedUrl;
  return posts.map((post) => ({ ...post, imageUrls: urls }));
}

export async function uploadBlogImage(file: File): Promise<{ path: string; url: string }> {
  if (!supabase) throw new Error("Supabase is not configured.");
  if (!file.size || file.size > BLOG_IMAGE_LIMIT)
    throw new Error("Choose a JPG, PNG, or WebP image of up to 5 MB.");
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp =
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  const extension =
    png && file.type === "image/png"
      ? "png"
      : jpg && file.type === "image/jpeg"
        ? "jpg"
        : webp && file.type === "image/webp"
          ? "webp"
          : null;
  if (!extension) throw new Error("Choose a valid JPG, PNG, or WebP image.");
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user)
    throw new Error("Sign in as an administrator before uploading images.");
  const path = `${auth.user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(BLOG_IMAGE_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type, cacheControl: "3600" });
  if (error)
    throw new Error(
      "Unable to upload the image. Check your connection and the blog image storage setup.",
    );
  const { data, error: signingError } = await supabase.storage
    .from(BLOG_IMAGE_BUCKET)
    .createSignedUrl(path, 3600);
  if (signingError || !data?.signedUrl)
    throw new Error(
      "The image was uploaded but its preview could not be loaded. Try uploading again.",
    );
  return { path, url: data.signedUrl };
}
