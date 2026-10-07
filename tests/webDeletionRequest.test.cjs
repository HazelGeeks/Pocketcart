const test = require("node:test");
const assert = require("node:assert/strict");
const { sourceModule } = require("./helpers/sourceModule.cjs");
const { hookHarness } = require("./helpers/hookHarness.cjs");

function find(node, predicate) {
  if (!node || typeof node !== "object") return null;
  if (predicate(node)) return node;
  for (const child of [node.props?.children ?? []].flat(Infinity)) {
    const match = find(child, predicate);
    if (match) return match;
  }
  return null;
}
function harness(submit) {
  return hookHarness((react) => {
    react.createElement = (type, props, ...children) => ({ type, props: { ...props, children } });
    const Screen = sourceModule("src/screens/DeleteAccountScreen.tsx", {
      react,
      "react-native": {
        Platform: { OS: "web" },
        StyleSheet: { create: (x) => x },
        Text: "Text",
        View: "View",
        TextInput: "TextInput",
        ScrollView: "ScrollView",
        Pressable: "Pressable",
      },
      "../shared/design/webViewStyle": { webViewStyle: (x) => x },
      "../shared/design/palette": { appPalette: {} },
      "../hooks/useLayout": () => ({ pad: 16, isLg: false }),
      "../i18n/siteI18n": {
        useSiteI18n: () => ({ locale: "en", copy: { mvp: { deletePage: {} } } }),
      },
      "../services/userProfile": { submitAccountDeletionRequest: submit },
    }).default;
    return () => Screen({ onBack: () => {} });
  });
}
const email = (tree) =>
  find(tree, (n) => n.type === "TextInput" && n.props.accessibilityLabel === "Account email");
const details = (tree) =>
  find(tree, (n) => n.type === "TextInput" && n.props.accessibilityLabel === "Optional details");
const button = (tree) =>
  find(tree, (n) => n.type === "Pressable" && Object.hasOwn(n.props, "disabled"));
const alert = (tree) => find(tree, (n) => n.props.accessibilityRole === "alert");

test("offline deletion request finishes, retains entered details, and permits retry", async () => {
  const calls = [];
  let offline = true;
  const h = harness(async (input) => {
    calls.push(input);
    if (offline) throw new TypeError("Failed to fetch");
    return { error: null };
  });
  let tree = await h.render();
  email(tree).props.onChangeText("member@example.invalid");
  details(tree).props.onChangeText("Unable to sign in");
  tree = await h.render();
  button(tree).props.onPress();
  tree = await h.render();
  assert.equal(button(tree).props.disabled, false);
  assert.equal(email(tree).props.value, "member@example.invalid");
  assert.equal(details(tree).props.value, "Unable to sign in");
  assert.match(alert(tree).props.children.join(""), /Check your connection/);
  offline = false;
  button(tree).props.onPress();
  tree = await h.render();
  assert.equal(calls.length, 2);
  assert.equal(email(tree).props.value, "");
  assert.equal(details(tree).props.value, "");
  assert.match(alert(tree).props.children.join(""), /received/);
});

test("deletion submission suppresses duplicate clicks until the first response finishes", async () => {
  let resolve,
    count = 0;
  const h = harness(() => {
    count++;
    return new Promise((done) => {
      resolve = done;
    });
  });
  let tree = await h.render();
  email(tree).props.onChangeText("member@example.invalid");
  tree = await h.render();
  const action = button(tree).props.onPress;
  action();
  action();
  tree = await h.render();
  assert.equal(count, 1);
  assert.equal(button(tree).props.disabled, true);
  resolve({ error: "Service unavailable. Try later." });
  tree = await h.render();
  assert.equal(button(tree).props.disabled, false);
  assert.equal(email(tree).props.value, "member@example.invalid");
  assert.match(alert(tree).props.children.join(""), /Service unavailable/);
});

test("an invalid deletion email never reaches the submission service", async () => {
  let count = 0;
  const h = harness(async () => {
    count++;
    return { error: null };
  });
  const tree = await h.render();
  button(tree).props.onPress();
  assert.equal(count, 0);
  assert.match(alert(await h.render()).props.children.join(""), /account email/);
});
