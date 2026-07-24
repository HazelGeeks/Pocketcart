declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }

  export const env: Env;

  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.106.2" {
  type SupabaseResult<T = { id?: string }> = {
    data: T | null;
    error: { message: string } | null;
  };

  type SupabaseQueryBuilder<T = { id?: string }> = PromiseLike<SupabaseResult<T>> & {
    select(columns?: string): SupabaseQueryBuilder<T>;
    insert(values: Record<string, unknown> | Array<Record<string, unknown>>): SupabaseQueryBuilder<T>;
    upsert(
      values: Record<string, unknown> | Array<Record<string, unknown>>,
      options?: Record<string, unknown>,
    ): SupabaseQueryBuilder<T>;
    update(values: Record<string, unknown>): SupabaseQueryBuilder<T>;
    delete(): SupabaseQueryBuilder<T>;
    eq(column: string, value: unknown): SupabaseQueryBuilder<T>;
    lte(column: string, value: unknown): SupabaseQueryBuilder<T>;
    in(column: string, values: unknown[]): SupabaseQueryBuilder<T>;
    is(column: string, value: unknown): SupabaseQueryBuilder<T>;
    not(column: string, operator: string, value: unknown): SupabaseQueryBuilder<T>;
    order(column: string, options?: Record<string, unknown>): SupabaseQueryBuilder<T>;
    limit(count: number): SupabaseQueryBuilder<T>;
    range(from: number, to: number): SupabaseQueryBuilder<T>;
    single(): Promise<SupabaseResult<T>>;
    maybeSingle(): Promise<SupabaseResult<T>>;
  };

  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, unknown>,
  ): {
    auth: {
      getUser(token: string): Promise<{
        data: { user: { id: string } | null };
        error: { message: string } | null;
      }>;
      admin: {
        deleteUser(userId: string): Promise<{
          error: { message: string } | null;
        }>;
      };
    };
    from(table: string): SupabaseQueryBuilder;
  };
}
