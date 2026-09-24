const test = require("node:test");
const assert = require("node:assert/strict");
const { hookHarness } = require("./helpers/hookHarness.cjs");
const { sourceModule } = require("./helpers/sourceModule.cjs");
const native = Object.fromEntries(["ActivityIndicator", "Alert", "Image", "Modal", "Pressable", "ScrollView", "Text", "View"].map(name => [name, name]));
const jsxReact = react => ({ ...react, createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }) });
function find(node, predicate) {
  if (!node || typeof node !== "object") return null;
  if (!Array.isArray(node) && predicate(node)) return node;
  for (const child of Array.isArray(node) ? node : node.children ?? []) {
    const found = find(child, predicate);
    if (found) return found;
  }
  return null;
}

test("store checklist retries a failed load and ignores superseded responses", async () => {
  const pending = [];
  const harness = hookHarness(react => {
    const component = sourceModule("src/components/nativeApp/HomeStoreFilterChecklist.tsx", {
      react: jsxReact(react), "react-native": native,
      "../../services/marketData": { listStores: () => new Promise(resolve => pending.push(resolve)) },
      "../../utils/catalogRetailers": { groupCatalogRetailers: items => items },
      "../../screens/nativeAppStyles": { st: {} }, "../../shared/design/palette": { marketingPalette: {} },
      "../icons/AppIcon": { AppIcon: "Icon" },
    }).HomeStoreFilterChecklist;
    return () => component({ value: null, onChange() {} });
  });
  await harness.render();
  pending.shift()({ data: [], error: "offline" });
  let tree = await harness.render();
  const retry = find(tree, node => node.type === "Pressable" && node.props.accessibilityRole === "button").props.onPress;
  retry(); retry();
  pending.pop()({ data: [{ name: "New store", ids: ["new"] }], error: null });
  tree = await harness.render();
  assert.ok(find(tree, node => node.props.accessibilityLabel === "New store"));
  pending.shift()({ data: [], error: "old failure" });
  tree = await harness.render();
  assert.ok(find(tree, node => node.props.accessibilityLabel === "New store"));
  harness.unmount();
});

test("receipt photo retries and discards a response for the previous receipt", async () => {
  const pending = [];
  const harness = hookHarness(react => {
    const component = sourceModule("src/components/nativeApp/receipts/ReceiptDetail.tsx", {
      react: jsxReact(react), "react-native": native,
      "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
      "../../../services/receipts": { receiptPhotoUrl: () => new Promise((resolve, reject) => pending.push({ resolve, reject })) },
      "../../../utils/receipts": { receiptMoney: String, receiptDisplayItems: () => [] },
      "../../icons/AppIcon": { AppIcon: "Icon" }, "./ReceiptControls": { ReceiptButton: "Button" }, "./receiptStyles": { rs: {} },
    }).ReceiptDetail;
    return path => component({ userId: "a", receipt: { photo_path: path, items: [] }, onClose() {}, onEdit() {}, onDeleted() {} });
  });
  await harness.render("first");
  pending.shift().reject(Error("expired"));
  let tree = await harness.render("first");
  find(tree, node => node.props.label === "Retry receipt photo").props.onPress();
  const stale = pending.shift();
  await harness.render("second");
  pending.shift().resolve("second-url");
  tree = await harness.render("second");
  assert.equal(find(tree, node => node.type === "Image").props.source.uri, "second-url");
  stale.resolve("first-url");
  tree = await harness.render("second");
  assert.equal(find(tree, node => node.type === "Image").props.source.uri, "second-url");
  harness.unmount();
});
