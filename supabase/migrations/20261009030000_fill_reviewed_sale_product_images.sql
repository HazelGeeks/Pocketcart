-- Fill 153 manually reviewed photos for currently active sale products.
-- Source: official Safeway BC flyer (October 8–14, 2026) and Compliments catalog.
-- No OpenAI calls or generated images. Images exclude surrounding sale prices.
-- Review includes the visible brand, product variant, and listed size/count.
-- Assorted flavours/sizes use a representative within the advertised range.
-- Keep source descriptions for audit and preserve existing/concurrent images.
with verified_images (
  id, expected_english_name, expected_korean_name, expected_unit, expected_brand,
  image_url, official_title, source_url
) as (
  values
    (
      '0032a58a-e527-49f8-a76e-ea89579b5472',
      'Gold Label Naturals Black Forest Smoked Boneless Ham (800 g)',
      '',
      '800 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244856/40660c5e-be06-11f1-ab9c-8a3faa3e3d71/x_large',
      'Gold Label Smoked Boneless Ham — 800 g [Safeway flyer item 1046079685]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '01804469-c386-4e0a-ae63-a8a0e6b53e3b',
      'Finish Auto Dish Tabs (60-105 pk)',
      '',
      '60-105 pk',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244834/3fbaa4d6-be06-11f1-bc3b-aedb008377d3/x_large',
      'Finish Auto Dish Tabs — 60-105 pk [Safeway flyer item 1046079554]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '0c0bf951-4835-4f73-b2f8-4755c102f073',
      'COMPLIMENTS Sour Cream (500 ml)',
      '',
      '500 mL',
      null,
      'https://www.compliments.ca/wp-content/uploads/2021/10/14-mf-sour-cream-500-ml.jpg',
      'Compliments 14% MF Sour Cream 500 ml',
      'https://www.compliments.ca/en/products/14-mf-sour-cream-500-ml/'
    ),
    (
      '0cda6e15-7bab-42d7-bfe8-e48b290c7cd0',
      'COMPLIMENTS Extra Large Cooked Shrimp in Ring with Sauce (312 g)',
      '',
      '312 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244847/3d64727a-be06-11f1-8ad9-e24449711911/x_large',
      'Compliments COMPLIMENTS Extra Large Cooked Shrimp in Ring with Sauce — 312 g [Safeway flyer item 1046079647]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '0d872cb2-b62a-46c7-a739-94a795935845',
      'DAWN Dish Soap or EZ-Squeeze (431-502 mL or 366- (443 ml)',
      '',
      '431-502 mL or 366-443 mL',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244814/1cad031c-be06-11f1-abd0-66d0588d08c1/x_large',
      'Dawn Dish Soap — 431-502 mL or EZ-Squeeze 366-443 mL [Safeway flyer item 1046078976]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '10e1d350-4f4f-4720-8010-50a6d324d781',
      'Best Buy Vanilla Flavoured Wafers (227 g)',
      '',
      '227 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244832/2609a212-be06-11f1-a4eb-f25358dba283/x_large',
      'Best Buy Wafers — 227 g or COMPLIMENTS Rice Crackers 100 g [Safeway flyer item 1046079477]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '11334ecc-e222-4214-a144-a9087e3c4a1c',
      'Wild Sockeye Salmon Fillets (100 g)',
      '',
      '100 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244827/263631c4-be06-11f1-bd24-0a7fd93a0069/x_large',
      'Wild Sockeye Salmon Fillets — previously frozen or frozen [Safeway flyer item 1046079320]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '136bd2d4-0ac2-45ab-af25-3239440815d7',
      'Hayter''s Farm Young Raised Without Antibiotics Frozen Grade A Turkey',
      '',
      'lb',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244856/40fddf16-be06-11f1-ab9c-8a3faa3e3d71/x_large',
      'Hayter''s Farm Young Raised Without Antibiotics Frozen Grade A Turkeys — all Available sizes
4.83/kg [Safeway flyer item 1046079688]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '16ca1dd4-54ef-4bc0-a5ce-91731854b696',
      'Butterball Fresh Turkey',
      '',
      'lb',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244856/41a6de2c-be06-11f1-ab9c-8a3faa3e3d71/x_large',
      'Butterball Fresh Turkey — all available sizes
 8.31/kg [Safeway flyer item 1046079681]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '1b833507-c0ce-4a3a-8f96-211adfb2f19c',
      'Atlantic Canada Large Lobster Tail (6- (7 oz)',
      '',
      '6-7 oz',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244827/31db2d2c-be06-11f1-bd24-0a7fd93a0069/x_large',
      'Atlantic Canada 3-4 oz. Lobster Tail — 85 g or Large 6-7 oz. size 16.99 ea [Safeway flyer item 1046079333]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '1d0bd8cf-277f-487e-8c5d-9f5ac7958f3a',
      'Compliments Traditional 4 oz. Beef Burgers (680- (907 g)',
      '',
      '680-907 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244825/2b0ed714-be06-11f1-8aad-6a94e6efd6b5/x_large',
      'Compliments COMPLIMENTS Beef or Chicken Smashed Burgers or Traditional 4 oz. Beef Burgers — 680-907 g [Safeway flyer item 1046079253]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '219f58b3-e86c-45ff-98c8-3a4bef0554bb',
      'Kraft Pure Salad Dressing or Marinades (355 ml)',
      '',
      '355 mL',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244830/259769fe-be06-11f1-ad39-36a9910fff4b/x_large',
      'Kraft Pure Salad Dressing or Marinades — 355 mL or KRAFT Salad Dressing 710 mL [Safeway flyer item 1046079388]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '21c9daf0-d87f-414c-8ce2-00b1647781b0',
      'All-Butter Chocolate Twists (4 pk, (320 g)',
      '',
      '4 pk, 320 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244827/27d47004-be06-11f1-bd24-0a7fd93a0069/x_large',
      'All-Butter Chocolate Twists — 4 pk 320 g [Safeway flyer item 1046079350]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '23e27e8d-065b-447f-b583-7c5a122c437f',
      'Cranberries (454 g)',
      '',
      '454 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244822/4179731a-be06-11f1-809d-52daae716f4e/x_large',
      'Cranberries — product of Canada 454 g [Safeway flyer item 1046079159]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '247ae572-c7f2-4cb7-959d-769ac6818525',
      'SCHNEIDERS Applewood Smoked Bone In Ham',
      '',
      'lb',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244812/2b2f8a2c-be06-11f1-8f73-360a70d893c6/x_large',
      'Schneiders Applewood Smoked Bone In Ham — 6.59/kg [Safeway flyer item 1046078956]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '24fdefe8-f435-47fe-880b-d453d689b9cc',
      'Panache Angus Roast Beef (100 g)',
      '',
      '100 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244827/238727b2-be06-11f1-bd24-0a7fd93a0069/x_large',
      'Panache Angus Roast Beef — sold by weight [Safeway flyer item 1046079301]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '2691319b-d7d0-4b35-999a-8f37877f6dba',
      'Ziploc Mega Packs (60-270 pk)',
      '',
      '60-270 pk',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244834/3c2cea0e-be06-11f1-bc3b-aedb008377d3/x_large',
      'Ziploc Mega Packs — 60-270 pk [Safeway flyer item 1046079535]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '26e6372e-ef0d-42f6-b36b-b4ee0254744d',
      'PREMIER SEAFOODS Smoked Pink Salmon Nuggets (150 g)',
      '',
      '150 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244819/206e5c30-be06-11f1-ab9c-8a3faa3e3d71/x_large',
      'PREMIER SEAFOODS Smoked Pink Salmon Nuggets — maple, honey garlic or tequila lime & pepper previously frozen 150 g [Safeway flyer item 1046079096]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '279d5e34-0a68-4a19-a6f9-b354723b7229',
      'PUREX Bathroom Tissue (12=24 rolls)',
      '',
      '12=24 rolls',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244839/3674395a-be06-11f1-ab9c-8a3faa3e3d71/x_large',
      'Purex Bathroom Tissue — 12=24 or 8=24 rolls, SPONGETOWELS 3=6 rolls, SCOTTIES Facial Tissue 6 pk or BONTERRA Bathroom Tissue 9=27 rolls, Paper Towels 3=6 rolls or Facial Tissue 3 pk [Safeway flyer item 1046079584]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '290d1acd-ab14-454c-a30d-3ad482dd3593',
      'GRUVI Dry Secco Alcohol-Free Wine (4 x 275 ml)',
      '',
      '4 x 275 mL',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244861/43bd23b0-be06-11f1-ad39-36a9910fff4b/x_large',
      'GRUVI Alcohol-Free Wine — 4 x 75 ML [Safeway flyer item 1046079750]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '2a8818cb-5045-40b2-9bed-33efe6793164',
      'Hostess Snacks (121- (225 g)',
      '',
      '121-225 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244830/28fc163a-be06-11f1-ad39-36a9910fff4b/x_large',
      'Hostess Snacks — selected 121-225 g [Safeway flyer item 1046079390]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '2add7149-0f91-4dc2-bb84-cfda6bdb5d05',
      'COMPLIMENTS Thick Cut Bacon (1 kg)',
      '',
      '1 kg',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244822/3bdd8144-be06-11f1-809d-52daae716f4e/x_large',
      'Compliments COMPLIMENTS Smoked Sausages — 900 g or Thick Cut Bacon 1 kg [Safeway flyer item 1046079155]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '2b555d0a-7897-4807-bff1-944545af606f',
      'Thai Peanut Broccoli Salad (100 g)',
      '',
      '100 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244827/1db2e06a-be06-11f1-bd24-0a7fd93a0069/x_large',
      'Thai Peanut Broccoli Salad or Other Selected Varieties — from the service case [Safeway flyer item 1046079348]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '2ce2601f-eb2a-4843-b9f8-1040a9cd44e1',
      'COMPLIMENTS ORGANIC Herbs (20- (28 g)',
      '',
      '20-28 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244822/3f6271b2-be06-11f1-809d-52daae716f4e/x_large',
      'Compliments COMPLIMENTS ORGANIC Herbs — 20-28 g assorted [Safeway flyer item 1046079145]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '2cf520c6-302f-424a-81c3-bcccb32648b4',
      'Compliments Honey-Roasted Peanuts (700 g)',
      '',
      '700 g',
      null,
      'https://www.compliments.ca/wp-content/uploads/2021/05/honey-roasted-peanuts-700-g.jpg',
      'Compliments Honey Roasted Peanuts 700 g',
      'https://www.compliments.ca/en/products/honey-roasted-peanuts-700-g/'
    ),
    (
      '30f160e5-d746-49d2-8796-cb00adac76ed',
      'Sterling Silver Fresh Boneless Rib Premium Oven Roast',
      '',
      'lb',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244825/210f09f0-be06-11f1-8aad-6a94e6efd6b5/x_large',
      'STERLING SILVER Fresh Boneless Rib Premium Oven Roast or Family Size Grilling Steak — cut by your meat expert from Canada AA grade beef 44.07/kg [Safeway flyer item 1046079297]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '31510d46-4298-458b-a93a-4bc47d776d50',
      'Fresh Skinless Pork Belly, Sliced',
      '',
      'lb',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244825/2ac0e16c-be06-11f1-8aad-6a94e6efd6b5/x_large',
      'Fresh Skinless Pork Belly — sliced 15.41/kg [Safeway flyer item 1046079276]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '33332e6f-b91c-4080-bcac-b161fbd694fb',
      'Compliments Beef Lasagna (2- (2.27 kg)',
      '',
      '2-2.27 kg',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244852/399a23a6-be06-11f1-ad39-36a9910fff4b/x_large',
      'Compliments COMPLIMENTS Beef Lasagna or Macaroni & Cheese — value size 2-2.27 kg [Safeway flyer item 1046079675]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '33428cf7-3f53-407e-a0fa-a856c34ec27b',
      'Charmin Bathroom Tissue (12-48 rolls)',
      '',
      '12-48 rolls',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244834/3bebd35c-be06-11f1-bc3b-aedb008377d3/x_large',
      'Charmin Bathroom Tissue — 12=48 rolls or BOUNTY Paper Towels 4-6 pk [Safeway flyer item 1046079506]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '37dc9523-d131-4155-91b8-3390ba739ad7',
      'COMPLIMENTS Hot Honey (375 g)',
      '',
      '375 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244847/3e93a936-be06-11f1-8ad9-e24449711911/x_large',
      'Compliments COMPLIMENTS Hot Honey — 375 g [Safeway flyer item 1046079643]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '385c6a15-ae50-4710-8390-89cbef1467a6',
      'Anchor’s Bay Cooked Mussel or Clam Meat (340- (360 g)',
      '',
      '340-360 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244827/32c0ca3a-be06-11f1-bd24-0a7fd93a0069/x_large',
      'ANCHOR''S BAY Cooked Mussel or Clam Meat or Seafood Medley — 340-360 g [Safeway flyer item 1046079328]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '3873683e-f733-4e2c-aa1b-ad1c6c4abc11',
      'NUTS FOR CHEESE Dips (210 g)',
      '',
      '210 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244823/33545b88-be06-11f1-bf7e-b6ab99af5701/x_large',
      'Nuts for Cheese Dips — product of Canada 210 g [Safeway flyer item 1046079205]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '39529c73-1328-4661-b11d-52e46621d7cd',
      'COWS CREAMERY 1–3 Year Old Cheddar (150– (200 g)',
      '',
      '150–200 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244847/372efb46-be06-11f1-8ad9-e24449711911/x_large',
      'COW''S CREAMERY 1-3 Year Old, Avonlea or Appletree Smoked Cheddar — 150-200 g or Moo Crisps 50 g 7.99 ea [Safeway flyer item 1046079657]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '3b3b1075-1e31-4782-af57-cb8b7b4f699b',
      'STERLING SILVER Capless Prime Rib (Fresh)',
      '',
      'lb',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244812/3a0da650-be06-11f1-8f73-360a70d893c6/x_large',
      'STERLING SILVER Fresh Capless Prime Rib Premium — Grilling Steak cut by your meat expert. 4.5-5.5 lbs [Safeway flyer item 1046078946]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '3d599b17-e016-4a95-94b2-74895354b9b0',
      'Spanish or Red Onions',
      '',
      'lb',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244823/314c5e4e-be06-11f1-bf7e-b6ab99af5701/x_large',
      'Spanish or Red Onions — product of Canada or USA
no 1 grade 4.39/kg [Safeway flyer item 1046079222]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '3ee97067-39e9-433c-b6cf-7567f6e2c2d8',
      'Mrs. Cubbison''s Croutons (142 g)',
      '',
      '142 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244830/20826b6c-be06-11f1-ad39-36a9910fff4b/x_large',
      'Mrs. Cubbisons Croutons or Texas Toast — 142 g or Salad Strips 99 g [Safeway flyer item 1046079406]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '3f53aa53-6dba-4b35-a3ae-b35689d40998',
      'Dinner, Tray or Butter-Topped Buns (12 pk, 425- (535 g)',
      '',
      '12 pk, 425-535 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244827/2960e1d2-be06-11f1-bd24-0a7fd93a0069/x_large',
      'Dinner, Tray or Butter-Topped Buns — 12 pk
425-535 g [Safeway flyer item 1046079317]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '40b19f43-a56a-46d6-949c-f4d2801158bf',
      'Compliments Party Mix (300 g)',
      '',
      '300 g',
      null,
      'https://www.compliments.ca/wp-content/uploads/2021/05/party-mix-snack-300-g.jpg',
      'Compliments Party Mix Snack 300 g',
      'https://www.compliments.ca/en/products/party-mix-snack-300-g/'
    ),
    (
      '41291263-cd9a-4c7d-9796-6083be113ed0',
      'Compliments Fresh Whole Chicken',
      '',
      'lb',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244825/261215d2-be06-11f1-8aad-6a94e6efd6b5/x_large',
      'Compliments COMPLIMENTS Fresh Whole Chicken — 9.90/kg [Safeway flyer item 1046079270]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '41bda4d9-f5df-47d1-a0cf-f5db36a0a4be',
      'Leclerc Go Pure Oatmeal Bars, Chocolate Chip (175 g)',
      '',
      '175 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244839/33436f08-be06-11f1-ab9c-8a3faa3e3d71/x_large',
      'Leclerc Go Pure Bars — 140-175 g [Safeway flyer item 1046079580]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '482b7682-6b5d-4180-bdbb-0e8ef936cc35',
      'Natrel Coffee Creamer (1 l)',
      '',
      '1 L',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244858/3b90b256-be06-11f1-bd22-c6031d230137/x_large',
      'Natrel Coffee Creamer — 1 L [Safeway flyer item 1046079713]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '4b980bf4-92d3-42ae-801a-1204e15ef64e',
      'Martin''s Apple Sticks (12 pk)',
      '',
      '12 pk',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244830/21492126-be06-11f1-ad39-36a9910fff4b/x_large',
      'Martin''s Apple Sticks — 12 pk [Safeway flyer item 1046079419]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '4c0e3428-1abc-4161-8421-6733c951ca07',
      'Promise Loaves (400- (480 g)',
      '',
      '400-480 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244827/1e874846-be06-11f1-bd24-0a7fd93a0069/x_large',
      'Promise Loaves — 400-480 g [Safeway flyer item 1046079346]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '4cb01755-b4d5-49b1-83c6-df1b03ad0d46',
      'Best Buy Smoked Boneless Ham (1.2 kg)',
      '',
      '1.2 kg',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244856/3fa20048-be06-11f1-ab9c-8a3faa3e3d71/x_large',
      'Smoked Boneless Ham — 1.2 kg [Safeway flyer item 1046079686]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '4ce79a1c-5c40-403e-b399-19fb9c8cce66',
      'LAVAZZA Ground Specialty Coffee (340 g)',
      '',
      '340 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244822/318f131a-be06-11f1-809d-52daae716f4e/x_large',
      'LavAzza Ground Specialty Coffee — 340 g [Safeway flyer item 1046079139]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '4d625411-e814-48c3-8b19-69fe14fca4c6',
      'ACE Bakery White Baguette (350 g)',
      '',
      '350 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244863/4074d52c-be06-11f1-92a3-1a7205226ae6/x_large',
      'ACE Bakery Baguettes — 350-380 g or Demi Baguettes
200-225 g for 2.99 ea [Safeway flyer item 1046079753]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '51bd50d0-2f29-43fd-bedd-698e6476b158',
      'Fresh Boneless Pork Loin Centre & Rib Combo Chops',
      '',
      'lb',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244812/27cb4588-be06-11f1-8f73-360a70d893c6/x_large',
      'Fresh Boneless Pork Loin Centre and Rib Combo Chops, Fresh Pork Shoulder Blade Roasts or Steak Family Size or Fresh Pork Shoulder Picnic Roast — hock removed 8.80/kg [Safeway flyer item 1046078965]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '54686b71-70d9-46f6-8f0f-81d3b45f3c2d',
      'Compliments All-Purpose Flour (2.5 kg)',
      '',
      '2.5 kg',
      null,
      'https://www.compliments.ca/wp-content/uploads/2021/08/all-purpose-flour-2-5-kg.jpg',
      'Compliments All Purpose Flour 2.5 kg',
      'https://www.compliments.ca/en/products/all-purpose-flour-2-5-kg/'
    ),
    (
      '596a9e5e-ccfa-4639-8ecb-e2d26f7dec1f',
      'CP Authentic Asia Frozen Meals (258- (350 g)',
      '',
      '258-350 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244845/3f554a6e-be06-11f1-b260-4644af66372f/x_large',
      'CP Authentic Asia Frozen Meal — 258-350 g selected [Safeway flyer item 1046079619]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '59702838-73b6-428c-a1e8-60bd998c01ad',
      'COMPLIMENTS ORGANIC Baby-Cut Carrots (454 g)',
      '',
      '454 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244823/4af31da6-be06-11f1-bf7e-b6ab99af5701/x_large',
      'Compliments COMPLIMENTS ORGANIC Baby-Cut Carrots — product of USA 454 g [Safeway flyer item 1046079189]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '5981762a-055a-4f85-9ba0-11a19726fc76',
      'Orange Sweet Potatoes',
      '',
      'lb',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244823/3bfd40a6-be06-11f1-bf7e-b6ab99af5701/x_large',
      'Orange Sweet Potatoes — product of Canada,
Canada no 1, 4.39/kg [Safeway flyer item 1046079217]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '5a4b3379-3d71-43db-9749-1bf7ce95d97b',
      'Compliments Cheese Sticks (285 g)',
      '',
      '285 g',
      null,
      'https://www.compliments.ca/wp-content/uploads/2021/05/cheese-sticks-285-g.jpg',
      'Compliments Cheese Sticks 285 g',
      'https://www.compliments.ca/en/products/cheese-sticks-285-g/'
    ),
    (
      '5ab7f593-8d30-426c-8596-681a5dabb369',
      'Johnsonville Breakfast, Dinner or Smoked Pork Sausages (250- (500 g)',
      '',
      '250-500 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244814/213c4000-be06-11f1-abd0-66d0588d08c1/x_large',
      'Johnsonville Breakfast, Dinner or Smoked Pork Sausages — 250-500 g [Safeway flyer item 1046078986]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '5bcdb422-f8e4-47ef-9c73-0f0db96380c0',
      'Panache Salmon Poke (200 g)',
      '',
      '200 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244827/23abc1ee-be06-11f1-bd24-0a7fd93a0069/x_large',
      'Panache Tuna or Salmon Poke — 200 g [Safeway flyer item 1046079352]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '5c4d6207-6ae7-4183-8954-0cc117170c55',
      'KIND Minis (10 pk)',
      '',
      '10 pk',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244830/2341f2b4-be06-11f1-ad39-36a9910fff4b/x_large',
      'Kind KIND — 5 pk or Minis 10 pk [Safeway flyer item 1046079382]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '5f4ec368-2faa-4682-99bf-22679ab5e134',
      'Entremont French Emmental (100 g)',
      '',
      '100 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244850/3f8501b4-be06-11f1-bb1f-caa8e516ace5/x_large',
      'Entremont French Emmental — sold by weight [Safeway flyer item 1046079666]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '60b29b66-bb79-4688-ba82-0124a17243d5',
      'Hayter''s Farm Fresh Raised Without Antibiotics Grade A Turkey',
      '',
      'lb',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244856/41e14d32-be06-11f1-ab9c-8a3faa3e3d71/x_large',
      'Hayter''s Farm Fresh Raised Without Antibiotics Grade A Turkeys — all available sizes
6.1/kg [Safeway flyer item 1046079680]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '63e84a5c-42a0-407c-a7f7-525d984b2ea6',
      'COMPLIMENTS ORGANIC Whole White or Mini Bella Mushrooms (227 g)',
      '',
      '227 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244814/1f5a838c-be06-11f1-abd0-66d0588d08c1/x_large',
      'Compliments COMPLIMENTS ORGANIC Whole White or Mini Bella Mushrooms — 227 g 
product of Canada [Safeway flyer item 1046078978]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '6648aa38-ad08-4818-89f6-34915741c37e',
      'Pampers Wipes (56-72 pk)',
      '',
      '56-72 pk',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244834/387b9cf2-be06-11f1-bc3b-aedb008377d3/x_large',
      'Pampers Wipes — 56-72 pk [Safeway flyer item 1046079527]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '6727b8c5-3c78-4c34-9460-817b8a7cc3c1',
      'Compliments Muffins (4-6 pk, 400- (600 g)',
      '',
      '4-6 pk, 400-600 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244812/2811cc4c-be06-11f1-8f73-360a70d893c6/x_large',
      'Compliments COMPLIMENTS Apple, Apple Crumble or Pumpkin Pie — 650-750 g, Muffins 4-6 pk 400-600 g or Crumb Cakes 465 g [Safeway flyer item 1046078948]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '68fe8134-9584-40f8-89eb-d82e32aa5e8f',
      'JOHNNVICE Deluxe Mixed Nuts (750 g)',
      '',
      '750 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244823/47798d0e-be06-11f1-bf7e-b6ab99af5701/x_large',
      'JOHNVINCE Deluxe Mixed Nuts — 750 g [Safeway flyer item 1046079178]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '691d2416-9c94-4227-adcf-42aacc98f2a3',
      'Compliments Vanilla Ice Cream (1.5 l)',
      '',
      '1.5 L',
      null,
      'https://www.compliments.ca/wp-content/uploads/2022/05/vanilla__icecream.jpg',
      'Compliments Vanilla Ice Cream 1.5 L',
      'https://www.compliments.ca/en/products/vanilla-ice-cream-1-5-l/'
    ),
    (
      '696b2ad8-c203-46c6-9ebc-e751f23efb09',
      'Waterview Market Shrimp with Sauce (454 g)',
      '',
      '454 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244827/256f47da-be06-11f1-bd24-0a7fd93a0069/x_large',
      'Waterview Market Shrimp with Sauce — 454 g [Safeway flyer item 1046079306]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '6b65e935-3b7c-4044-8ccd-287c3bf1a796',
      'THE LITTLE POTATO CO. Potatoes (3 lb)',
      '',
      '3 lb',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244822/33e8c854-be06-11f1-809d-52daae716f4e/x_large',
      'THE LITTLE POTATO CO. Potatoes — 3 lb assorted product of Canada, Canada no 1 [Safeway flyer item 1046079152]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '6cc4d84a-c5b4-4d58-acd2-e7b503af5ba8',
      'DEMPSTER''S or GRIMM''S 10" Tortillas (10")',
      '',
      '10"',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244822/292b56c0-be06-11f1-809d-52daae716f4e/x_large',
      'Dempster''s® Signature Buns or Rolls — 6-12 pk or DEMPSTER''S or GRIMM''S 10" Tortillas selected [Safeway flyer item 1046079122]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '718571df-896d-42ab-8b73-c3d02f5c4eca',
      'Chapman''s Super Novelties (4-18 pk)',
      '',
      '4-18 pk',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244858/478d352a-be06-11f1-bd22-c6031d230137/x_large',
      'Chapman''s Super or No Sugar Added Novelties — 4-18 pk or Li''l Lolly 28 pk
selected [Safeway flyer item 1046079695]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '74067d7e-f665-4749-8e47-b38fbae315b2',
      'Similac Go & Grow Toddler Milk Powder (850 g)',
      '',
      '850 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244834/391a4b0e-be06-11f1-bc3b-aedb008377d3/x_large',
      'Similac Go & Grow Toddler Milk Powder — 850 g [Safeway flyer item 1046079533]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '740a21af-b7ea-4b6b-a67b-737fede1b5e9',
      'Pumpkin Arrangement (each)',
      '',
      'each',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244819/24bb890c-be06-11f1-ab9c-8a3faa3e3d71/x_large',
      'Pumpkin Arrangement — assorted colours [Safeway flyer item 1046079094]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '7b3a8617-4954-4422-9b26-dbdd281d544d',
      'Compliments Cheese Tortellini (350 g)',
      '',
      '350 g',
      null,
      'https://www.compliments.ca/wp-content/uploads/2021/05/naturally-simple-cheese-tortellini-pasta-350-g.jpg',
      'Compliments Naturally Simple Cheese Tortellini Pasta 350 g',
      'https://www.compliments.ca/en/products/naturally-simple-cheese-tortellini-pasta-350-g/'
    ),
    (
      '7e6d2a62-5466-4296-9b23-fc0c5c9ade47',
      'SimplyProtein Snack Bars (125 g)',
      '',
      '125 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244830/2ea61b76-be06-11f1-ad39-36a9910fff4b/x_large',
      'SimplyProtein Snack Bars — 125 g [Safeway flyer item 1046079370]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '806cc668-acb9-47d6-97ff-9509ecd246ce',
      'Catelli Lasagna (200- (500 g)',
      '',
      '200-500 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244860/44ac44c2-be06-11f1-8716-62bfacbaf6c3/x_large',
      'Catelli Lasagna — 200-500 g [Safeway flyer item 1046079726]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '80cd1c8e-67c0-4214-b8a9-cedda3aa584c',
      'Lotte Mochi Ice Cream (270 ml)',
      '',
      '270 mL',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244845/39f71d5e-be06-11f1-b260-4644af66372f/x_large',
      'Lotte Mochi Ice Cream — 270 mL, selected [Safeway flyer item 1046079617]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '8402098b-b742-41d1-8c2c-296cbaf29497',
      'Knorr Sidekicks (120- (162 g)',
      '',
      '120-162 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244858/432d5f00-be06-11f1-bd22-c6031d230137/x_large',
      'Knorr Sidekicks — 120-162 g [Safeway flyer item 1046079714]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '8435c358-6e3c-4c8d-bb8d-b4ddc3ca50a4',
      'Best Buy Frozen Vegetables (750 g)',
      '',
      '750 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244832/24c010da-be06-11f1-a4eb-f25358dba283/x_large',
      'Best Buy Frozen Vegetables — 750 g [Safeway flyer item 1046079497]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '86498db9-97ca-46df-a382-f7dc630ed3e4',
      'COMPLIMENTS Cooked Shrimp in Bag with Cocktail Sauce (680 g)',
      '',
      '680 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244847/3b5ea5fe-be06-11f1-8ad9-e24449711911/x_large',
      'Compliments COMPLIMENTS Cooked Shrimp in Bag with Cocktail Sauce — 680 g [Safeway flyer item 1046079651]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '89b12582-189f-4ce6-aad0-c3f1e5874b57',
      'Mars Chocolate Pouches (324- (347 g)',
      '',
      '324-347 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244858/4110d828-be06-11f1-bd22-c6031d230137/x_large',
      'Mars Chocolate Pouches — 324-347 g [Safeway flyer item 1046079710]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '8b8dd91d-7044-46fe-bec4-a607a1bf77f8',
      'Value Size Twice Baked Potatoes (100 g)',
      '',
      '100 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244827/2954a192-be06-11f1-bd24-0a7fd93a0069/x_large',
      'Value Size Twice Baked Potatoes — sold by 100 g available hot or chilled or individual size for 1.19/100 g [Safeway flyer item 1046079322]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '8d4c61ca-44a7-4f46-8a39-4bdaea391332',
      'COMPLIMENTS Baby Spinach or Spring Mix (312 g)',
      '',
      '312 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244823/41491620-be06-11f1-bf7e-b6ab99af5701/x_large',
      'Compliments COMPLIMENTS Baby Spinach or Spring Mix — product of Canada or USA 312 g [Safeway flyer item 1046079213]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '957181f2-8735-44e1-a54d-b331da3d5ee9',
      'Hayter''s Farm Raised Without Antibiotics Frozen Grade A Turkey',
      '',
      'lb',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244839/34a239ba-be06-11f1-ab9c-8a3faa3e3d71/x_large',
      'Hayter''s Farm Raised Without Antibiotics Frozen Grade A Turkeys — all available sizes
4.83/kg [Safeway flyer item 1046079596]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '95848757-6a39-4779-a23c-ff19dd485f01',
      'OLÉ Non-Alcoholic Mocktails (4 x 355 ml)',
      '',
      '4x355 mL',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244822/36aca416-be06-11f1-809d-52daae716f4e/x_large',
      'Ole Non-Alcoholic Mocktails — 4x355 mL [Safeway flyer item 1046079114]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '97593eb7-5547-4259-9d1f-ff75801cfda0',
      'COMPLIMENTS Pickles (1 l)',
      '',
      '1 L',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244822/2d48fb36-be06-11f1-809d-52daae716f4e/x_large',
      'Compliments COMPLIMENTS Pickles — 1 L [Safeway flyer item 1046079120]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '98a547a9-cd39-4c70-a5ab-0f3f11f8fb61',
      'Grace Jamaican Jerk Seasoning (284- (340 g)',
      '',
      '284-340 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244845/35a2debe-be06-11f1-b260-4644af66372f/x_large',
      'Grace Jamaican Jerk Seasoning — selected 284-340 g [Safeway flyer item 1046079615]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '98dde2fc-8591-48d2-866e-59903486f7ba',
      'Panache 100% Pure Maple Syrup (375 ml)',
      '',
      '375 mL',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244830/26ee9f34-be06-11f1-ad39-36a9910fff4b/x_large',
      'Panache Maple Syrup 100% Pure — 375 mL [Safeway flyer item 1046079431]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '99387c6a-0b34-46e4-a01d-dd743e2e02c8',
      'Compliments Value Size Candy (700– (750 g)',
      '',
      '700–750 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244832/2721af6e-be06-11f1-a4eb-f25358dba283/x_large',
      'Compliments COMPLIMENTS Value Size Candy — 700-750 g [Safeway flyer item 1046079481]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '9e0aec5f-06eb-47ce-a23c-4e5b641c9df3',
      'Yoplait Skyr Yogurt (750 g)',
      '',
      '750 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244858/3f81ea42-be06-11f1-bd22-c6031d230137/x_large',
      'Yoplait Skyr — 750 g, Yop 6 pk or LIBERTÉ Kéfir 1 L [Safeway flyer item 1046079699]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      '9e3f6fbc-8c16-4158-b692-52479ccd30a7',
      'Compliments Baby Diapers (64-104 pk)',
      '',
      '64-104 pk',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244834/37425a60-be06-11f1-bc3b-aedb008377d3/x_large',
      'Compliments COMPLIMENTS Baby Diapers — 64-104 pk [Safeway flyer item 1046079531]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'a04a2e54-d9cd-4aa9-82ef-77c34fff45a2',
      'Dr. Oetker Giuseppe Stuffed Crust Pizza (685- (771 g)',
      '',
      '685-771 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244858/44f74a12-be06-11f1-bd22-c6031d230137/x_large',
      'Dr. Oetker Giuseppe Stuffed Crust Pizza — 685-771 g or Suprema Pizza 475-520 g [Safeway flyer item 1046079691]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'a0874f92-8a69-47b8-b619-614f5fcfa4dc',
      'Natrel Plus Lactose-Free Milk Beverage (2 l)',
      '',
      '2 L',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244858/3bd1cbd8-be06-11f1-bd22-c6031d230137/x_large',
      'Natrel Plus Lactose-Free Milk Beverage — 2 L [Safeway flyer item 1046079715]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'a0a684b9-3b2f-4d1a-9088-02840ee869b1',
      'Compliments Onion Soup Mix (57 g)',
      '',
      '57 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244830/278f5064-be06-11f1-ad39-36a9910fff4b/x_large',
      'Compliments COMPLIMENTS Onion Soup Mix — 57 g or Cream Soup or Broth 284 mL [Safeway flyer item 1046079425]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'a2d418ad-429f-4fb6-84e0-73d97161bdc8',
      'Black Diamond Cheestrings (12-16 pk, 252- (336 g)',
      '',
      '12-16 pk, 252-336 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244860/3fae90ba-be06-11f1-8716-62bfacbaf6c3/x_large',
      'Black Diamond Cheestrings — 12-16 pk 252-336 g selected [Safeway flyer item 1046079728]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'a2f9b404-2d41-44e3-86d3-2a05f28e23ea',
      'COMPLIMENTS Frozen Fruit (300- (600 g)',
      '',
      '300-600 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244812/3402e02c-be06-11f1-8f73-360a70d893c6/x_large',
      'Compliments COMPLIMENTS Frozen Fruit — 300-600 g [Safeway flyer item 1046078919]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'a4176fbe-3e6d-4c13-b297-39aa171efcc3',
      'Powerade Team Pack (24 x 591 ml)',
      '',
      '24 x 591 mL',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244860/4563d60a-be06-11f1-8716-62bfacbaf6c3/x_large',
      'Powerade Team Pack — 24x591 mL [Safeway flyer item 1046079731]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'a420bc99-9a01-495a-9b14-e7da812f27a1',
      'HAYTER''S Young Turkey (Frozen)',
      '',
      'lb',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244856/40fddf16-be06-11f1-ab9c-8a3faa3e3d71/x_large',
      'Hayter''s Farm Young Raised Without Antibiotics Frozen Grade A Turkeys — all Available sizes
4.83/kg [Safeway flyer item 1046079688]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'a9585d2d-910d-4c90-8c29-e8693e7e7d2d',
      'Tinted Sunflowers (5-stem)',
      '',
      '5-stem',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244819/24adb052-be06-11f1-ab9c-8a3faa3e3d71/x_large',
      'Tinted Sunflowers — 5-stem
grown in British Columbia [Safeway flyer item 1046079084]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'aae97fa3-8017-485d-ac53-2817aa36e4a1',
      'PANACHE Grana Padano (200 g)',
      '',
      '200 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244847/3a888672-be06-11f1-8ad9-e24449711911/x_large',
      'Panache Grana Padano — 200 g [Safeway flyer item 1046079658]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'ab159bd3-08c9-4d12-bdda-dd6b702102fd',
      'Almond Tarts (6 pk, 270- (400 g)',
      '',
      '6 pk, 270-400 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244827/2f128d6a-be06-11f1-bd24-0a7fd93a0069/x_large',
      'Almond or Butter Tarts — 6 pk 270-400 g [Safeway flyer item 1046079357]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'af31531a-8009-4b73-bd5d-57ec2f75607b',
      'Asian Inspirations Entrées (400 g)',
      '',
      '400 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244825/24b1af22-be06-11f1-8aad-6a94e6efd6b5/x_large',
      'ASIAN INSPIRATIONS Entrées — 400 g or MULDOON''S Boneless Dry Pork Bites or Mini Corn Dogs 300-400 g [Safeway flyer item 1046079259]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'b05b14d3-49fc-4666-929b-436fe5e299c2',
      'MINA Burgers (552- (600 g)',
      '',
      '552-600 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244845/3d4fb10a-be06-11f1-b260-4644af66372f/x_large',
      'Mina Breaded Chicken Strips or Nuggets, Stuffed Chicken or Burgers — 552-600 g [Safeway flyer item 1046079600]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'b27a25f8-185a-47f7-9d7e-5f71ccd780f3',
      'Compliments Greek Yogurt (650 g)',
      '',
      '650 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244832/2555ca26-be06-11f1-a4eb-f25358dba283/x_large',
      'Compliments COMPLIMENTS Greek Yogurt — 650 g [Safeway flyer item 1046079489]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'b639d483-551c-40ef-8b4b-159d0e1c3be0',
      'In-Store Made Chili Crisp Flavoured Cheese Ball (100 g)',
      '',
      '100 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244847/40abdb80-be06-11f1-8ad9-e24449711911/x_large',
      'In-Store Made Chili Crisp Flavoured Cheese Ball — or select varieties sold by 100 g [Safeway flyer item 1046079660]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'b9d2677b-63f3-439e-af5b-7cbffeb3a7d1',
      'Best Buy 100% Orange Juice Blend (1.6 l)',
      '',
      '1.6 L',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244852/37238c52-be06-11f1-ad39-36a9910fff4b/x_large',
      'Best Buy 100% Orange Juice Blend — 1.6 L [Safeway flyer item 1046079673]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'bf828b49-c2e6-4fb4-9f34-9ea892c3a867',
      'Handheld Savoury Pastries, Spinach & Feta, Bacon & Egg, or Other Select Varieties (76- (95 g)',
      '',
      '76-95 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244845/3c1adf44-be06-11f1-b260-4644af66372f/x_large',
      'Handheld Savoury Pastries — spinach & feta, bacon & egg or other select varieties 76-95 g
available chilled [Safeway flyer item 1046079634]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'bf9d6dc5-c3b4-4088-b41b-82c9e878d477',
      'Royal Asia Sesame Shrimp Toasts (284 g)',
      '',
      '284 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244845/3cc724e8-be06-11f1-b260-4644af66372f/x_large',
      'Royal Asia Shrimp Wonton Soup — 474 mL or Sesame Shrimp Toasts, Sichuan Shrimp Wontons or Prawn Dumplings 203-284 g [Safeway flyer item 1046079630]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'bfbb1395-88b3-4d58-8138-2f7b90672f69',
      'Red or Green Seedless Grapes (Jumbo)',
      '',
      'lb',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244812/3ac16348-be06-11f1-8f73-360a70d893c6/x_large',
      'Jumbo Red or Green Seedless Grapes — Product of USA no 1 grade 5.49/kg [Safeway flyer item 1046078968]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'bfd8ffe1-a999-4b1e-a534-81e19f492b0d',
      'Butterball Frozen Turkey, Regular or Stuffed',
      '',
      'lb',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244856/3fc37930-be06-11f1-ab9c-8a3faa3e3d71/x_large',
      'Butterball Frozen Turkey — regular or stuffed all available sizes 6.11/kg [Safeway flyer item 1046079683]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'c1fe5bbd-2085-4eca-b5fa-71836e038c19',
      'Organic Raspberries or Blackberries clamshell (170 g)',
      '',
      '170 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244823/45121a40-be06-11f1-bf7e-b6ab99af5701/x_large',
      'Organic Raspberries or Blackberries — clamshell 
product of USA or Mexico 170 g [Safeway flyer item 1046079175]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'c27da695-e378-4514-9089-3a5277e0bd3f',
      'Compliments Bagels (6 pk)',
      '',
      '6 pk',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244839/33e0d018-be06-11f1-ab9c-8a3faa3e3d71/x_large',
      'Compliments COMPLIMENTS Bagels — 6 pk [Safeway flyer item 1046079575]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'c2c28140-7ae2-44c3-bcd0-1cf6d1f77305',
      'SARDO Olive & Antipasto Tray (750- (800 g)',
      '',
      '750-800 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244819/2acd587a-be06-11f1-ab9c-8a3faa3e3d71/x_large',
      'Antipasto Classico — 200 g or SARDO Olive & Antipasto Tray 750-800 g [Safeway flyer item 1046079107]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'c522c6c3-721f-4e2f-924b-6e95f9d2fdf5',
      'Nestlé Tablets, Assorted (95- (105 g)',
      '',
      '95-105 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244858/3a8af812-be06-11f1-bd22-c6031d230137/x_large',
      'Nestle Tablets — 95-105 g assorted selection [Safeway flyer item 1046079704]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'c59fea79-b5fa-4a9e-931e-4020d235c11a',
      'ACE Bakery Bistro Breads (595 g)',
      '',
      '595 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244863/3eac98f6-be06-11f1-92a3-1a7205226ae6/x_large',
      'ACE Bakery Bistro Breads — 595 g [Safeway flyer item 1046079755]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'c956e8a9-1693-49fa-8653-6c65469f4d15',
      'Compliments Naturally Simple Black Tiger Shrimp in Ring with Sauce (515 g)',
      '',
      '515 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244827/244efeae-be06-11f1-bd24-0a7fd93a0069/x_large',
      'Compliments COMPLIMENTS NATURALLY SIMPLE Black Tiger Shrimp In Ring with Sauce — 515 g [Safeway flyer item 1046079340]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'c9dba88d-ac24-4cc2-b5ac-adbd44cd7a5e',
      'SARDO Antipasto Tray (750– (800 g)',
      '',
      '750–800 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244819/2acd587a-be06-11f1-ab9c-8a3faa3e3d71/x_large',
      'Antipasto Classico — 200 g or SARDO Olive & Antipasto Tray 750-800 g [Safeway flyer item 1046079107]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'ca5ab6d1-3a93-44f7-947d-95ec8791b161',
      'SunRype Slim Low-Calorie Beverage (1.36 l)',
      '',
      '1.36 L',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244860/4c518cf0-be06-11f1-8716-62bfacbaf6c3/x_large',
      'SunRype Slim Low-Calorie Beverage — 1.36 L
Assorted flavours [Safeway flyer item 1046079746]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'cb3848d3-0fba-4515-b09d-7cb2caedc428',
      'Dainty Basmati Rice (1.6 kg)',
      '',
      '1.6 kg',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244845/402856d4-be06-11f1-b260-4644af66372f/x_large',
      'Dainty Basmati Rice — 1.6 kg selected [Safeway flyer item 1046079611]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'cd83421b-77a4-4325-8379-f6be29c18bd0',
      'Piller’s Salami, Assorted (100 g)',
      '',
      '100 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244827/2bf62fba-be06-11f1-bd24-0a7fd93a0069/x_large',
      'Piller''s Salami — assorted [Safeway flyer item 1046079314]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'cdf2b1a6-42f5-4c88-a4ef-e59b81fe78c5',
      'COMPLIMENTS Atlantic Salmon (150 g)',
      '',
      '150 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244847/40fb5f3e-be06-11f1-8ad9-e24449711911/x_large',
      'Compliments COMPLIMENTS Smoked Steelhead, Atlantic Salmon or Gravlax — 150 g or Smoked Sockeye 140 g [Safeway flyer item 1046079652]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'ce59a50f-e672-4722-a8a2-1bc53995e74f',
      'In-Store Made Chili Crisp Flavoured Cheese Ball (100 g)',
      '',
      '100 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244847/40abdb80-be06-11f1-8ad9-e24449711911/x_large',
      'In-Store Made Chili Crisp Flavoured Cheese Ball — or select varieties sold by 100 g [Safeway flyer item 1046079660]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'cf9c94ae-59d5-4601-9170-1bbe0351a802',
      'Compliments Pure Pumpkin (796 ml)',
      '',
      '796 mL',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244830/26fc4d1e-be06-11f1-ad39-36a9910fff4b/x_large',
      'Compliments COMPLIMENTS Pure Pumpkin — 796 mL or Flour 2.5 kg [Safeway flyer item 1046079427]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'd10c7c4f-d3d7-4ca9-9301-4204ecdd40d9',
      'Compliments Exceptional Chocolate Chip Cookies (280 g)',
      '',
      '280 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244860/42d76988-be06-11f1-8716-62bfacbaf6c3/x_large',
      'Compliments COMPLIMENTS Exceptional Chocolate Chip Cookies — 280 g [Safeway flyer item 1046079748]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'd15daa1e-c54c-4a82-b6d9-3b57daec1f60',
      'Compliments Cookies (270- (350 g)',
      '',
      '270-350 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244860/42ffd9b8-be06-11f1-8716-62bfacbaf6c3/x_large',
      'Compliments COMPLIMENTS Cookies — selected 270-350 g [Safeway flyer item 1046079729]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'd1a88b73-d18b-42dc-88f2-54e84bd31958',
      'Purex Bathroom Tissue (8-16 rolls)',
      '',
      '8-16 rolls',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244834/43df1ed4-be06-11f1-bc3b-aedb008377d3/x_large',
      'Purex Bathroom Tissue — 8=16 rolls or SPONGETOWELS Ultra 2=4 rolls [Safeway flyer item 1046079524]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'd32c9064-c162-45f8-944a-6e8784c1f6c8',
      'Premium Ecuadorian Roses (each)',
      '',
      'each',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244819/206a20c0-be06-11f1-ab9c-8a3faa3e3d71/x_large',
      'Premium Ecuadorian Roses — sold by weight [Safeway flyer item 1046079091]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'd49661a8-a9ca-471d-b72d-2c8da90ea607',
      'Santosh Gold Garlic Naan (6 naan, (600 g)',
      '',
      '6 naan, 600 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244863/41e73ecc-be06-11f1-92a3-1a7205226ae6/x_large',
      'Santosh Gold Naan or Naan Bites — 500-600 g [Safeway flyer item 1046079756]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'db1fd7a2-2139-42a7-b013-f53ae748c30c',
      'Compliments Organic Large Eggs (12 pk)',
      '',
      '12 pk',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244832/245371a0-be06-11f1-a4eb-f25358dba283/x_large',
      'Compliments COMPLIMENTS ORGANIC Large Eggs — 12 pk [Safeway flyer item 1046079493]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'dd1d789f-f936-4344-831e-6f73ef69e2cd',
      'Compliments Dips or Hummus (454 g)',
      '',
      '454 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244827/27d8f926-be06-11f1-bd24-0a7fd93a0069/x_large',
      'Compliments COMPLIMENTS Dips or Hummus — 454 g [Safeway flyer item 1046079311]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'dd64e194-79a3-4953-a0b5-1be0f25ed844',
      'COMPLIMENTS Rainbow Peppers (3 pk)',
      '',
      '3 pk',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244823/391051e4-be06-11f1-bf7e-b6ab99af5701/x_large',
      'Compliments COMPLIMENTS Rainbow Peppers — product of Western Canada 3 pk [Safeway flyer item 1046079233]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'dda1a4eb-cd18-44b2-8b95-6a48acf864b3',
      'CARL JUNG Cuvée White De-Alcoholized Wine (750 ml)',
      '',
      '750 mL',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244861/464967a6-be06-11f1-ad39-36a9910fff4b/x_large',
      'Carl Jung De-Alcoholized Wine — 750 ml [Safeway flyer item 1046079752]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'de9abe31-3e3a-4cac-b495-4de3c5cc1d0b',
      'Nestlé Full Size Bars, Assorted (14 pk, (638 g)',
      '',
      '14 pk 638 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244858/3a0f7138-be06-11f1-bd22-c6031d230137/x_large',
      'Nestle Full Size Bars — assorted
14 pk 638 g [Safeway flyer item 1046079703]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'e01c75a9-8ba6-485d-9b8a-749f7415c3eb',
      'Nature Valley Granola Bars (324- (525 g)',
      '',
      '324-525 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244860/49cf2cb2-be06-11f1-8716-62bfacbaf6c3/x_large',
      'NATURE VALLEY | BETTY CROCKER Granola Bars or Fruit Snacks — 324-525 g selected* [Safeway flyer item 1046079741]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'e1fb776f-c9b1-4c3e-9f31-f8225bc50f0a',
      'Febreze Small Spaces (7.5 ml)',
      '',
      '7.5 mL',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244834/409f5054-be06-11f1-bc3b-aedb008377d3/x_large',
      'Febreze Small Spaces — 7.5 mL or Car Clips 2 mL selected [Safeway flyer item 1046079556]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'e39e1471-beb0-4e04-b1c6-071024576cee',
      'Fall Cupcake Mums (each)',
      '',
      'each',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244819/1fcf34fc-be06-11f1-ab9c-8a3faa3e3d71/x_large',
      'Fall Cupcake Mums — assorted colours [Safeway flyer item 1046079099]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'e4ac5e1a-23d9-430f-a37b-10e2ad28a360',
      'Gala or Ambrosia Apples',
      '',
      'lb',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244823/35353f8a-be06-11f1-bf7e-b6ab99af5701/x_large',
      'Gala or Ambrosia Apples — product of British Columbia, Canada extra fancy grade 4.39/kg [Safeway flyer item 1046079244]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'e72d71c3-ee92-4496-8c63-9fcfe0ecd193',
      'Campbell’s Ready to Serve Soup (510- (515 ml)',
      '',
      '510-515 mL',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244860/3e6ac4ee-be06-11f1-8716-62bfacbaf6c3/x_large',
      'Campbell''s Ready To Serve Soup — 510-515 mL [Safeway flyer item 1046079736]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'e83d84de-a2ad-4808-ad20-1d874642a1d3',
      'In-Store Prepared Seacuterie Board with Smoked Salmon, Shrimp and Crab Flavoured Seafood (350– (380 g)',
      '',
      '350–380 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244847/3ce515ca-be06-11f1-8ad9-e24449711911/x_large',
      'In-Store Prepared Seacuterie Boards with Smoked Salmon, Shrimp and Crab Flavoured Seafood — 350-380 g [Safeway flyer item 1046079649]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'eaf8941a-e733-412b-8d0e-440f726673e4',
      'Compliments Lager Blonde De-Alcoholized Beer (6 x 355 ml)',
      '',
      '6 x 355 mL',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244861/43c6a7c8-be06-11f1-ad39-36a9910fff4b/x_large',
      'Compliments COMPLIMENTS De-Alcoholized Beer — 6x355 ml [Safeway flyer item 1046079751]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'eb0a4b3b-17cd-4954-84bd-896932d428e9',
      'High Liner Signature Cuts, Pan-Seared, Breaded or Battered Premium Fish (425- (540 g)',
      '',
      '425-540 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244827/2b0e9c36-be06-11f1-bd24-0a7fd93a0069/x_large',
      'HIGH LINER® Signature Cuts, Pan-Sear or Breaded or Battered Premium Fish — 425-540 g [Safeway flyer item 1046079309]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'ec4170e2-479d-488b-bfec-a16c06e13a6d',
      'Club House Organic Spice Bags (10- (57 g)',
      '',
      '10-57 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244830/309871d6-be06-11f1-ad39-36a9910fff4b/x_large',
      'Club House Organic Spice Bags — 10-57 g [Safeway flyer item 1046079433]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'edcfad4b-028f-41d7-b426-3879bb32d75c',
      'Grona Cushions Puff Pastries (328 g)',
      '',
      '328 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244845/3946fa14-be06-11f1-b260-4644af66372f/x_large',
      'Grona Cushions Puff Pastries — 328 g selected [Safeway flyer item 1046079602]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'ef17560d-fdda-4ff9-822c-a6ad0a35d518',
      'Lesley Stowe Crisps (100- (150 g)',
      '',
      '100-150 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244827/1e7ff87a-be06-11f1-bd24-0a7fd93a0069/x_large',
      'lesley stowe Crisps — selected
100-150 g [Safeway flyer item 1046079365]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'f1362acf-9d8f-4f49-957c-4837eb60ed4d',
      'Compliments Dry Roasted Peanuts (700 g)',
      '',
      '700 g',
      null,
      'https://www.compliments.ca/wp-content/uploads/2021/05/dry-roasted-peanuts-without-oil-700-g.jpg',
      'Compliments Dry Roasted Peanuts Without Oil 700 g',
      'https://www.compliments.ca/en/products/dry-roasted-peanuts-without-oil-700-g/'
    ),
    (
      'f192a673-c1bf-440d-9da5-fe3179fa9da1',
      'TOFURKY Roast & Gravy Combo (1.13 kg)',
      '',
      '1.13 kg',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244823/48969880-be06-11f1-bf7e-b6ab99af5701/x_large',
      'Tofurky Roast & Gravy Combo — 1.13 kg [Safeway flyer item 1046079200]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'f52a6ce8-918f-4129-b76a-0d2d5d54d200',
      'ACE BAKERY Baguettes (350- (380 g)',
      '',
      '350-380 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244863/4074d52c-be06-11f1-92a3-1a7205226ae6/x_large',
      'ACE Bakery Baguettes — 350-380 g or Demi Baguettes
200-225 g for 2.99 ea [Safeway flyer item 1046079753]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'f5dd9ea9-2e17-44c7-8ba1-4a9a75403253',
      'Skyflakes Saltine Crackers (800 g)',
      '',
      '800 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244845/3b6b038a-be06-11f1-b260-4644af66372f/x_large',
      'SkyFlakes Saltine Crackers — 800 g [Safeway flyer item 1046079624]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'f74939ad-7b3e-4885-8366-c051818d0286',
      'Vega Protein + Supergreens (510- (526 g)',
      '',
      '510-526 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244830/29c17ca4-be06-11f1-ad39-36a9910fff4b/x_large',
      'Vega Protein + Supergreens — 510-526 g [Safeway flyer item 1046079378]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'f7cd564b-1812-4612-890a-9804f6e0beec',
      'Tylenol Complete (40 pk)',
      '',
      '40 pk',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244834/424e0f76-be06-11f1-bc3b-aedb008377d3/x_large',
      'Tylenol Complete — 40 pk or BENYLIN All-In-One 250-270 mL or 40 pk selected* [Safeway flyer item 1046079512]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'f7f0aa43-f595-43b7-8011-337d83dce2f9',
      'Fresh 100% Lean Ground Beef Burgers',
      '',
      'lb',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244825/2fe51a32-be06-11f1-8aad-6a94e6efd6b5/x_large',
      'Fresh 100% Lean Ground Beef Burgers Family Size — no additives or fillers 4 pk 19.82/kg [Safeway flyer item 1046079273]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'fa3bc900-a689-4f8a-857d-3020c9ca3375',
      'Marcangelo Frozen Jumbo Sausages, assorted hot, mild, fennel or Barese (375- (675 g)',
      '',
      '375-675 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244865/455a53fa-be06-11f1-b3bd-42a3531c793e/x_large',
      'Marcangelo frozen Jumbo Sausages — hot, mild or fennel or Barese 375-675 g [Safeway flyer item 1046079759]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'fa3db237-2d89-460c-b02d-9defd1bf6d7b',
      'Mars Chocolate Singles (30- (57 g)',
      '',
      '30-57 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244858/40bec646-be06-11f1-bd22-c6031d230137/x_large',
      'Mars Chocolate Singles — 30-57 g [Safeway flyer item 1046079706]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'fc2b47a2-7113-4e99-9623-3802c38be85b',
      'COMPLIMENTS Broth (900 ml)',
      '',
      '900 mL',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244822/2ee878a4-be06-11f1-809d-52daae716f4e/x_large',
      'Compliments COMPLIMENTS Broth — 900 mL [Safeway flyer item 1046079117]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'fc5313a6-1aa6-4451-9672-398fb9f7ccd5',
      'Blue Diamond Nut Thins (120 g)',
      '',
      '120 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244830/2fef5a56-be06-11f1-ad39-36a9910fff4b/x_large',
      'Blue Diamond Nut Thins — 120 g or CRUNCHMASTER Multi-Seed Crackers 128 g [Safeway flyer item 1046079380]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'fef5557d-1019-4717-9c9f-beaa37ae8439',
      'Whole Maple Baked Ham (100 g)',
      '',
      '100 g',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244827/31f5bc46-be06-11f1-bd24-0a7fd93a0069/x_large',
      'Whole Maple Baked Ham — sold by 100 g
available hot or chilled [Safeway flyer item 1046079361]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'ff1adfe1-ebe1-4333-a536-9c1243b9060f',
      'Johnson''s Baby Shampoo (400 ml)',
      '',
      '400 mL',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244834/3829b716-be06-11f1-bc3b-aedb008377d3/x_large',
      'Johnson''s Baby Shampoo — 400 mL [Safeway flyer item 1046079515]',
      'https://www.safeway.ca/flyer?store_id=11913'
    ),
    (
      'ffcb0546-9e49-462e-a29d-54a178081deb',
      'Starbucks Creamers (828 ml)',
      '',
      '828 mL',
      null,
      'https://cdn.flippenterprise.net/page_pdf_images/24244832/284de556-be06-11f1-a4eb-f25358dba283/x_large',
      'Starbucks Creamers — 828 mL [Safeway flyer item 1046079487]',
      'https://www.safeway.ca/flyer?store_id=11913'
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
  and product.brand is not distinct from verified.expected_brand
  and exists (
    select 1
    from public.product_prices as price
    where price.product_id = product.id
      and coalesce(price.valid_from, price.observed_at) <= now()
      and (price.valid_to is null or price.valid_to >= now())
  );
