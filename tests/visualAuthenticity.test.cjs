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

test("home search and sorting controls stay compact", () => {
  const controls = read("src/components/nativeApp/HomeCatalogControls.tsx");
  const styles = read("src/screens/nativeAppStyles/homeControlStyles.ts");
  const headerStyles = read("src/screens/nativeAppStyles/headerActionStyles.ts");
  const styleIndex = read("src/screens/nativeAppStyles/index.ts");

  assert.doesNotMatch(controls, /Search groceries and compare current sale prices/);
  assert.match(controls, /style=\{st\.sortSegmentedControl\}/);
  assert.doesNotMatch(controls, /sortOptionsScroll|sortPill|searchAlertBtn/);
  assert.match(styles, /searchInput:[\s\S]*height: 42/);
  assert.match(headerStyles, /headerAlertButton:[\s\S]*width: 44,[\s\S]*height: 44/);
  assert.match(styles, /sortSegmentedControl:[\s\S]*height: 40/);
  assert.match(styleIndex, /\.\.\.homeControlStyles/);
  assert.match(styleIndex, /\.\.\.headerActionStyles/);
});

test("home header uses one notification action instead of a live-price status pill", () => {
  const headerCopy = read("src/screens/nativeAppHeader.ts");
  const shell = read("src/components/nativeApp/NativeShell.tsx");
  const screen = read("src/screens/NativeAppScreen.native.tsx");

  assert.doesNotMatch(headerCopy, /Live prices/);
  assert.match(shell, /<AppIcon name="bell"/);
  assert.match(screen, /onOpenAlerts=\{/);
  assert.match(screen, /unreadAlertCount=\{alerts\.unreadAlertCount\}/);
});

test("home products load automatically from the parent scroll position", () => {
  const screen = read("src/screens/NativeAppScreen.native.tsx");
  const productList = read("src/components/nativeApp/HomeProductList.tsx");

  assert.match(screen, /onScroll=\{handleAppScroll\}/);
  assert.match(screen, /isScrollNearEnd/);
  assert.match(productList, /nextVisibleProductCount/);
  assert.doesNotMatch(productList, /Show 6 more|Show less|homeShowMoreBtn/);
});

test("settings removes the guest header status and keeps sections compact", () => {
  const headerCopy = read("src/screens/nativeAppHeader.ts");
  const shell = read("src/components/nativeApp/NativeShell.tsx");
  const styles = read("src/screens/nativeAppStyles/settingsStyles.ts");
  const locationCard = read("src/components/nativeApp/SettingsLocationCard.tsx");
  const locationCopy = read("src/utils/nativeLocationSettings.ts");

  assert.match(headerCopy, /title: "Settings",\s*status: ""/);
  assert.match(shell, /\) : status \? \(/);
  assert.match(styles, /settingsPage:[\s\S]*gap: 14/);
  assert.match(styles, /settingsLocationBlock:[\s\S]*padding: 12/);
  assert.match(styles, /settingsInput:[\s\S]*minHeight: 44/);
  assert.match(styles, /settingsLinkRow:[\s\S]*minHeight: 46/);
  assert.match(locationCard, />Shopping area</);
  assert.match(locationCard, /editing \? \(/);
  assert.match(locationCard, /editing \? "Done" : "Change"/);
  assert.match(locationCard, />Use my current location</);
  assert.match(locationCard, />Update</);
  assert.doesNotMatch(locationCard, /Use your location or save a postal code/);
  assert.doesNotMatch(locationCopy, /locationLatitude\.toFixed/);
});

test("consumer feature icons use the shared SVG icon set instead of emoji glyphs", () => {
  const features = read("src/sections/FeaturesSection.tsx");
  const appIcon = read("src/components/icons/AppIcon.tsx");

  assert.match(features, /<AppIcon/);
  assert.match(appIcon, /react-native-svg/);
  assert.doesNotMatch(features, /[◎♡☰⚡]/u);
});
