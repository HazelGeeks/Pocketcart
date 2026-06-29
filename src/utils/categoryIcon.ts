export type CategoryIconVariant =
  | "baby"
  | "bakery"
  | "beverage"
  | "canned"
  | "cooking"
  | "dairy"
  | "deli"
  | "frozen"
  | "fruit"
  | "grains"
  | "household"
  | "meat"
  | "personal"
  | "seafood"
  | "snack"
  | "vegetable"
  | "grocery";

const CATEGORY_ICON_KEYWORDS: Array<[string[], CategoryIconVariant]> = [
  [["meat", "beef", "pork", "chicken", "닭", "소고기", "돼지고기", "고기"], "meat"],
  [["seafood", "fish", "salmon", "tuna", "생선", "해산물", "참치"], "seafood"],
  [["snack", "chip", "cracker", "cookie", "candy", "스낵", "과자"], "snack"],
  [["fruit", "apple", "banana", "berry", "과일"], "fruit"],
  [["vegetable", "produce", "veggie", "salad", "채소", "야채"], "vegetable"],
  [["dairy", "milk", "cheese", "yogurt", "유제품", "우유", "치즈"], "dairy"],
  [["grain", "rice", "noodle", "pasta", "cereal", "곡물", "쌀", "면"], "grains"],
  [["bread", "bakery", "베이커리", "빵"], "bakery"],
  [["beverage", "drink", "juice", "coffee", "tea", "음료", "커피", "차"], "beverage"],
  [["frozen", "ice cream", "냉동", "아이스크림"], "frozen"],
  [["deli", "ready", "prepared", "반찬", "델리"], "deli"],
  [["canned", "can", "tin", "통조림", "캔"], "canned"],
  [["sauce", "condiment", "dressing", "mayo", "소스", "양념"], "cooking"],
  [["cooking", "oil", "vinegar", "flour", "조리", "오일", "식용유"], "cooking"],
  [["baby", "formula", "diaper", "아기", "분유"], "baby"],
  [["household", "clean", "detergent", "soap", "paper", "생활", "세제"], "household"],
  [["personal", "beauty", "health", "care", "뷰티", "건강"], "personal"],
];

export function categoryToIconVariant(category?: string | null): CategoryIconVariant {
  const normalized = category?.trim().toLowerCase();
  if (!normalized) return "grocery";

  const match = CATEGORY_ICON_KEYWORDS.find(([keywords]) =>
    keywords.some((keyword) => normalized.includes(keyword)),
  );

  return match?.[1] ?? "grocery";
}
