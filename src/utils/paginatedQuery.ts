export async function collectPagedRows<T, E>(
  fetchPage: (
    from: number,
    to: number,
  ) => Promise<{ data: T[] | null; error: E | null }>,
  pageSize = 1000,
): Promise<{ data: T[]; error: E | null }> {
  const rows: T[] = [];
  const safePageSize = Math.max(1, Math.floor(pageSize));

  for (let from = 0; ; from += safePageSize) {
    const { data, error } = await fetchPage(from, from + safePageSize - 1);
    if (error) return { data: [], error };

    const page = data ?? [];
    rows.push(...page);
    if (page.length < safePageSize) break;
  }

  return { data: rows, error: null };
}
