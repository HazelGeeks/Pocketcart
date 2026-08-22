const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("the grocery photo is local and licensed", () => {
  const photoPath = path.join(projectRoot, "assets/photos/fresh-grocery-basket.jpg");
  const sourceNotes = read("assets/photos/README.md");
  const discovery = read("src/components/nativeApp/HomePhotoDiscovery.tsx");

  assert.equal(fs.existsSync(photoPath), true);
  assert.ok(fs.statSync(photoPath).size > 100_000);
  assert.match(sourceNotes, /Unsplash License/);
  assert.equal(discovery.match(/source=\{groceryPhoto\}/g)?.length, 1);
  assert.doesNotMatch(discovery, /Photo picks|Catalog images only/);
});

test("photo discovery appears only after the default catalog has loaded", () => {
  const catalog = read("src/components/nativeApp/HomeCatalogPanel.tsx");

  assert.match(catalog, /!props\.loading/);
  assert.match(catalog, /props\.products\.length > 0/);
  assert.match(catalog, /props\.category === "All"/);
  assert.match(catalog, /props\.onSaleOnly/);
  assert.match(catalog, /<HomePhotoBanner/);
  assert.doesNotMatch(catalog, /HomePhotoPicks/);
});

test("category filters use catalog photography with an icon fallback", () => {
  const controls = read("src/components/nativeApp/HomeCatalogControls.tsx");
  const tile = read("src/components/nativeApp/CategoryFilterTile.tsx");

  assert.match(controls, /categoryImageUrls\[categoryImageKey\(option\)\]/);
  assert.match(tile, /source=\{\{ uri: imageUrl \}\}/);
  assert.match(tile, /<CategoryPlaceholderIcon/);
});

test("home sorting moves behind the search filter action", () => {
  const controls = read("src/components/nativeApp/HomeCatalogControls.tsx");
  const catalogHook = read("src/hooks/useNativeCatalog.ts");
  const productsService = read("src/services/marketData/products.ts");
  const styles = read("src/screens/nativeAppStyles/homeControlStyles.ts");
  const headerStyles = read("src/screens/nativeAppStyles/headerActionStyles.ts");
  const styleIndex = read("src/screens/nativeAppStyles/index.ts");

  assert.doesNotMatch(controls, /Search groceries and compare current sale prices/);
  assert.match(controls, /accessibilityLabel="Sort and filter products"/);
  assert.match(controls, /<AppIcon name="filter"/);
  assert.match(controls, /homeSortMenu/);
  assert.match(controls, /Show only products with an active sale/);
  assert.match(controls, /value=\{onSaleOnly\}/);
  assert.match(catalogHook, /useState\(true\)/);
  assert.match(catalogHook, /onSaleOnly,/);
  assert.match(productsService, /!onSaleOnly \|\| priceSummaries\.data\.has\(product\.id\)/);
  assert.match(productsService, /listProducts\(\{ onSaleOnly: false \}\)/);
  assert.doesNotMatch(controls, /sortSegmentedControl|sortSegment/);
  assert.match(styles, /searchInput:[\s\S]*height: 42/);
  assert.match(headerStyles, /headerIconButton:[\s\S]*width: 44,[\s\S]*height: 44/);
  assert.match(styles, /homeFilterButton:[\s\S]*width: 44,[\s\S]*height: 44/);
  assert.match(styleIndex, /\.\.\.homeControlStyles/);
  assert.match(styleIndex, /\.\.\.headerActionStyles/);
});

test("home products use a borderless feed with row dividers", () => {
  const productList = read("src/components/nativeApp/HomeProductList.tsx");
  const catalogUtils = read("src/components/nativeApp/homeCatalogUtils.ts");
  const styles = read("src/screens/nativeAppStyles/catalogStyles.ts");

  assert.match(productList, /style=\{st\.homeProductRow\}/);
  assert.doesNotMatch(productList, /First tracked price|No price history/);
  assert.match(productList, /trendLabel && previous !== null/);
  assert.match(productList, /st\.homeProductName[\s\S]*st\.homeDealInline[\s\S]*\{displayName\}/);
  assert.doesNotMatch(productList, /<Text style=\{st\.tag\}>Deal<\/Text>/);
  assert.match(productList, /style=\{st\.homeTrendLine\} numberOfLines=\{1\}/);
  assert.doesNotMatch(productList, /style=\{st\.homeProductMetaRow\}/);
  assert.match(productList, /st\.homeDeltaDown/);
  assert.match(productList, /st\.homeDeltaFlat/);
  assert.match(productList, /st\.homeDeltaUp/);
  assert.match(catalogUtils, /if \(previous === null \|\| deltaPercent === null\) return null/);
  assert.match(styles, /homeDeltaDown: \{ color: "#2563EB" \}/);
  assert.match(styles, /homeDeltaFlat: \{ color: C\.textMuted \}/);
  assert.match(styles, /homeDeltaUp: \{ color: "#C2413B" \}/);
  assert.match(styles, /homeProductName:[^}]*lineHeight: 20/);
  assert.match(styles, /homeDealInline:[^}]*paddingHorizontal: 5/);
  assert.match(styles, /homeProductRow:[\s\S]*borderBottomWidth: 1/);
  assert.doesNotMatch(styles, /homeProductRow:[\s\S]*?borderRadius:[\s\S]*?homeProductThumb:/);
});

test("product details use divider sections instead of nested bordered cards", () => {
  const panel = read("src/components/nativeApp/ProductDetailPanel.tsx");
  const detailStyles = read("src/screens/nativeAppStyles/productDetailStyles.ts");
  const historyStyles = read("src/screens/nativeAppStyles/productHistoryStyles.ts");

  assert.match(panel, /productInfoSection/);
  assert.match(panel, /style=\{st\.productInfoRow\}/);
  assert.doesNotMatch(panel, /productInfoGrid|productInfoCell/);
  assert.doesNotMatch(detailStyles, /productHeroCard:[^}]*borderWidth/);
  assert.match(detailStyles, /productHeroBody:[^}]*borderBottomWidth: 1/);
  assert.match(detailStyles, /productTrendCard:[^}]*borderBottomWidth: 1/);
  assert.doesNotMatch(detailStyles, /productTrendCard:[^}]*borderRadius/);
  assert.match(historyStyles, /periodHistoryGroup:[^}]*borderBottomWidth: 1/);
  assert.doesNotMatch(historyStyles, /periodLowestRow:[^}]*borderWidth/);
  assert.match(historyStyles, /storeCompareRow:[^}]*borderBottomWidth: 1/);
});

test("home header uses one notification action instead of a live-price status pill", () => {
  const headerCopy = read("src/screens/nativeAppHeader.ts");
  const shell = read("src/components/nativeApp/NativeShell.tsx");
  const screen = read("src/screens/NativeAppScreen.native.tsx");

  assert.doesNotMatch(headerCopy, /Live prices/);
  assert.match(shell, /<AppIcon name="bell"/);
  assert.match(shell, /<AppIcon name="menu"/);
  assert.doesNotMatch(shell, /contextBrandMark|contextStatusPill/);
  assert.match(screen, /onOpenAlerts=\{/);
  assert.match(screen, /unreadAlertCount=\{alerts\.unreadAlertCount\}/);
});

test("Food Scan replaces the bottom alert tab without removing alert access", () => {
  const tabData = read("src/screens/nativeAppData.ts");
  const scanner = read("src/components/nativeApp/FoodScanPanel.tsx");
  const scanMode = read("src/components/nativeApp/FoodScanModeSelector.tsx");
  const scanNotice = read("src/components/nativeApp/FoodScanNotice.tsx");
  const scanResult = read("src/components/nativeApp/FoodScanResultSurface.tsx");
  const scanProductLink = read("src/components/nativeApp/FoodScanProductLinkCard.tsx");
  const scanStyles = read("src/screens/nativeAppStyles/foodScanStyles.ts");
  const screen = read("src/screens/NativeAppScreen.native.tsx");
  const functionSource = read("supabase/functions/food-scan/index.ts");
  const catalog = read("src/hooks/useNativeCatalog.ts");

  assert.match(tabData, /\{ id: "scan", label: "Scan" \}/);
  assert.doesNotMatch(tabData, /\{ id: "alerts", label: "Alerts" \}/);
  assert.match(scanner, /CameraView/);
  assert.doesNotMatch(scanner, /ImagePicker|launchImageLibraryAsync|Choose photo/);
  assert.match(scanner, /foodScanReviewAction/);
  assert.match(scanStyles, /foodScanReviewAction:[\s\S]*flexBasis: 0,[\s\S]*flexGrow: 1/);
  assert.match(scanner, /accessibilityLabel="Retake photo"/);
  assert.match(scanner, /<AppIcon name="retake"/);
  assert.match(scanner, /accessibilityLabel="Analyze photo"/);
  assert.match(scanner, /<AppIcon name="sparkles"/);
  assert.doesNotMatch(scanner, /Preview sample result/);
  assert.match(scanMode, /Fresh food/);
  assert.match(scanMode, /Ingredient label/);
  assert.doesNotMatch(scanner, /AI food guide|Scan food with your camera/);
  assert.match(scanner, /FoodScanResultSurface/);
  assert.match(scanResult, /FoodScanResultView/);
  assert.match(scanResult, /FoodScanProductLinkCard/);
  assert.match(scanProductLink, /Found in PocketCart/);
  assert.match(scanProductLink, /Price history/);
  assert.match(scanProductLink, /onOpenProduct\(product\)/);
  assert.match(screen, /onOpenProduct=\{catalog\.openProduct\}/);
  assert.match(catalog, /pendingProductOpenRef/);
  assert.match(catalog, /setLinkedProduct\(product\)/);
  assert.match(scanResult, /Scan again/);
  assert.match(scanNotice, /cannot detect bacteria/);
  assert.match(screen, /shell\.setActiveTab\("alerts"\)/);
  assert.match(functionSource, /Never claim that meat, fish, dairy/);
  assert.match(functionSource, /Never invent hidden ingredients/);
});

test("home products load automatically from the parent scroll position", () => {
  const screen = read("src/screens/NativeAppScreen.native.tsx");
  const productList = read("src/components/nativeApp/HomeProductList.tsx");

  assert.match(screen, /onScroll=\{handleAppScroll\}/);
  assert.match(screen, /isScrollNearEnd/);
  assert.match(productList, /nextVisibleProductCount/);
  assert.doesNotMatch(productList, /Show 6 more|Show less|homeShowMoreBtn/);
});

test("shopping uses list dividers and reserves tint for the recommended plan", () => {
  const panel = read("src/components/nativeApp/ShoppingListPanel.tsx");
  const styles = read("src/screens/nativeAppStyles/shoppingListStyles.ts");

  assert.match(panel, /style=\{st\.shoppingPage\}/);
  assert.match(panel, /My basket · \{items\.length\}/);
  assert.match(panel, /<AppIcon name="close"/);
  assert.match(styles, /shoppingItemsCard:[^}]*borderTopWidth: 1/);
  assert.match(styles, /shoppingItemRow:[^}]*borderBottomWidth: 1/);
  assert.doesNotMatch(styles, /shoppingItemsCard:[^}]*borderRadius/);
  assert.match(styles, /shoppingRecommendationCard:[^}]*backgroundColor: C\.primaryGhost/);
  assert.doesNotMatch(styles, /shoppingRecommendationCard:[^}]*borderWidth/);
  assert.match(styles, /shoppingCompareCard:[^}]*borderBottomWidth: 1/);
});

test("settings uses open divider groups instead of bordered cards", () => {
  const headerCopy = read("src/screens/nativeAppHeader.ts");
  const shell = read("src/components/nativeApp/NativeShell.tsx");
  const styles = read("src/screens/nativeAppStyles/settingsStyles.ts");
  const locationCard = read("src/components/nativeApp/SettingsLocationCard.tsx");
  const locationCopy = read("src/utils/nativeLocationSettings.ts");

  assert.match(headerCopy, /title: "Settings"/);
  assert.doesNotMatch(headerCopy, /status:/);
  assert.doesNotMatch(shell, /contextStatusPill/);
  assert.match(styles, /settingsPage:[^}]*gap: 24/);
  assert.match(styles, /settingsProfileCard:[^}]*borderBottomWidth: 1/);
  assert.doesNotMatch(styles, /settingsProfileCard:[^}]*borderRadius/);
  assert.match(styles, /settingsGroup:[^}]*borderTopWidth: 1/);
  assert.match(styles, /settingsGroup:[^}]*borderBottomWidth: 1/);
  assert.doesNotMatch(styles, /settingsGroup:[^}]*borderRadius/);
  assert.match(styles, /settingsLocationBlock:[^}]*paddingVertical: 10/);
  assert.match(styles, /settingsInput:[\s\S]*minHeight: 44/);
  assert.match(styles, /settingsLinkRow:[\s\S]*minHeight: 46/);
  assert.match(styles, /settingsSummaryRow:[^}]*borderBottomWidth/);
  assert.match(locationCard, />Shopping area</);
  assert.match(locationCard, /editing \? \(/);
  assert.match(locationCard, /editing \? "Done" : "Change"/);
  assert.match(locationCard, />Use my current location</);
  assert.match(locationCard, />Update</);
  assert.doesNotMatch(locationCard, /Use your location or save a postal code/);
  assert.doesNotMatch(locationCopy, /locationLatitude\.toFixed/);
});

test("consumer feature icons use the shared Lucide icon set instead of emoji glyphs", () => {
  const features = read("src/sections/FeaturesSection.tsx");
  const appIcon = read("src/components/icons/AppIcon.tsx");

  assert.match(features, /<AppIcon/);
  assert.match(appIcon, /lucide-react-native/);
  assert.doesNotMatch(features, /[◎♡☰⚡]/u);
});
