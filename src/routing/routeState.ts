import type { Route } from "../constants/palette";

export type RouteState = {
  route: Route;
  blogSlug: string | null;
};

export function locationToRoute(pathname: string, hash: string): RouteState {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path.startsWith("/blog/")) {
    const blogSlug = path.slice("/blog/".length).replace(/\/+$/, "");
    if (blogSlug) {
      return { route: "blog", blogSlug: decodeURIComponent(blogSlug) };
    }
  }

  if (path === "/delete-account" || hash === "#/delete-account") {
    return { route: "delete-account", blogSlug: null };
  }
  if (path === "/blog" || hash === "#/blog") {
    return { route: "blog", blogSlug: null };
  }
  if (path === "/privacy" || hash === "#/privacy") {
    return { route: "privacy", blogSlug: null };
  }
  if (path === "/terms" || hash === "#/terms") {
    return { route: "terms", blogSlug: null };
  }

  return { route: "home", blogSlug: null };
}

export function buildPath(route: Route, blogSlug?: string | null): string {
  if (route === "blog" && blogSlug) {
    return `/blog/${encodeURIComponent(blogSlug)}`;
  }
  return route === "home" ? "/" : `/${route}`;
}
