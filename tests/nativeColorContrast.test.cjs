const test = require("node:test");
const assert = require("node:assert/strict");

const {
  marketingPalette,
} = require("../.tmp-tests/shared/design/palette.js");

function luminance(hex) {
  const channels = hex
    .match(/[a-f\d]{2}/gi)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4,
    );
  return (
    0.2126 * channels[0] +
    0.7152 * channels[1] +
    0.0722 * channels[2]
  );
}

function contrast(left, right) {
  const first = luminance(left);
  const second = luminance(right);
  return (
    (Math.max(first, second) + 0.05) /
    (Math.min(first, second) + 0.05)
  );
}

test("native text and action colors meet WCAG AA contrast", () => {
  assert.ok(
    contrast(marketingPalette.primary, marketingPalette.white) >= 4.5,
  );
  assert.ok(
    contrast(marketingPalette.primaryDeep, marketingPalette.white) >= 4.5,
  );
  assert.ok(
    contrast(marketingPalette.textMuted, marketingPalette.white) >= 4.5,
  );
});
