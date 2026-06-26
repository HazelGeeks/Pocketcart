import { existsSync, readFileSync } from "node:fs";

const args = new Set(process.argv.slice(2));
const checkLiveUrls = args.has("--live");
const findings = [];

function pass(message) {
  findings.push({ level: "pass", message });
}

function fail(message) {
  findings.push({ level: "fail", message });
}

function warn(message) {
  findings.push({ level: "warn", message });
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function requireFile(path) {
  if (existsSync(path)) {
    pass(`Required store asset exists: ${path}`);
    return true;
  }
  fail(`Required store asset missing: ${path}`);
  return false;
}

function getPngDimensions(buffer) {
  const signature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== signature) return null;
  return {
    format: "png",
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function getJpegDimensions(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);

    if (
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf
    ) {
      return {
        format: "jpeg",
        width: buffer.readUInt16BE(offset + 7),
        height: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += 2 + length;
  }

  return null;
}

function getImageDimensions(path) {
  const buffer = readFileSync(path);
  return getPngDimensions(buffer) || getJpegDimensions(buffer);
}

function expectImageSize(path, width, height, label) {
  if (!requireFile(path)) return;

  const dimensions = getImageDimensions(path);
  if (!dimensions) {
    fail(`${label} must be a PNG or JPEG image: ${path}`);
    return;
  }

  if (dimensions.width === width && dimensions.height === height) {
    pass(`${label} dimensions are ${width} x ${height}`);
  } else {
    fail(`${label} dimensions should be ${width} x ${height}, found ${dimensions.width} x ${dimensions.height}`);
  }
}

function expectMinPortrait(path, minWidth, minHeight, label) {
  if (!requireFile(path)) return;

  const dimensions = getImageDimensions(path);
  if (!dimensions) {
    fail(`${label} must be a PNG or JPEG image: ${path}`);
    return;
  }

  if (dimensions.width >= minWidth && dimensions.height >= minHeight && dimensions.height > dimensions.width) {
    pass(`${label} is a portrait image at least ${minWidth} x ${minHeight}`);
  } else {
    fail(`${label} should be portrait and at least ${minWidth} x ${minHeight}, found ${dimensions.width} x ${dimensions.height}`);
  }
}

function expectTextLength(value, max, label, min = 1) {
  if (typeof value !== "string") {
    fail(`${label} must be a string`);
    return;
  }

  const length = value.trim().length;
  if (length >= min && length <= max) {
    pass(`${label} length is valid (${length}/${max})`);
  } else {
    fail(`${label} length must be between ${min} and ${max}, found ${length}`);
  }
}

async function expectLiveUrl(url, label) {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      pass(`${label} is reachable (${response.status})`);
    } else {
      fail(`${label} should return 2xx, found ${response.status}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`${label} is not reachable: ${message}`);
  }
}

expectImageSize("assets/icon.png", 1024, 1024, "App icon");
expectImageSize("assets/adaptive-icon.png", 1024, 1024, "Android adaptive icon foreground");
expectMinPortrait("assets/splash.png", 1000, 2000, "Splash image");
expectImageSize("store-assets/google-play/feature-graphic.jpg", 1024, 500, "Google Play feature graphic");
requireFile("store-assets/google-play/feature-graphic.svg");
requireFile("store-assets/screenshots/README.md");

let metadata = null;

if (requireFile("store-assets/metadata/en-US.json")) {
  metadata = readJson("store-assets/metadata/en-US.json");
  expectTextLength(metadata.appName, 30, "Store app name");
  expectTextLength(metadata.subtitle, 30, "App Store subtitle");
  expectTextLength(metadata.shortDescription, 80, "Google Play short description");
  expectTextLength(metadata.promotionalText, 170, "App Store promotional text");
  expectTextLength(metadata.fullDescription, 4000, "Store full description", 80);
  expectTextLength(metadata.reviewNotes, 4000, "Store review notes", 80);

  for (const urlField of ["supportUrl", "marketingUrl", "privacyPolicyUrl", "termsUrl", "accountDeletionUrl"]) {
    if (typeof metadata[urlField] === "string" && metadata[urlField].startsWith("https://")) {
      pass(`${urlField} uses HTTPS`);
    } else {
      fail(`${urlField} must be an HTTPS URL`);
    }
  }

  if (metadata.dataSafetyBaseline?.accountDeletionAvailableInApp && metadata.dataSafetyBaseline?.accountDeletionAvailableOnWeb) {
    pass("Data safety baseline includes in-app and web account deletion");
  } else {
    fail("Data safety baseline must include in-app and web account deletion");
  }

  if (
    Array.isArray(metadata.dataSafetyBaseline?.collectedData) &&
    metadata.dataSafetyBaseline.collectedData.includes("support and account deletion request details")
  ) {
    pass("Data safety baseline includes support and account deletion request details");
  } else {
    fail("Data safety baseline must include support and account deletion request details");
  }

  if (metadata.dataSafetyBaseline?.thirdPartyAdTracking === false && metadata.dataSafetyBaseline?.dataSold === false) {
    pass("Data safety baseline states no ad tracking or data sale");
  } else {
    fail("Data safety baseline must explicitly state no ad tracking or data sale for this release");
  }
}

if (checkLiveUrls && metadata) {
  for (const [field, label] of [
    ["supportUrl", "Support URL"],
    ["marketingUrl", "Marketing URL"],
    ["privacyPolicyUrl", "Privacy policy URL"],
    ["termsUrl", "Terms URL"],
    ["accountDeletionUrl", "Account deletion URL"],
  ]) {
    if (typeof metadata[field] === "string" && metadata[field].startsWith("https://")) {
      await expectLiveUrl(metadata[field], label);
    }
  }
}

warn("Real iOS and Android screenshots still need to be captured from release/TestFlight/internal testing builds before store submission.");

for (const item of findings) {
  const marker = item.level === "pass" ? "PASS" : item.level === "warn" ? "WARN" : "FAIL";
  console.log(`${marker}: ${item.message}`);
}

const failures = findings.filter((item) => item.level === "fail");
const warnings = findings.filter((item) => item.level === "warn");

if (warnings.length > 0) {
  console.log(`\n${warnings.length} warning(s).`);
}

if (failures.length > 0) {
  console.error(`\n${failures.length} store asset check(s) failed.`);
  process.exit(1);
}

console.log("\nStore submission asset checks passed.");
