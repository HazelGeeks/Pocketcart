import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { missingEnvResult } from "./shared";
import type { AdminAuditLog, AuditLogRow, ServiceResult } from "./types";

const AUDIT_SELECT = "id, actor_user_id, actor_email, action, entity_type, entity_id, summary, metadata, created_at";

function auditLogFromRow(row: AuditLogRow): AdminAuditLog {
  return {
    id: row.id,
    actor_user_id: row.actor_user_id,
    actor_email: row.actor_email,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    summary: row.summary,
    metadata: row.metadata ?? {},
    created_at: row.created_at,
  };
}

export async function listAdminAuditLogs(limit = 50): Promise<ServiceResult<AdminAuditLog[]>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult([]);

  const queryLimit = Math.max(1, Math.min(limit, 200));
  const { data, error } = await supabase
    .from("admin_audit_logs")
    .select(AUDIT_SELECT)
    .order("created_at", { ascending: false })
    .limit(queryLimit);

  if (error) {
    const text = error.message.toLowerCase();
    if (text.includes("admin_audit_logs") || text.includes("does not exist")) {
      return { data: [], error: null };
    }
    return { data: [], error: error.message };
  }

  return { data: ((data ?? []) as AuditLogRow[]).map(auditLogFromRow), error: null };
}

export async function createAdminAuditLog(params: {
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}): Promise<ServiceResult<AdminAuditLog | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) return { data: null, error: userError.message };
  if (!user) return { data: null, error: "Signed-in admin user is required." };

  const payload = {
    actor_user_id: user.id,
    actor_email: user.email ?? null,
    action: params.action.trim(),
    entity_type: params.entityType.trim(),
    entity_id: params.entityId?.trim() ? params.entityId.trim() : null,
    summary: params.summary.trim(),
    metadata: params.metadata ?? {},
  };

  const { data, error } = await supabase
    .from("admin_audit_logs")
    .insert(payload)
    .select(AUDIT_SELECT)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: auditLogFromRow(data as AuditLogRow), error: null };
}
