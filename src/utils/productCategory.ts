type ProductCategoryGroup = {
  canonical: string;
  aliases: string[];
};

const PRODUCT_CATEGORY_GROUPS: ProductCategoryGroup[] = [
  {
    canonical: "Bakery",
    aliases: ["Bakery", "Bakery / Snacks"],
  },
  {
    canonical: "Beverages",
    aliases: ["Baverage", "Baverages", "Beverage", "Beverages", "Dairy / Beverage"],
  },
  {
    canonical: "Frozen Food",
    aliases: ["Frozen", "Frozen Food", "Frozen Foods", "Frozen Meal"],
  },
  {
    canonical: "Houseware",
    aliases: ["Houseware", "Kitchen"],
  },
  {
    canonical: "Noodles",
    aliases: ["Noodle", "Noodles"],
  },
  {
    canonical: "Prepared Foods",
    aliases: ["Prepared Food", "Prepared Foods"],
  },
  {
    canonical: "Ready Meals",
    aliases: [
      "Ready Meal",
      "Ready Meals",
      "Ready-to-Eat",
      "Ready-to-Eat Meal",
      "Ready-to-Eat Meals",
    ],
  },
  {
    canonical: "Rice & Grains",
    aliases: [
      "Rice",
      "Rice & Grain",
      "Rice & Grains",
      "Rice / Grain",
      "Rice / Grains",
      "Rice/Grain",
      "Rice/Grains",
    ],
  },
  {
    canonical: "Rice Cakes",
    aliases: ["Rice Cake", "Rice Cakes"],
  },
  {
    canonical: "Sauces & Condiments",
    aliases: [
      "Condiment",
      "Condiments",
      "Sauce",
      "Sauces",
      "Sauce & Condiment",
      "Sauce & Condiments",
      "Sauce & Seasoning",
      "Sauce / Paste",
      "Sauces & Condiments",
    ],
  },
  {
    canonical: "Seafood",
    aliases: ["Seafood", "Seafood / Snack"],
  },
  {
    canonical: "Snacks",
    aliases: ["Snack", "Snacks"],
  },
];

function productCategoryKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const PRODUCT_CATEGORY_BY_KEY = new Map(
  PRODUCT_CATEGORY_GROUPS.flatMap((group) =>
    [group.canonical, ...group.aliases].map((value) => [
      productCategoryKey(value),
      group.canonical,
    ]),
  ),
);

export function canonicalProductCategory(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return PRODUCT_CATEGORY_BY_KEY.get(productCategoryKey(trimmed)) ?? trimmed;
}

export function productCategoryQueryValues(value: string): string[] {
  const canonical = canonicalProductCategory(value);
  if (!canonical) return [];
  const group = PRODUCT_CATEGORY_GROUPS.find((candidate) => candidate.canonical === canonical);
  return group ? [...new Set([group.canonical, ...group.aliases])] : [canonical];
}
