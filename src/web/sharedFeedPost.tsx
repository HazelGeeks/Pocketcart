import type { PublicBackend } from "./publishedPosts";
import { BASE_URL } from "./seo";

type SharedPost = {
  author_label: string;
  caption: string;
  product: string | null;
  store: string | null;
  price: number | null;
  photo_path: string | null;
  anonymous_photo: boolean;
};

export async function sharedFeedPost(backend: PublicBackend, id: string) {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return null;
  const headers = { apikey: backend.key, Authorization: "Bearer " + backend.key };
  const url = new URL("/rest/v1/community_feed", backend.url);
  url.searchParams.set("id", "eq." + id);
  url.searchParams.set(
    "select",
    "caption,author_label,product,store,price,photo_path,anonymous_photo",
  );
  const result = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!result.ok) throw new Error("Feed unavailable");
  const [post]: SharedPost[] = await result.json();
  if (!post) return null;
  let photo: string | null = null;
  if (post.anonymous_photo) photo = backend.url + "/functions/v1/feed-photo?id=" + id;
  else if (post.photo_path) {
    const sign = await fetch(
      backend.url + "/storage/v1/object/sign/feed-photos/" + post.photo_path,
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ expiresIn: 900 }),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!sign.ok) throw new Error("Photo unavailable");
    const { signedURL } = await sign.json();
    if (typeof signedURL !== "string" || !signedURL.startsWith("/object/sign/"))
      throw new Error("Photo unavailable");
    photo = backend.url + "/storage/v1" + signedURL;
  }
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>{post.author_label} on PocketCart</title>
        <meta property="og:title" content={post.author_label + " on PocketCart"} />
        <meta
          property="og:description"
          content={post.caption || post.product || "A photo from the PocketCart feed"}
        />
        <link rel="canonical" href={BASE_URL + "/feed/" + id} />
        <style>{`*{box-sizing:border-box}body{margin:0;background:#f5f8f4;color:#102918;font:16px/1.5 system-ui,sans-serif}main{max-width:38rem;margin:6vh auto;padding:1.25rem}a{color:#075e31;font-weight:700}article{margin-top:1rem;background:white;border:1px solid #d9e5dc;border-radius:16px;padding:1.25rem;overflow-wrap:anywhere}h1{font-size:1.1rem;margin:0}p{white-space:pre-wrap}img{display:block;width:100%;height:auto;border-radius:10px}`}</style>
      </head>
      <body>
        <main>
          <a href="/">PocketCart</a>
          <article>
            <h1>{post.author_label}</h1>
            {post.product && (
              <p>
                <strong>{post.product}</strong>
              </p>
            )}
            {(post.store || post.price != null) && (
              <p>
                {[
                  post.store,
                  post.price != null
                    ? new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
                        post.price,
                      )
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {post.caption && <p>{post.caption}</p>}
            {photo && <img src={photo} alt={post.product || "Shared by " + post.author_label} />}
          </article>
        </main>
      </body>
    </html>
  );
}
