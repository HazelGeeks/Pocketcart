const test = require("node:test");
const assert = require("node:assert/strict");
const { sourceModule } = require("./helpers/sourceModule.cjs");
const { hookHarness } = require("./helpers/hookHarness.cjs");

function cameraHarness(permission) {
  let requests = 0, settings = 0, checks = 0, back = 0, removed = false, listener;
  const harness = hookHarness((react) => {
    react.createElement = (type, props, ...children) => ({ type, props: props ?? {}, children });
    return sourceModule("src/components/nativeApp/receipts/ReceiptCamera.tsx", {
      react,
      "react-native": {
        ActivityIndicator: "ActivityIndicator", Text: "Text", View: "View",
        Linking: { openSettings: async () => { settings++; } },
        AppState: { addEventListener: (_name, fn) => { listener = fn; return { remove: () => { removed = true; } }; } },
      },
      "expo-camera": {
        CameraView: "CameraView",
        useCameraPermissions: () => [permission, async () => { requests++; }, async () => { checks++; }],
      },
      "./ReceiptControls": { ReceiptButton: "ReceiptButton" },
      "./receiptStyles": { rs: {} },
    }).ReceiptCamera;
  });
  const render = async () => {
    const tree = await harness.render({ onCapture() {}, onCancel() { back++; } });
    const nodes = [];
    function visit(node) {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) return node.forEach(visit);
      nodes.push(node); node.children?.forEach(visit);
    }
    visit(tree);
    return nodes;
  };
  return { render, harness, state: () => ({ requests, settings, checks, back, removed }), foreground: () => listener("active") };
}

test("receipt camera asks only after Continue and allows returning to manual entry", async () => {
  const h = cameraHarness({ granted: false, canAskAgain: true });
  const nodes = await h.render();
  assert.equal(h.state().requests, 0);
  assert.equal(nodes.some(n => n.type === "CameraView"), false);
  nodes.find(n => n.props.label === "Continue").props.onPress();
  await Promise.resolve();
  assert.equal(h.state().requests, 1);
  nodes.find(n => n.props.label === "Back to receipt").props.onPress();
  assert.equal(h.state().back, 1);
  h.harness.unmount();
});

test("denied camera access opens Settings and rechecks on return without requesting again", async () => {
  const h = cameraHarness({ granted: false, canAskAgain: false });
  const nodes = await h.render();
  assert.equal(nodes.some(n => n.props.label === "Continue"), false);
  nodes.find(n => n.props.label === "Open App Settings").props.onPress();
  await Promise.resolve();
  h.foreground();
  await Promise.resolve();
  assert.equal(h.state().settings, 1);
  assert.equal(h.state().requests, 0);
  assert.equal(h.state().checks, 1);
  h.harness.unmount();
  assert.equal(h.state().removed, true);
});

test("granted camera access renders capture without another permission prompt", async () => {
  const h = cameraHarness({ granted: true, canAskAgain: true });
  const nodes = await h.render();
  assert.equal(nodes.some(n => n.type === "CameraView"), true);
  assert.equal(nodes.some(n => n.props.label === "Continue"), false);
  assert.equal(h.state().requests, 0);
  h.harness.unmount();
});
