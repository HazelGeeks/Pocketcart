import { canonicalProductCategory } from "./productCategory";

const LEGACY_CATEGORIES: Record<string, string> = {
  신선식품: "Produce", 과일: "Produce", 채소: "Produce", 정육: "Meat",
  수산: "Seafood", 수산물: "Seafood", 유제품: "Dairy", 계란: "Eggs", 달걀: "Eggs",
  냉동식품: "Frozen Food", 가공식품: "Grocery", 식료품: "Grocery", 음료: "Beverages",
  생활용품: "Houseware", 면류: "Noodles", 곡류: "Rice & Grains", 쌀: "Rice & Grains",
  과자: "Snacks", 간식: "Snacks", 빵: "Bakery", 소스: "Sauces & Condiments",
};

export function flyerCategory(value: string, productName = ""): string {
  if (!value.trim() && /\b(?:cookies?|biscuits?|crackers?)\b/i.test(productName)) return "Snacks";
  const category = canonicalProductCategory(LEGACY_CATEGORIES[value.trim()] ?? value);
  // Unknown non-English categories need review instead of leaking into Product imports.
  return /^[A-Za-z][\x20-\x7E]*$/.test(category) ? category : "";
}
