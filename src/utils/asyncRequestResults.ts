export type AsyncListResult<T> = {
  data: T[];
  error: string | null;
};

export type SettledListResults<T> = {
  data: T[];
  message: string | null;
};

export function settleLatestListResults<T>(
  requestId: number,
  latestRequestId: number,
  results: AsyncListResult<T>[],
): SettledListResults<T> | null {
  if (requestId !== latestRequestId) return null;

  const errors = [...new Set(
    results
      .map((result) => result.error?.trim())
      .filter((error): error is string => Boolean(error)),
  )];

  return {
    data: results.flatMap((result) => result.data),
    message: errors.length > 0 ? errors.join(" ") : null,
  };
}
