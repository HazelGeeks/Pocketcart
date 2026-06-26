declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }

  export const env: Env;

  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.106.2" {
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
  };
}
