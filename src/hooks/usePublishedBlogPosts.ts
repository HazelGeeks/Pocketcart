import { useQuery } from "@tanstack/react-query";
import type { Locale } from "../i18n/types";
import { listPublishedBlogPosts } from "../services/blog";

export default function usePublishedBlogPosts(locale: Locale, enabled = true) {
  return useQuery({
    queryKey: ["blog", "published", locale],
    queryFn: () => listPublishedBlogPosts(locale),
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
