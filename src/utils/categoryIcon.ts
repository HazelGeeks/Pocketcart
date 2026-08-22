import { canonicalProductCategory } from "./productCategory";

export type CategoryIconVariant =
  | "all"
  | "baby"
  | "bakery"
  | "beverage"
  | "canned"
  | "cooking"
  | "dairy"
  | "deli"
  | "dessert"
  | "frozen"
  | "fruit"
  | "grains"
  | "health"
  | "household"
  | "houseware"
  | "kimchi"
  | "meat"
  | "noodles"
  | "pantry"
  | "personal"
  | "rice"
  | "seafood"
  | "seaweed"
  | "snack"
  | "soup"
  | "spice"
  | "vegetable"
  | "grocery";

const CATEGORY_ICON_KEYWORDS: Array<[string[], CategoryIconVariant]> = [
  [["meat", "beef", "pork", "chicken", "닭", "소고기", "돼지고기", "고기"], "meat"],
  [["seafood", "fish", "salmon", "tuna", "생선", "해산물", "참치"], "seafood"],
  [["snack", "chip", "cracker", "cookie", "candy", "스낵", "과자"], "snack"],
  [["dessert", "cake", "ice cream", "디저트", "케이크", "아이스크림"], "dessert"],
  [["fruit", "apple", "banana", "berry", "과일"], "fruit"],
  [["vegetable", "produce", "veggie", "salad", "채소", "야채"], "vegetable"],
  [["kimchi", "김치"], "kimchi"],
  [["dairy", "milk", "cheese", "yogurt", "유제품", "우유", "치즈"], "dairy"],
  [["noodle", "ramen", "pasta", "국수", "라면", "면"], "noodles"],
  [["rice", "쌀", "밥"], "rice"],
  [["grain", "cereal", "곡물"], "grains"],
  [["bread", "bakery", "베이커리", "빵"], "bakery"],
  [["beverage", "drink", "juice", "coffee", "tea", "음료", "커피", "차"], "beverage"],
  [["frozen", "냉동"], "frozen"],
  [["deli", "ready", "prepared", "side dish", "반찬", "델리"], "deli"],
  [["canned", "can", "tin", "통조림", "캔"], "canned"],
  [["soup", "stew", "국", "찌개", "탕"], "soup"],
  [["spice", "seasoning", "향신료", "시즈닝"], "spice"],
  [["sauce", "condiment", "dressing", "mayo", "소스", "양념"], "cooking"],
  [["cooking", "oil", "vinegar", "flour", "조리", "오일", "식용유"], "cooking"],
  [["baby", "formula", "diaper", "아기", "분유"], "baby"],
  [["houseware", "kitchen", "cookware", "주방"], "houseware"],
  [["household", "clean", "detergent", "soap", "paper", "생활", "세제"], "household"],
  [["health", "vitamin", "medicine", "건강", "비타민"], "health"],
  [["personal", "beauty", "hair", "skin", "care", "뷰티", "미용"], "personal"],
  [["seaweed", "laver", "nori", "김", "미역", "해조"], "seaweed"],
  [["pantry", "식료품 저장"], "pantry"],
];

export function categoryToIconVariant(category?: string | null): CategoryIconVariant {
  if (category?.trim().toLowerCase() === "all") return "all";

  const normalized = canonicalProductCategory(category ?? "").toLowerCase();
  if (!normalized) return "grocery";

  const match = CATEGORY_ICON_KEYWORDS.find(([keywords]) =>
    keywords.some((keyword) => normalized.includes(keyword)),
  );

  return match?.[1] ?? "grocery";
}
