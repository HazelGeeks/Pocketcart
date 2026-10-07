import { renderToReadableStream } from "react-dom/server.browser";
import BlogDocument, { ErrorDocument, type PublicDocument } from "./BlogDocument";
import { publicBlogPage, publishedMetadata, type PublicBackend } from "./publishedPosts";
import { sitemap } from "./sitemap";

// Replaced at build time with the same public URL/anonymous key as the web app.
declare const __PUBLIC_BACKEND__: PublicBackend;
declare const __PUBLIC_CSS_PATH__: string;

async function html(document: PublicDocument, status: number, method: string) {
  const stream = method === "HEAD" ? null : await renderToReadableStream(document);
  return new Response(stream, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      ...(status !== 200
        ? { "X-Robots-Tag": "noindex", ...(status === 503 ? { "Retry-After": "60" } : {}) }
        : {}),
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!["GET", "HEAD"].includes(request.method))
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    const locale = url.searchParams.get("lang") === "fr" ? "fr" : "en";
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (url.hostname === "www.pocketcart.app") {
      url.hostname = "pocketcart.app";
      return Response.redirect(url.href, 308);
    }
    if (path === "/index.html") {
      url.pathname = "/";
      return Response.redirect(url.href, 308);
    }
    if (path === "/sitemap.xml") {
      try {
        return new Response(
          request.method === "HEAD" ? null : sitemap(await publishedMetadata(__PUBLIC_BACKEND__)),
          {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "no-store",
            },
          },
        );
      } catch {
        console.error(JSON.stringify({ event: "public_sitemap_unavailable" }));
        return new Response("Sitemap temporarily unavailable", {
          status: 503,
          headers: { "Retry-After": "60", "Cache-Control": "no-store" },
        });
      }
    }
    if (path === "/blog" || path.startsWith("/blog/")) {
      const slug = path === "/blog" ? null : path.slice(6);
      if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
        return html(
          <ErrorDocument status={404} locale={locale} cssPath={__PUBLIC_CSS_PATH__} />,
          404,
          request.method,
        );
      try {
        const data = await publicBlogPage(__PUBLIC_BACKEND__, locale, slug);
        if (data.fallbackToEnglish) {
          url.searchParams.set("lang", "en");
          return Response.redirect(url.href, 302);
        }
        return html(
          <BlogDocument
            {...data}
            locale={locale}
            slug={slug}
            cssPath={__PUBLIC_CSS_PATH__}
            status={data.found ? 200 : 404}
          />,
          data.found ? 200 : 404,
          request.method,
        );
      } catch {
        console.error(JSON.stringify({ event: "public_blog_unavailable" }));
        return html(
          <BlogDocument
            posts={[]}
            alternates={[]}
            locale={locale}
            slug={slug}
            cssPath={__PUBLIC_CSS_PATH__}
            status={503}
          />,
          503,
          request.method,
        );
      }
    }
    if (["/", "/admin", "/support", "/privacy", "/terms", "/delete-account"].includes(path)) {
      const staticPage = ["/", "/support", "/privacy", "/terms"].includes(path);
      const shellUrl = new URL(
        staticPage
          ? `/rendered/${locale}/${path === "/" ? "home" : path.slice(1)}.html`
          : "/index.html",
        url,
      );
      const shell = await env.ASSETS.fetch(new Request(shellUrl, request));
      const headers = new Headers(shell.headers);
      headers.set("Cache-Control", "no-cache");
      if (path === "/admin" || path === "/delete-account")
        headers.set("X-Robots-Tag", "noindex, nofollow");
      return new Response(request.method === "HEAD" ? null : shell.body, {
        status: shell.status,
        headers,
      });
    }
    const renderedPath = path.match(
      /^\/rendered\/(en|fr)\/(home|support|privacy|terms)(?:\.html)?$/,
    );
    if (renderedPath) {
      const target = new URL(renderedPath[2] === "home" ? "/" : `/${renderedPath[2]}`, url);
      if (renderedPath[1] === "fr") target.searchParams.set("lang", "fr");
      return Response.redirect(target.href, 308);
    }
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) return asset;
    if (path.includes(".") || path.startsWith("/_expo/")) return asset;
    return html(
      <ErrorDocument status={404} locale={locale} cssPath={__PUBLIC_CSS_PATH__} />,
      404,
      request.method,
    );
  },
} satisfies ExportedHandler<Env>;
