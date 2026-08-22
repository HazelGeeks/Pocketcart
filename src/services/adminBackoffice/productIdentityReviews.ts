import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { missingEnvResult } from "./shared";
import type {
  AdminProductIdentityReview,
  ProductIdentityReviewRow,
  ProductMergeResult,
  ServiceResult,
} from "./types";

const REVIEW_SELECT =
  "id, source, row_number, product_id, reason, match_method, candidate_count, candidate_product_ids, payload, status, created_at, resolved_at, resolved_product_id, resolution_action";

function payloadCandidateIds(payload: Record<string, unknown>): string[] {
  const value = payload.candidate_product_ids;
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
}

function reviewFromRow(row: ProductIdentityReviewRow): AdminProductIdentityReview {
  const payload = row.payload ?? {};
  return {
    id: row.id,
    source: row.source,
    row_number: row.row_number,
    product_id: row.product_id,
    reason: row.reason,
    match_method: row.match_method,
    candidate_count: row.candidate_count,
    candidate_product_ids:
      row.candidate_product_ids?.length > 0
        ? row.candidate_product_ids
        : payloadCandidateIds(payload),
    payload,
    status: row.status,
    created_at: row.created_at,
    resolved_at: row.resolved_at,
    resolved_product_id: row.resolved_product_id ?? null,
    resolution_action: row.resolution_action ?? null,
  };
}

function isMissingReviewTable(message: string | undefined): boolean {
  const text = message?.toLowerCase() ?? "";
  return (
    text.includes("product_identity_reviews") &&
    (text.includes("does not exist") ||
      text.includes("could not find") ||
      text.includes("schema cache"))
  );
}

function reviewKey(params: {
  reason: string;
  productId?: string;
  payload: Record<string, unknown>;
}): string {
  const value = (key: string) => {
    const item = params.payload[key];
    return typeof item === "string" ? item.trim().toLowerCase() : "";
  };

  return JSON.stringify([
    params.reason.trim().toLowerCase(),
    params.productId?.trim().toLowerCase() ?? "",
    value("supplied_product_id"),
    value("gtin"),
    value("english_name"),
    value("korean_name") || value("name"),
    value("unit"),
    value("category"),
    value("store_id"),
    value("store_name"),
    value("sale_start_date"),
  ]);
}

export async function listPendingProductIdentityReviews(
  limit = 500,
): Promise<ServiceResult<AdminProductIdentityReview[]>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult([]);

  const queryLimit = Math.max(1, Math.min(limit, 500));
  const { data, error } = await supabase
    .from("product_identity_reviews")
    .select(REVIEW_SELECT)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(queryLimit);

  if (error) {
    if (isMissingReviewTable(error.message)) return { data: [], error: null };
    return { data: [], error: error.message };
  }

  return {
    data: ((data ?? []) as ProductIdentityReviewRow[]).map(reviewFromRow),
    error: null,
  };
}

export async function createProductIdentityReview(params: {
  rowNumber?: number;
  productId?: string;
  reason: string;
  matchMethod?: string;
  candidateCount?: number;
  payload: Record<string, unknown>;
}): Promise<ServiceResult<AdminProductIdentityReview | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) return { data: null, error: userError.message };
  if (!user) return { data: null, error: "Signed-in admin user is required." };

  const payload = {
    review_key: reviewKey(params),
    source: "csv_import",
    row_number: params.rowNumber ?? null,
    product_id: params.productId?.trim() || null,
    reason: params.reason.trim(),
    match_method: params.matchMethod?.trim() || null,
    candidate_count: Math.max(0, Math.floor(params.candidateCount ?? 0)),
    candidate_product_ids: payloadCandidateIds(params.payload),
    payload: params.payload,
    status: "pending",
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from("product_identity_reviews")
    .insert(payload)
    .select(REVIEW_SELECT)
    .single();

  if (error) {
    if (error.code === "23505") {
      const existing = await supabase
        .from("product_identity_reviews")
        .select(REVIEW_SELECT)
        .eq("review_key", payload.review_key)
        .eq("status", "pending")
        .maybeSingle();
      if (!existing.error && existing.data) {
        return {
          data: reviewFromRow(existing.data as ProductIdentityReviewRow),
          error: null,
        };
      }
    }
    if (isMissingReviewTable(error.message)) {
      return {
        data: null,
        error:
          "Product review queue is missing. Apply the product_identity_reviews migration first.",
      };
    }
    return { data: null, error: error.message };
  }

  return {
    data: data ? reviewFromRow(data as ProductIdentityReviewRow) : null,
    error: null,
  };
}

export async function mergeAdminProducts(params: {
  sourceProductIds: string[];
  targetProductId: string;
  reviewId?: string;
}): Promise<ServiceResult<ProductMergeResult | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const targetProductId = params.targetProductId.trim();
  const sourceProductIds = [
    ...new Set(
      params.sourceProductIds
        .map((productId) => productId.trim())
        .filter((productId) => productId && productId !== targetProductId),
    ),
  ];
  if (!targetProductId || sourceProductIds.length === 0) {
    return {
      data: null,
      error: "Choose one target product and at least one different source product.",
    };
  }

  const { data, error } = await supabase.rpc("merge_products_with_aliases", {
    p_source_product_ids: sourceProductIds,
    p_target_product_id: targetProductId,
    p_review_id: params.reviewId?.trim() || null,
  });
  if (error) return { data: null, error: error.message };
  return { data: (data as ProductMergeResult | null) ?? null, error: null };
}

export async function resolveProductIdentityReview(
  input:
    | string
    | {
        reviewId: string;
        resolvedProductId: string;
        resolutionAction: string;
      },
): Promise<ServiceResult<AdminProductIdentityReview | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const id = typeof input === "string" ? input.trim() : input.reviewId.trim();
  if (!id) return { data: null, error: "Review ID is required." };

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) return { data: null, error: userError.message };
  if (!user) return { data: null, error: "Signed-in admin user is required." };

  const resolution =
    typeof input === "string"
      ? {}
      : {
          resolved_product_id: input.resolvedProductId.trim(),
          resolution_action: input.resolutionAction.trim(),
        };
  const { data, error } = await supabase
    .from("product_identity_reviews")
    .update({
      status: "resolved",
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
      ...resolution,
    })
    .eq("id", id)
    .select(REVIEW_SELECT)
    .single();

  if (error) return { data: null, error: error.message };
  return {
    data: data ? reviewFromRow(data as ProductIdentityReviewRow) : null,
    error: null,
  };
}
