-- Fill ten additional reviewed photos for products currently on sale.
-- Uses public official catalogs and an existing identical product image.
-- No OpenAI calls. Representative flavours/sizes stay within the listed range.
-- Keep source titles/URLs for review and preserve existing/concurrent photos.
with verified_images (
  id, expected_english_name, expected_korean_name, expected_unit, expected_brand,
  image_url, official_title, source_url
) as (
  values
    (
      '00f35abd-c936-4d30-a7f2-ca0488137438',
      'Natrel Lactose Free Butter (250 g)',
      '',
      '250 g',
      null,
      'https://product-images.metro.ca/images/h2f/h65/13561346719774.jpg',
      'Natrel Lactose-Free Salted Butter 250 g',
      'https://www.metro.ca/en/online-grocery/aisles/dairy-eggs/milk-cream-butter/butter-margarine/lactose-free-salted-butter/p/064420271983'
    ),
    (
      '11c246ff-3cb1-4e4c-8b45-37b2e6cee864',
      'Nature''s Path Granola (312- (325 g)',
      '',
      '312-325 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00058449172048.jpg',
      'Nature''s Path - Organic Granola Coconut Cashew Butter, 312 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/natures-path-organic-granola-coconut-cashew-butter-id-00058449172048'
    ),
    (
      '5da80246-7d74-4d82-9bc9-157f90fd86a2',
      'Dempster''s White or Whole Wheat, Texas Toast or Sandwich Bread (570- (675 g)',
      '',
      '570-675 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00068721722540.jpg',
      'Dempster''s - Signature 100% Whole Wheat Bread, 600 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/dempsters-signature-100-whole-wheat-bread-id-00068721722540'
    ),
    (
      '741256eb-1a2f-4a0d-b440-6369efc860d8',
      'Chestnuts (2 lb)',
      '',
      '2 lb',
      null,
      'https://jmxbvqrvxshlybeomagw.supabase.co/storage/v1/object/public/product-images/pngimg/chestnut_PNG18.png',
      'Chestnut, 2LB BAG',
      'https://jmxbvqrvxshlybeomagw.supabase.co/storage/v1/object/public/product-images/pngimg/chestnut_PNG18.png'
    ),
    (
      '7658f527-b74b-4455-8cdf-5d1132b3ebfb',
      'Frank''s RedHot Sauce or Thick Hot Sauce (354 ml)',
      '',
      '354 mL',
      null,
      'https://images.cdn.saveonfoods.com/cell/00056200805020.jpg',
      'FRANK''S - Red Hot Cayenne Pepper Sauce Original, 354 Millilitre ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/franks-red-hot-cayenne-pepper-sauce-original-id-00056200805020'
    ),
    (
      '88851fcd-f3ab-4152-8d58-204323efb7ff',
      'Annie''s Macaroni & Cheese (149- (170 g)',
      '',
      '149-170 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00013562498857.jpg',
      'Annie''s - Macaroni & Cheese, Four Cheese, 156 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/annies-macaroni-&-cheese-four-cheese-id-00013562498857'
    ),
    (
      '9b2f42a8-27e3-44ca-92d2-202df69dfebb',
      'Knorr Sauces or Gravies (17- (48 g)',
      '',
      '17-48 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00077567003775.jpg',
      'Knorr - Pesto Sauce, 17 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/knorr-pesto-sauce-id-00077567003775'
    ),
    (
      '9e50c28d-f4d5-4e05-8bd7-f6ba40c3c5e8',
      'Coconut Water',
      '코코넛워터',
      '1L',
      null,
      'https://images.cdn.saveonfoods.com/cell/08850025000026.jpg',
      'UFC - Coconut Water, 1 Litre ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/ufc-coconut-water-id-08850025000026'
    ),
    (
      'bb71b5e7-6a88-4ceb-98c5-a61109d16e82',
      'CASTELLO Tickler, 1 Year or Extra Mature (200 g)',
      '',
      '200 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00059441183148.jpg',
      'CASTELLO - Tickler 1 Year Cheddar, 200 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/castello-tickler-1-year-cheddar-id-00059441183148'
    ),
    (
      'e5d73e8e-e9e5-4b1e-bb4c-2405ba6307fd',
      'PAM Cooking Sprays (141- (170 g)',
      '',
      '141-170 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00064144004126.jpg',
      'PAM - Cooking Spray, Original, 170 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/pam-cooking-spray-original-id-00064144004126'
    )
)
update public.products as product
set thumbnail_url = verified.image_url
from verified_images as verified
where product.id = verified.id::uuid
  and nullif(btrim(product.thumbnail_url), '') is null
  and product.english_name is not distinct from verified.expected_english_name
  and product.korean_name is not distinct from verified.expected_korean_name
  and product.unit is not distinct from verified.expected_unit
  and product.brand is not distinct from verified.expected_brand;
