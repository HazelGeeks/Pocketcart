-- Fill 101 reviewed empty product photos without any AI/API image generation.
-- Sources: official PriceSmart, Galleria, Metro/Super C and Hannam catalogs,
-- plus four identical products already carrying verified images in PocketCart.
-- The user approved a representative flavour/size within a listed assortment.
-- Source titles and URLs are retained below for review; no product names,
-- quantities or prices change. Existing/concurrently added photos are preserved.
with verified_images (
  id, expected_english_name, expected_korean_name, expected_unit, expected_brand,
  image_url, official_title, source_url
) as (
  values
    (
      '000ded5a-143f-4c85-bda0-4d4d2b71c250',
      'HT French Pie (192 g)',
      '',
      '192 g',
      null,
      'https://www.galleriasm.com/images/Product/8801019307140.jpg',
      'HAITAI BISCUIT FRENCH PIE APPLE 192G',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=8801019307140&BrandNo=002&LangCode=EN'
    ),
    (
      '03aa2084-99ff-4d37-80e3-5a3d208c729c',
      'Binggrae Melona Ice Bar',
      '빙그레 메로나 아이스바',
      '2 for / 560ml',
      null,
      'https://www.galleriasm.com/images/Product/769828120818.jpg',
      'BINGGRAE MELONA MELON FLAVOR ICE BAR MULTI 70ML*8',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=769828120818&BrandNo=002&LangCode=EN'
    ),
    (
      '03cb3af9-2eb8-42fb-8777-6e5aaa779c9d',
      'Unagi Roll',
      '장어 롤',
      'pack',
      null,
      'https://images.cdn.saveonfoods.com/cell/00266400000006.jpg',
      'PriceSmart Foods - Unagi Rolls, 8 pcs, 1 Each ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/pricesmart-foods-unagi-rolls-8-pcs-id-00266400000006'
    ),
    (
      '07d8c976-11e7-46b5-8d71-8957a3db573f',
      'Righteous Sorbetto (473 ml)',
      '',
      '473 mL',
      null,
      'https://images.cdn.saveonfoods.com/cell/00812827003979.jpg',
      'Righteous - Raspberry Lime Sorbetto, 473 Millilitre ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/righteous-raspberry-lime-sorbetto-id-00812827003979'
    ),
    (
      '0dfbd260-20da-4053-8498-65749b411cb0',
      'Philadelphia Cream Cheese (340 g)',
      '',
      '340 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00068100896336.jpg',
      'Philadelphia - Original Cream Cheese, 340 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/philadelphia-original-cream-cheese-id-00068100896336'
    ),
    (
      '112d1f74-689e-44c5-a1ee-c60b657df959',
      'Roasted White Sesame Seeds',
      '볶음참깨',
      'EA',
      null,
      'https://www.galleriasm.com/images/Product/081652054139.jpg',
      'ASSI ROASTED WHITE SESAME SEEDS 220G',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=081652054139&BrandNo=002&LangCode=EN'
    ),
    (
      '1c05c1f1-6333-4c26-8271-8bc8226e18a4',
      'Quaker Instant Oatmeal (232- (344 g)',
      '',
      '232-344 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00055577113011.jpg',
      'Quaker - Regular Instant Oatmeal, 280 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/quaker-regular-instant-oatmeal-id-00055577113011'
    ),
    (
      '1c069088-4191-448e-b525-5966ee28db65',
      'Red Pepper Powder (200 g)',
      '태양초 고춧가루',
      '200G',
      null,
      'https://www.galleriasm.com/images/Product/081652050391.jpg',
      'ASSI RED PEPPER POWDER FINE 200G',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=081652050391&BrandNo=002&LangCode=EN'
    ),
    (
      '1cdbb21f-e1f0-439e-acf2-7b7b8ab2418f',
      'Cold Noodle(3 Flavours)',
      '풀무원)냉면3종 (평양물/동치미물/칠성냉면)',
      'PK',
      null,
      'https://www.galleriasm.com/images/Product/8801114305812.jpg',
      'PULMUONE COLD NOODLE 990G',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=8801114305812&BrandNo=002&LangCode=EN'
    ),
    (
      '2698fe47-6a46-4f88-b4e9-87472a78f56b',
      'Kraft Salad Dressing (710 ml)',
      '',
      '710 mL',
      null,
      'https://images.cdn.saveonfoods.com/cell/00068100907285.jpg',
      'Kraft - Ranchers Choice Salad Dressing, 710 Millilitre ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/kraft-ranchers-choice-salad-dressing-id-00068100907285'
    ),
    (
      '279b4378-9d5e-45c2-8d84-1fb2537640e2',
      'King Bowl Noodle',
      '팔도 왕뚜껑(3kinds) 120g',
      '2 for',
      null,
      'https://www.galleriasm.com/images/Product/648436100927.jpg',
      'PALDO KING BOWL NOODLE SEAFOOD 120G',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=648436100927&BrandNo=002&LangCode=EN'
    ),
    (
      '29a9e591-20ef-4224-a7e2-58769216cc7c',
      'Superior Northern Style Tofu',
      '북부식 두부',
      '680g',
      null,
      'https://jmxbvqrvxshlybeomagw.supabase.co/storage/v1/object/public/product-images/maintenance/20261009-round3-9/8c4ad808-0f15-4ad1-a3a6-53c85ec2566d.jpg',
      'Superior Northern Style Tofu (680 g)',
      'https://jmxbvqrvxshlybeomagw.supabase.co/storage/v1/object/public/product-images/maintenance/20261009-round3-9/8c4ad808-0f15-4ad1-a3a6-53c85ec2566d.jpg'
    ),
    (
      '29f27f76-f89f-46b3-be47-6d587761f853',
      'Orion chips',
      '오리온 칩',
      '160 g',
      null,
      'https://www.galleriasm.com/images/Product/8801117990305.jpg',
      'ORION  TURTLE CHIPS SPICY 160G',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=8801117990305&BrandNo=002&LangCode=EN'
    ),
    (
      '2a2b725b-ed50-4981-82b6-d0afe51a2c73',
      'Peace Tea (12 x 341 ml)',
      '',
      '12 x 341 mL',
      null,
      'https://www.galleriasm.com/images/Product/067000107405.jpg',
      'PEACE TEA PEACH 341ML*12',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=067000107405&BrandNo=002&LangCode=EN'
    ),
    (
      '2be1aa9b-8406-43ad-855a-90aa7240c699',
      'GENERAL MILLS Family Size Cereal (377- (778 g)',
      '',
      '377-778 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00065633134652.jpg',
      'General Mills - Cheerios Cereal, Family Size, 570 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/general-mills-cheerios-cereal-family-size-id-00065633134652'
    ),
    (
      '2c753817-a4bf-4c48-8576-3cf3bd224cda',
      'Christie Dad’s Cookies (275- (350 g)',
      '',
      '275-350 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00056833000205.jpg',
      'Christie - Dad''s Oatmeal Original Cookies, 320 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/christie-dads-oatmeal-original-cookies-id-00056833000205'
    ),
    (
      '2d1e3ead-456e-458f-b12e-8be52948251b',
      'Kimlan Soy Sauce',
      '킴란 간장',
      '590ml',
      null,
      'https://images.cdn.saveonfoods.com/cell/00770888000477.jpg',
      'KIMLAN - Dark Soy Sauce, 590 Millilitre ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/kimlan-dark-soy-sauce-id-00770888000477'
    ),
    (
      '2f8b8733-40ab-4527-ae53-a3c5c68a579b',
      'PHILADELPHIA Cream Cheese (227- (250 g)',
      '',
      '227-250 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00068100895971.jpg',
      'Philadelphia - Original Cream Cheese, 227 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/philadelphia-original-cream-cheese-id-00068100895971'
    ),
    (
      '34ff7649-a8a2-4aa6-a986-2edd3c0d88c9',
      'MAPLE LEAF Bacon (375 g)',
      '',
      '375 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00063100219406.jpg',
      'Maple Leaf - Original Natural Bacon, 375 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/maple-leaf-original-natural-bacon-id-00063100219406'
    ),
    (
      '3613d156-8786-41dd-91db-7b225d84f8fe',
      'Kimchi and Pork Dumpling',
      '김치 돼지고기 만두',
      'pack',
      null,
      'https://www.galleriasm.com/images/Product/753214741299.jpg',
      'PULMUONE JUMBO KIMCHI & PORK DUMPLING 630G',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=753214741299&BrandNo=002&LangCode=EN'
    ),
    (
      '37a82e2e-8986-41d6-aa9a-0173fbc91df2',
      'Vita Drink',
      '維他飲品',
      'pack',
      null,
      'https://images.cdn.saveonfoods.com/cell/04891028664994.jpg',
      'VITA - Soya Drink, 6 Each ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/vita-soya-drink-id-04891028664994'
    ),
    (
      '37b4c18a-4957-4533-beb4-0970d747e275',
      'Dr. Oetker Giuseppe Rising Crust Pizza (439- (785 g)',
      '',
      '439-785 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00058336250217.jpg',
      'Dr. Oetker - Giuseppe Pizzeria Rising Crust Deluxe Pizza, 785 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/dr-oetker-giuseppe-pizzeria-rising-crust-deluxe-pizza-id-00058336250217'
    ),
    (
      '3b2eb23f-574d-4ef3-8b94-4bdc8ca49e8d',
      'Marcangelo Antipasto Misto (85 g)',
      '',
      '85 g',
      null,
      'https://product-images.metro.ca/images/h28/h9b/16655615361054.jpg',
      'Marcangelo Antipasto Misto 85 g',
      'https://www.superc.ca/en/aisles/deli-prepared-meals/deli-meats/antipasto-misto/p/627907119040'
    ),
    (
      '3bcad746-eda5-479f-99b3-b805b3f897b9',
      'La Cocina Tortilla Chips (300- (400 g)',
      '',
      '300-400 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00057802109004.jpg',
      'La Cocina - Tortilla Chips - Original, 400 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/la-cocina-tortilla-chips-original-id-00057802109004'
    ),
    (
      '3d06e6da-2a73-4fe6-ac11-e45816d04863',
      'ORN Turtle Chips (160 g)',
      '',
      '160 g',
      null,
      'https://www.galleriasm.com/images/Product/8801117990305.jpg',
      'ORION  TURTLE CHIPS SPICY 160G',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=8801117990305&BrandNo=002&LangCode=EN'
    ),
    (
      '3e2c0df7-ad54-4365-bb17-19576ec3d306',
      'McCain Superfries (454– (800 g)',
      '',
      '454–800 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00055773000689.jpg',
      'McCain - Superfries Crinkle Cut, 650 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/mccain-superfries-crinkle-cut-id-00055773000689'
    ),
    (
      '448f09ca-0a95-4ede-ac5a-c578ae822234',
      'Busan Fish Cake',
      '부산어묵',
      '420G; 2FOR',
      null,
      'https://www.galleriasm.com/images/Product/761898608548.jpg',
      'CHORIPDONG BUSAN FISH CAKE 420G',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=761898608548&BrandNo=002&LangCode=EN'
    ),
    (
      '45a4bed2-c5b7-4974-9c78-6805a08b80a4',
      'Roasted Pork',
      '로스트 포크',
      'lb',
      null,
      'https://images.cdn.saveonfoods.com/cell/00265090000006.jpg',
      'PriceSmart Foods - Roasted Pork, 375 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/pricesmart-foods-roasted-pork-id-00265090000006'
    ),
    (
      '48abb1ee-27a7-4935-afab-7174c0e87149',
      'Kellogg’s Eggo Waffles (270- (330 g)',
      '',
      '270-330 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00064100150416.jpg',
      'Kellogg''s - Eggo Protein Strawberry Blast Waffles, 8 Pack, 280 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/kelloggs-eggo-protein-strawberry-blast-waffles-8-pack-id-00064100150416'
    ),
    (
      '4b168e47-14a0-442e-8b0b-1a8897167bac',
      'Herbal Essences Shampoo (346 ml)',
      '',
      '346 mL',
      null,
      'https://images.cdn.saveonfoods.com/cell/00190679004758.jpg',
      'Herbal Essences - Hello Hydration Shampoo & Bodywash, 346 Millilitre ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/herbal-essences-hello-hydration-shampoo-&-bodywash-id-00190679004758'
    ),
    (
      '4f08e1cc-932a-4520-a5c6-4a991778f281',
      'Sweet Mandarin',
      '감귤',
      'lb',
      null,
      'https://images.cdn.saveonfoods.com/cell/19739.jpg',
      'Japanese - Sweet Mandarin, 1 Pound ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/japanese-sweet-mandarin-id-19739'
    ),
    (
      '504ef877-fcf1-489e-ba02-8f8db8ec07ce',
      'FILIPPO BERIO Flavoured Oil (250 ml)',
      '',
      '250 mL',
      null,
      'https://images.cdn.saveonfoods.com/cell/00041736000551.jpg',
      'FILIPPO BERIO - Extra Virgin Olive Oil - Chilli Flavoured, 250 Millilitre ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/filippo-berio-extra-virgin-olive-oil-chilli-flavoured-id-00041736000551'
    ),
    (
      '523b1791-d6cb-404c-8d96-08ff4959846c',
      'Righteous Gelato (473 ml)',
      '',
      '473 mL',
      null,
      'https://images.cdn.saveonfoods.com/cell/00812827004600.jpg',
      'Righteous - Cookies and Cream Gelato, 473 Millilitre ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/righteous-cookies-and-cream-gelato-id-00812827004600'
    ),
    (
      '574aef8a-2eea-4aca-b9d8-53726d633653',
      'Cracker Barrel Cheese Block (740 g)',
      '',
      '740 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00068200009216.jpg',
      'Cracker Barrel - Marble Cheese Block, 740 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/cracker-barrel-marble-cheese-block-id-00068200009216'
    ),
    (
      '5e6c737b-ed68-4ca2-b0b4-0aebc923ce8f',
      'Green Giant Riced Veggies (283– (340 g)',
      '',
      '283–340 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00190569123385.jpg',
      'Green Giant - Riced Veggies Cauliflower Medley, 340 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/green-giant-riced-veggies-cauliflower-medley-id-00190569123385'
    ),
    (
      '5f2e8b59-fd12-4f87-bb36-051295073a85',
      'Raisin Bread',
      '건포도 식빵',
      '2 for / 400g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00062639420864.jpg',
      'PriceSmart Foods - Raisin Bread, 400 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/pricesmart-foods-raisin-bread-id-00062639420864'
    ),
    (
      '62eed0c4-65a4-4d4f-80cf-ea322a3aa267',
      'House Roll',
      '하우스 롤',
      '5 pc',
      null,
      'https://images.cdn.saveonfoods.com/cell/00266540000003.jpg',
      'PriceSmart Foods - House Roll, 5 Pieces, 1 Each ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/pricesmart-foods-house-roll-5-pieces-id-00266540000003'
    ),
    (
      '68bae270-d541-412d-af65-a605924cad02',
      'Johnsonville Sausage Meat (375 g)',
      '',
      '375 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00077782001006.jpg',
      'Johnsonville - Mild Italian Ground Sausage Meat, 375 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/johnsonville-mild-italian-ground-sausage-meat-id-00077782001006'
    ),
    (
      '69f76662-0ef2-4686-a7de-faf6ca4b2444',
      'Healthy Choice Gourmet Steamers (269- (306 g)',
      '',
      '269-306 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00072655422667.jpg',
      'Healthy Choice - Gourmet Steamers Bf Merlot, 269 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/healthy-choice-gourmet-steamers-bf-merlot-id-00072655422667'
    ),
    (
      '6c0bada3-89bd-4162-9328-9795e4d3e0fa',
      'Marcangelo Mortadella with Pistachio (110 g)',
      '',
      '110 g',
      null,
      'https://product-images.metro.ca/images/he3/h0e/15747404070942.jpg',
      'Marcangelo Mortadella with Pistachio 110 g',
      'https://www.metro.ca/en/online-grocery/aisles/deli-prepared-meals/deli-meats/mortadella-with-pistachio/p/627907119149'
    ),
    (
      '6d3f8950-79f4-416a-8bc2-797f42436029',
      'Quaker Rice Cakes (127- (199 g)',
      '',
      '127-199 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00055577107881.jpg',
      'Quaker - Butter Popcorn Rice Cake, 127 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/quaker-butter-popcorn-rice-cake-id-00055577107881'
    ),
    (
      '76a30139-9323-43c9-9cb1-2fa32e684aec',
      'Soo Pacific Salmon Fish Jerky',
      '수 퍼시픽 연어 피시 저키',
      '170g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00065717030047.jpg',
      'Soo - Hot Pacific Salmon Fish Jerky, 170 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/soo-hot-pacific-salmon-fish-jerky-id-00065717030047'
    ),
    (
      '7a440dfd-258f-4955-af00-f50855578872',
      'Rice Punch',
      '식혜',
      'PK',
      null,
      'https://www.galleriasm.com/images/Product/648436122677.jpg',
      'PALDO RICE PUNCH 1.5L',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=648436122677&BrandNo=002&LangCode=EN'
    ),
    (
      '7a8cc652-d10e-48e0-be15-e91c616d30f5',
      'Sensodyne or Pronamel toothpaste',
      '센소다인/프로나멜 치약',
      '110-135 mL',
      null,
      'https://images.cdn.saveonfoods.com/cell/00060815031347.jpg',
      'Sensodyne - Pronamel Toothpaste Gentle Whitening, 110 Millilitre ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/sensodyne-pronamel-toothpaste-gentle-whitening-id-00060815031347'
    ),
    (
      '7b64ec77-3b64-4f64-add9-83676e93fb5b',
      'Beef Sliced Flat Iron',
      '부채살 샤브샤브용',
      'lb',
      null,
      'https://hannamsm.com/cms-assets/img/item_image/meat/214007.png',
      'Beef Sliced Flat Iron',
      'https://hannamsm.com/cms-assets/img/item_image/meat/214007.png'
    ),
    (
      '7c6498b8-8c57-42d7-a833-55091c92cdbf',
      'Dinner Roll',
      '모닝빵',
      'pack',
      null,
      'https://images.cdn.saveonfoods.com/cell/00063400266483.jpg',
      'Weston - White Dinner Rolls, 20 Each ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/weston-white-dinner-rolls-id-00063400266483'
    ),
    (
      '7f52aa9c-ff23-4ae6-998f-d047d35820a9',
      'PURE LEAF Iced Tea (1.75 l)',
      '',
      '1.75 L',
      null,
      'https://images.cdn.saveonfoods.com/cell/00048500022276.jpg',
      'Lipton - Pure Leaf Iced Tea, Lemon, 1.75 Litre ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/lipton-pure-leaf-iced-tea-lemon-id-00048500022276'
    ),
    (
      '82156965-0095-4587-ad45-306c72d5add2',
      'Kellogg''s Vector Granola (311 g)',
      '',
      '311 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00059724102149.jpg',
      'Kellogg''s - Vector Protein Granola - Chocolate, 311 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/kelloggs-vector-protein-granola-chocolate-id-00059724102149'
    ),
    (
      '8251457f-1467-4a8c-946f-f10e19bd0dff',
      'Superior Natural Soy Drink',
      '슈페리어 천연 두유',
      'ea',
      null,
      'https://www.galleriasm.com/images/Product/777433025022.jpg',
      'SUPERIOR NATURAL SWEETENED SOY DRINK 1.89L',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=777433025022&BrandNo=002&LangCode=EN'
    ),
    (
      '84042561-522d-43b7-8a3a-cb0a604c7b54',
      'Kimchi (1, (580 g)',
      '한국 김치 1580g',
      '1580 g',
      null,
      'https://hannamsm.com/cms-assets/img/item_image/grocery/623431000359.jpg',
      'TB Korean Kimchi 1580G',
      'https://hannamsm.com/single-product.php?plu=623431000359&source=weekly&lang=EN'
    ),
    (
      '84268fdd-01a6-4cce-b023-fadfd5a5ec18',
      'CLUB HOUSE Gravies (21- (47 g)',
      '',
      '21-47 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00066200005023.jpg',
      'Club House - Pork Gravy Mix, 24 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/club-house-pork-gravy-mix-id-00066200005023'
    ),
    (
      '862a357a-7f41-4aa0-b7b7-52a585611b49',
      'Caledon Farms Dog Treats (110- (554 g)',
      '',
      '110-554 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00835302000232.jpg',
      'CALEDON Farms - Dog Treats Sweet Potato Chews, 265 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/caledon-farms-dog-treats-sweet-potato-chews-id-00835302000232'
    ),
    (
      '8cd900c7-e16b-4494-a36f-96ce667d627f',
      'Korean BBQ Sauce',
      '한국식 바비큐 소스',
      '840 g',
      null,
      'https://www.galleriasm.com/images/Product/081652052227.jpg',
      'ASSI KOREAN BBQ SAUCE FOR PORK 840G',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=081652052227&BrandNo=002&LangCode=EN'
    ),
    (
      '9036b8eb-c11f-4d59-8da3-8db9f7e9bc3d',
      'DT Matcha Latte (20 G X 7)',
      '',
      '20 G X 7',
      null,
      'https://www.galleriasm.com/images/Product/8809257336021.jpg',
      'DAMTUH MATCHA LATTE 140G',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=8809257336021&BrandNo=002&LangCode=EN'
    ),
    (
      '94559553-553b-4a56-9275-b2cd9dfd50ab',
      'Turtle Chips(2 kinds)',
      '오리온 꼬북칩 2종 80g X 7',
      'box',
      null,
      'https://www.galleriasm.com/images/Product/8801117960513.jpg',
      'ORION TURTLE CHIPS SWEET CORN 560G',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=8801117960513&BrandNo=002&LangCode=EN'
    ),
    (
      '97c03d94-88f7-4042-acf4-7f19cef264e8',
      'Cracker Barrel Shredded Cheese (590 g)',
      '',
      '590 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00068200478944.jpg',
      'Cracker Barrel - Tex Mex Shredded Cheese, 590 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/cracker-barrel-tex-mex-shredded-cheese-id-00068200478944'
    ),
    (
      '98097601-5f1c-40d9-b273-72b6e31c7e4a',
      'Korean Shine Muscat (450- (900 g)',
      '샤인머스캣 450-900g',
      '450-900g',
      null,
      'https://images.cdn.saveonfoods.com/cell/11922.jpg',
      'Korean Shine Muscat - Grapes, 500 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/korean-shine-muscat-grapes-id-11922'
    ),
    (
      'a2209fe7-e1bb-4c95-9aa8-40163c41ab5b',
      'Quaker Crispy Minis (90- (100 g)',
      '',
      '90-100 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00055577109861.jpg',
      'Quaker - Crispy Minis, Cool Ranch, 90 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/quaker-crispy-minis-cool-ranch-id-00055577109861'
    ),
    (
      'a504ff58-3d56-4914-9002-4d069420a505',
      'Popsicle Ice Pops (18 pk)',
      '',
      '18 pk',
      null,
      'https://images.cdn.saveonfoods.com/cell/00058779144074.jpg',
      'Popsicle - Orange Cherry Grape - Ice Pops, 18 Pack, 1 Each ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/popsicle-orange-cherry-grape-ice-pops-18-pack-id-00058779144074'
    ),
    (
      'a689faa4-36dc-43ba-bc5c-6156702d4c82',
      'Marcangelo Mortadella (110 g)',
      '',
      '110 g',
      null,
      'https://product-images.metro.ca/images/h12/h04/15747594780702.jpg',
      'Marcangelo Thinly Sliced Mortadella 110 g',
      'https://www.superc.ca/en/aisles/deli-prepared-meals/deli-meats/thinly-sliced-mortadella/p/627907119156'
    ),
    (
      'a846158b-6ab6-45c5-a14b-9d9b55349801',
      'Castello Blue Cheese (125 g)',
      '',
      '125 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00060466966098.jpg',
      'CASTELLO - Blue Cheese - Extra Creamy, 125 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/castello-blue-cheese-extra-creamy-id-00060466966098'
    ),
    (
      'a85e2c0e-8529-4cb3-b430-0917aca1fe80',
      'Lotte Yukimi Daifuku',
      '롯데 유키미 다이후쿠',
      '27ml x9 / 270ml',
      null,
      'https://www.galleriasm.com/images/Product/4953823806082.jpg',
      'LOTTE YUKIMI DAIFUKU GREEN TEA 243ML',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=4953823806082&BrandNo=002&LangCode=EN'
    ),
    (
      'af7be7f9-503c-484c-8df4-49d7e012bff8',
      'E.D. Smith Pie Filling (540 ml)',
      '',
      '540 mL',
      null,
      'https://images.cdn.saveonfoods.com/cell/00067200003200.jpg',
      'E.D. SMITH - Apple Pie Filling, 540 Millilitre ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/ed-smith-apple-pie-filling-id-00067200003200'
    ),
    (
      'b12b79ba-5a4b-4b0e-8c52-d2b35d5afdd1',
      'Sempio Soy Sauce',
      '샘표 진간장',
      '1.7 L',
      null,
      'https://www.galleriasm.com/images/Product/8801005133029.JPG',
      'SEMPIO SOY SAUCE JIN GOLD F3 1.7L',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=8801005133029&BrandNo=002&LangCode=EN'
    ),
    (
      'b23929b4-1ff8-4641-ba01-67c0bb437523',
      'Superior Natural Soy Drink',
      '슈피리어 천연 두유',
      '1.89L',
      null,
      'https://www.galleriasm.com/images/Product/777433025022.jpg',
      'SUPERIOR NATURAL SWEETENED SOY DRINK 1.89L',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=777433025022&BrandNo=002&LangCode=EN'
    ),
    (
      'b52bec68-dbc7-408c-8956-fc8e93ceb866',
      'Dr. Oetker Suprema Pizza (475- (520 g)',
      '',
      '475-520 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00058336618109.jpg',
      'Dr. Oetker - Suprema Salame Romano Pizza, 487 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/dr-oetker-suprema-salame-romano-pizza-id-00058336618109'
    ),
    (
      'b912cdd9-2820-4301-8f6b-26ac9a6335b4',
      'Kicking Horse Ground Coffee (284 g)',
      '',
      '284 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00629070900159.jpg',
      'Kicking Horse - Organic Ground Coffee, Horse Power Dark Roast, 284 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/kicking-horse-organic-ground-coffee-horse-power-dark-roast-id-00629070900159'
    ),
    (
      'b9341f0f-6f32-4331-935c-969701c2b760',
      'Mayonnaise (2 kinds)',
      '청정원 고소한/후레쉬 마요네즈',
      '500g',
      null,
      'https://www.galleriasm.com/images/Product/8801052728223.jpg',
      'CHUNGJUNGONE MAYONNAISE 500G',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=8801052728223&BrandNo=002&LangCode=EN'
    ),
    (
      'ba314cb0-ddc8-4d08-886c-55aab78276bd',
      'KFI Sauces (375- (395 ml)',
      '',
      '375-395 mL',
      null,
      'https://images.cdn.saveonfoods.com/cell/00814668003385.jpg',
      'KFI - Korma Cooking Sauce, 395 Millilitre ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/kfi-korma-cooking-sauce-id-00814668003385'
    ),
    (
      'bf7dc4cd-5ca4-4d66-962f-74e1312adfa0',
      'TOSTITOS Tortilla Chips (205- (300 g)',
      '',
      '205-300 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00060410901168.jpg',
      'Tostitos - Tortilla Chips -Gold, 290 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/tostitos-tortilla-chips-gold-id-00060410901168'
    ),
    (
      'c5561376-b86a-4129-a8ab-4b79ab85721e',
      'ORN Turtle Chips',
      '오리온 꼬북칩',
      '2 for / 160 g / 3 kinds',
      null,
      'https://www.galleriasm.com/images/Product/8801117990305.jpg',
      'ORION  TURTLE CHIPS SPICY 160G',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=8801117990305&BrandNo=002&LangCode=EN'
    ),
    (
      'c6fca012-6325-4840-a267-717b09beeff4',
      'Nong Shim Snacks',
      '농심 스낵',
      '40-75 g',
      null,
      'https://www.galleriasm.com/images/Product/031146204274.JPG',
      'NONGSHIM CUTTLEFISH SNACK 55G',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=031146204274&BrandNo=002&LangCode=EN'
    ),
    (
      'c7e4b24a-b149-44c1-84cb-fd7e152b6883',
      'Grade A Duck',
      '',
      'lb',
      null,
      'https://images.cdn.saveonfoods.com/cell/00267000000007.jpg',
      'PriceSmart Foods - Frozen Duck, Grade A, 500 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/pricesmart-foods-frozen-duck-grade-a-id-00267000000007'
    ),
    (
      'c8e5f9d6-afd2-458e-92ef-cdcdc57651c8',
      'Shirakiku Shirataki Noodle (250 g)',
      '',
      '250g',
      null,
      'https://jmxbvqrvxshlybeomagw.supabase.co/storage/v1/object/public/product-images/maintenance/20261008-round3-3/720aeb61-9990-43b9-bb62-237c83290e22.jpg',
      'Shirakiku Shirataki Noodle',
      'https://jmxbvqrvxshlybeomagw.supabase.co/storage/v1/object/public/product-images/maintenance/20261008-round3-3/720aeb61-9990-43b9-bb62-237c83290e22.jpg'
    ),
    (
      'c938177d-6391-4611-a63d-2d74cf9c4980',
      'Christie Family Size Crackers (328- (481 g)',
      '',
      '328-481 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00066721009432.jpg',
      'Christie - Triscuit Original Family Size Crackers, 354 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/christie-triscuit-original-family-size-crackers-id-00066721009432'
    ),
    (
      'cbb78093-3ff4-4c66-8961-f903e3275cd3',
      'Silver Hills Bread (430- (680 g)',
      '',
      '430-680 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00055991040160.jpg',
      'Silver Hills - The Big 16 Bread, 615 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/silver-hills-the-big-16-bread-id-00055991040160'
    ),
    (
      'cdbb879f-f699-4a11-b2a4-7b4be4fd8640',
      'Green Giant Restaurant Sides (283– (340 g)',
      '',
      '283–340 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00190569620273.jpg',
      'Green Giant - Restaurant Sides Cauliflowers Onions, 340 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/green-giant-restaurant-sides-cauliflowers-onions-id-00190569620273'
    ),
    (
      'ce9f2742-1935-4bf5-bc6b-0bd6cbad1004',
      'Synear Dumpling (454 g)',
      '思念灌湯水餃',
      '454g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00818246020047.jpg',
      'Synear - Pork and Leek Dumpling, 454 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/synear-pork-and-leek-dumpling-id-00818246020047'
    ),
    (
      'd078378a-499c-4e5b-be37-fa614fefbf64',
      'Campbell’s Condensed Soup (284 ml)',
      '',
      '284 mL',
      null,
      'https://images.cdn.saveonfoods.com/cell/00063211014778.jpg',
      'Campbell''s - Cheddar Cheese Condensed Soup, 284 Millilitre ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/campbells-cheddar-cheese-condensed-soup-id-00063211014778'
    ),
    (
      'd0fe7d06-ba64-4ba5-906f-e63b198bc41f',
      'Chateraise Ice Cream Cone',
      '샤트레제 아이스크림 콘',
      '80 ml/100 ml x 4',
      null,
      'https://www.galleriasm.com/images/Product/4901762633597.jpg',
      'CHATERAISE UJI GREEN TEA ICE CREAM CONE 100ML*4',
      'https://www.galleriasm.com/Category/ProductDetailView?prodBarcode=4901762633597&BrandNo=002&LangCode=EN'
    ),
    (
      'd2b3e947-3174-4344-bd34-4f2d8496bdf6',
      'BC Blueberry',
      'BC 블루베리',
      'LB',
      null,
      'https://images.cdn.saveonfoods.com/cell/00661731000013.jpg',
      'Blueberries - Clamshell, Local BC, 1 Pound ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/blueberries-clamshell-local-bc-id-00661731000013'
    ),
    (
      'd2fb6805-4944-4d79-adc2-f4c37007db23',
      'Pinty''s Chicken Wings (700- (720 g)',
      '',
      '700-720 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00069094635802.jpg',
      'Pinty''s - Buffalo Chicken Wings, 720 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/pintys-buffalo-chicken-wings-id-00069094635802'
    ),
    (
      'd9b21e3e-b35c-4da3-be44-2f8fb4e9c957',
      'ARMSTRONG Cheese (600 g)',
      '',
      '600 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00061120052423.jpg',
      'Armstrong - Old Cheddar Cheese, 600 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/armstrong-old-cheddar-cheese-id-00061120052423'
    ),
    (
      'e5160acd-c83b-468f-9dd7-edabcee40713',
      'Western Family Cooked Back Ribs',
      '웨스턴패밀리 조리된 등갈비',
      '610 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00062639318574.jpg',
      'Western Family - Fully Cooked BBQ Pork Back Ribs, 610 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/western-family-fully-cooked-bbq-pork-back-ribs-id-00062639318574'
    ),
    (
      'e620f238-5c64-4160-a801-9818ed1f1f56',
      'KELLOGG''S Family Size Cereal (450- (650 g)',
      '',
      '450-650 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00059724101562.jpg',
      'Kellogg''s - Krave Cereal, Family Size, 500 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/kelloggs-krave-cereal-family-size-id-00059724101562'
    ),
    (
      'e7bc0a1a-cfaf-440e-afea-62c204a570b9',
      'Christie Premium Plus Crackers (328- (481 g)',
      '',
      '328-481 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00066721007834.jpg',
      'Christie - Premium Plus Salted Tops Crackers, 450 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/christie-premium-plus-salted-tops-crackers-id-00066721007834'
    ),
    (
      'e845675e-b50c-41bb-b7be-23e7fbe061f8',
      'KitKat Truffle Soda Cracker (Rye Flavour) (420 g)',
      '',
      '420g',
      null,
      'https://images.cdn.saveonfoods.com/cell/04897008413262.jpg',
      'KitKat - Truffle Soda Cracker (Rye Flavour), 420 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/kitkat-truffle-soda-cracker-rye-flavour-id-04897008413262'
    ),
    (
      'e8cbba65-0a9e-4ad4-aaf5-6994a5bd3252',
      'Liberté Méditerranée Yogurt (900 g)',
      '',
      '900 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00065684126538.jpg',
      'Liberte - Mediterranee Vanilla Yogurt, 900 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/liberte-mediterranee-vanilla-yogurt-id-00065684126538'
    ),
    (
      'ea7a607e-5ea3-41c3-b054-71bd44eb77fe',
      'Campbell''s Chunky Soup (515 ml)',
      '',
      '515 mL',
      null,
      'https://images.cdn.saveonfoods.com/cell/00063211283624.jpg',
      'Campbell''s - Chunky Beef Soup, 515 Millilitre ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/campbells-chunky-beef-soup-id-00063211283624'
    ),
    (
      'eae3791a-8222-4ccb-b4ef-d4348e307287',
      'Liberté Greek Yogurt (650- (750 g)',
      '',
      '650-750 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00065684005109.jpg',
      'Liberte - Greek Yogurt Plain, 0% M.F., 750 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/liberte-greek-yogurt-plain-0-mf-id-00065684005109'
    ),
    (
      'eb5c0bd5-00b5-47d6-b1c8-09e7d4194f46',
      'Dr. Oetker Giuseppe Thin Crust Pizza (439- (785 g)',
      '',
      '439-785 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00058336350801.jpg',
      'Dr. Oetker - Giuseppe Hawaiian Thin Crust Pizza, 535 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/dr-oetker-giuseppe-hawaiian-thin-crust-pizza-id-00058336350801'
    ),
    (
      'ebb8b6d8-7efd-4b26-9797-28cd63a81cac',
      'Herbal Essences Conditioner (346 ml)',
      '',
      '346 mL',
      null,
      'https://images.cdn.saveonfoods.com/cell/00190679004857.jpg',
      'Herbal Essences - Body Envy Conditioner, 346 Millilitre ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/herbal-essences-body-envy-conditioner-id-00190679004857'
    ),
    (
      'ebd02533-0323-47c2-a562-94be6a92c227',
      'Yellow Onion (3 lb)',
      '',
      '3 LB',
      null,
      'https://images.cdn.saveonfoods.com/cell/52.jpg',
      'Onions - Yellow, Mesh Bagged, 3lb, 1 Each ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/onions-yellow-mesh-bagged-3lb-id-52'
    ),
    (
      'edaafe7e-1ebc-467e-b69e-a4f6c23e7c2f',
      'Master Kong Drink',
      '마스터콩 음료',
      '500 ml',
      null,
      'https://images.cdn.saveonfoods.com/cell/06921294337983.jpg',
      'Master Kong - Jasmine Tea Drink, 500 Millilitre ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/master-kong-jasmine-tea-drink-id-06921294337983'
    ),
    (
      'edd4cccc-003e-43ca-950c-ab710b5f9088',
      'CATELLI Garden Select Pasta Sauce (600 ml)',
      '',
      '600 mL',
      null,
      'https://images.cdn.saveonfoods.com/cell/00064200010146.jpg',
      'Catelli - Garden Select Garlic & Onion Pasta Sauce, 600 Millilitre ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/catelli-garden-select-garlic-&-onion-pasta-sauce-id-00064200010146'
    ),
    (
      'f0cd20ba-30b9-43ed-915d-4f8e339ff653',
      'Multigrain Bread',
      '잡곡 식빵',
      '400g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00062639420857.jpg',
      'PriceSmart Foods - Multigrain Bread, 400 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/pricesmart-foods-multigrain-bread-id-00062639420857'
    ),
    (
      'f1116fc5-500e-4c6b-8692-1313b73d67fc',
      'Christie Peek Freans Cookies (275- (350 g)',
      '',
      '275-350 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00065987000214.jpg',
      'Peek Freans - Christie Cranberry Citrus Oat Cookies, 290 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/peek-freans-christie-cranberry-citrus-oat-cookies-id-00065987000214'
    ),
    (
      'f2980247-791d-4ac7-bcd8-3fb777910787',
      'Kraft Dinner Macaroni & Cheese (156- (175 g)',
      '',
      '156-175 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00068100904864.jpg',
      'Kraft - Dinner Extra Creamy Macaroni and Cheese Dinner., 175 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/kraft-dinner-extra-creamy-macaroni-and-cheese-dinner-id-00068100904864'
    ),
    (
      'f7a9900c-c97a-4514-a595-828335399edf',
      'Armstrong Shredded Cheese (450- (500 g)',
      '',
      '450-500 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00061120101800.jpg',
      'Armstrong - Tex Mex Shredded Cheese, 500 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/armstrong-tex-mex-shredded-cheese-id-00061120101800'
    ),
    (
      'f9f682ab-bcdf-4604-8657-cfea581e17d5',
      'HBJ Plum Extract (700 ml)',
      '',
      '700 ml',
      null,
      'https://jmxbvqrvxshlybeomagw.supabase.co/storage/v1/object/public/product-images/maintenance/20261008-round3-4/92f6c4f7-279b-4c70-91b4-553ea65f5ab9.jpg',
      'HBJ Plum Extract',
      'https://jmxbvqrvxshlybeomagw.supabase.co/storage/v1/object/public/product-images/maintenance/20261008-round3-4/92f6c4f7-279b-4c70-91b4-553ea65f5ab9.jpg'
    ),
    (
      'facd7d92-b298-40cd-aaee-af5c807309f1',
      'Milk-Bone Soft & Chewy Dog Treats (708 g)',
      '',
      '708 g',
      null,
      'https://images.cdn.saveonfoods.com/cell/00871802007593.jpg',
      'Milk-Bone - Soft & Chewy Dog Treats - Beef Steak Flavour, 708 Gram ',
      'https://www.pricesmartfoods.com/sm/pickup/rsid/2274/product/milkbone-soft-&-chewy-dog-treats-beef-steak-flavour-id-00871802007593'
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
