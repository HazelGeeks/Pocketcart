import type { AdminPriceEntry, AdminProduct } from "../services/adminBackoffice";
import { dateInputValue } from "../utils/adminScreenHelpers";
import {
  gtinValidationMessage,
  isValidGtin,
  normalizeGtin,
  resolveProductMatch,
} from "../utils/productIdentity";
import type { UseAdminProductActionsParams } from "./adminProductActionTypes";
import { extensionFromType } from "./useAdminProductImageUpload";

export type ProductSaveInput = {
  koreanName: string;
  englishName: string;
  brand: string;
  gtin: string;
  unit: string;
  category: string;
};

export function findExistingPriceForPeriod(params: {
  prices: AdminPriceEntry[];
  productId: string;
  storeId: string;
  periodStartDate: string;
  periodEndDate: string;
}): AdminPriceEntry | null {
  const targetDate = params.periodStartDate.trim();
  if (!targetDate) return null;
  return params.prices.find((price) =>
    price.product_id === params.productId &&
    price.store_id === params.storeId &&
    dateInputValue(price.valid_from || price.observed_at) === targetDate &&
    dateInputValue(price.valid_to) === params.periodEndDate.trim(),
  ) ?? null;
}

export function isLikelySupabaseStorageUrl(value: string): boolean {
  try {
    const path = new URL(value).pathname;
    return path.includes("/storage/v1/object/public/") && path.includes("/product-images/");
  } catch {
    return false;
  }
}

export function safeProductImageName(name: string, contentType: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "product-image"}-${Date.now()}.${extensionFromType(contentType)}`;
}

type CandidateResult =
  | { blocked: false; product: AdminProduct | null; existingGtin: string }
  | { blocked: true; notice: string };

export async function resolveProductCandidate(params: {
  editingProductId: string | null;
  products: AdminProduct[];
  input: ProductSaveInput;
  createIdentityReviewMutation: UseAdminProductActionsParams["createIdentityReviewMutation"];
}): Promise<CandidateResult> {
  if (params.editingProductId) {
    return { blocked: false, product: null, existingGtin: "" };
  }
  const match = resolveProductMatch(params.products, params.input);
  if (match.status === "ambiguous") {
    await params.createIdentityReviewMutation.mutateAsync({
      reason: "ambiguous_manual_product_match",
      matchMethod: match.method,
      candidateCount: match.candidateCount,
      payload: {
        korean_name: params.input.koreanName,
        english_name: params.input.englishName || null,
        product_brand: params.input.brand || null,
        gtin: params.input.gtin || null,
        unit: params.input.unit || null,
        category: params.input.category,
        candidate_product_ids: match.candidateIds,
      },
    });
    return {
      blocked: true,
      notice: `${match.candidateCount} possible products were found. The item was sent to Dashboard review instead of being merged.`,
    };
  }

  const product = match.status === "matched" ? match.product : null;
  const rawExistingGtin = product?.gtin?.trim() ?? "";
  const existingGtin = isValidGtin(product?.gtin) ? normalizeGtin(product?.gtin) : "";
  if (product && rawExistingGtin && !existingGtin && !params.input.gtin) {
    await params.createIdentityReviewMutation.mutateAsync({
      productId: product.id,
      reason: "invalid_gtin",
      matchMethod: match.status === "matched" ? match.method : undefined,
      candidateCount: 1,
      payload: {
        korean_name: params.input.koreanName,
        product_brand: params.input.brand || null,
        existing_gtin: rawExistingGtin,
        validation_error: gtinValidationMessage(rawExistingGtin),
      },
    });
    return {
      blocked: true,
      notice: "The matched product has an invalid saved GTIN. It was sent to Dashboard review; correct the GTIN before adding prices.",
    };
  }
  if (product && params.input.gtin && existingGtin && params.input.gtin !== existingGtin) {
    await params.createIdentityReviewMutation.mutateAsync({
      productId: product.id,
      reason: "gtin_conflict",
      matchMethod: match.status === "matched" ? match.method : undefined,
      candidateCount: 1,
      payload: {
        korean_name: params.input.koreanName,
        product_brand: params.input.brand || null,
        supplied_gtin: params.input.gtin,
        existing_gtin: existingGtin,
      },
    });
    return { blocked: true, notice: "The GTIN conflicts with the matched product. It was sent to Dashboard review." };
  }
  return { blocked: false, product, existingGtin };
}
