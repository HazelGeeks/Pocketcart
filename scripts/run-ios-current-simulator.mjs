import { execFileSync, spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { simulatorHasKeychainAccess } from "./simulator-keychain.mjs";

const cliArgs = process.argv.slice(2);
const forceBuild = cliArgs.includes("--build");
const inspectOnly = cliArgs.includes("--inspect");
const expoStartArgs = cliArgs.filter(
  (argument) => argument !== "--build" && argument !== "--inspect",
);

const appConfig = JSON.parse(readFileSync("app.json", "utf8")).expo;
const bundleIdentifier = appConfig.ios?.bundleIdentifier;
const scheme = appConfig.scheme;

if (!bundleIdentifier || !scheme) {
  console.error("app.json must define expo.ios.bundleIdentifier and expo.scheme.");
  process.exit(1);
}

function commandOutput(command, args) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function simulatorDevices() {
  const payload = JSON.parse(
    commandOutput("xcrun", ["simctl", "list", "devices", "available", "--json"]),
  );

  return Object.entries(payload.devices ?? {}).flatMap(([runtime, devices]) =>
    devices
      .filter((device) => device.isAvailable !== false && device.name.startsWith("iPhone"))
      .map((device) => ({ ...device, runtime })),
  );
}

function preferredSimulatorUdid() {
  try {
    return commandOutput("defaults", [
      "read",
      "com.apple.iphonesimulator",
      "CurrentDeviceUDID",
    ]);
  } catch {
    return null;
  }
}

function selectSimulator(devices) {
  const booted = devices.filter((device) => device.state === "Booted");
  const preferredUdid = preferredSimulatorUdid();

  return (
    booted.find((device) => device.udid === preferredUdid) ??
    booted[0] ??
    devices.find((device) => device.udid === preferredUdid) ??
    devices.at(-1) ??
    null
  );
}

function developmentBuildIsInstalled(udid) {
  try {
    execFileSync(
      "xcrun",
      ["simctl", "get_app_container", udid, bundleIdentifier, "app"],
      { stdio: "ignore" },
    );
    return true;
  } catch {
    return false;
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

let devices;
try {
  devices = simulatorDevices();
} catch {
  console.error(
    "Unable to read iOS Simulator state. Open Xcode once, then restart Simulator and retry.",
  );
  process.exit(1);
}
const simulator = selectSimulator(devices);

if (!simulator) {
  console.error(
    "No available iPhone simulator was found. Install an iOS Simulator runtime in Xcode.",
  );
  process.exit(1);
}

const installed = developmentBuildIsInstalled(simulator.udid);
console.log(
  `Using ${simulator.name} (${simulator.udid}) - ${simulator.state}; development build ${
    installed ? "installed" : "not installed"
  }.`,
);

if (inspectOnly) process.exit(0);

if (simulator.state !== "Booted") {
  execFileSync("xcrun", ["simctl", "boot", simulator.udid], { stdio: "inherit" });
}

execFileSync(
  "defaults",
  ["write", "com.apple.iphonesimulator", "CurrentDeviceUDID", simulator.udid],
  { stdio: "ignore" },
);
const developerDir = commandOutput("xcode-select", ["-p"]);
const deviceHub = resolve(developerDir, "../Applications/DeviceHub.app/Contents/MacOS/DeviceHub");
if (existsSync(deviceHub)) {
  const hub = spawn(deviceHub, [], { detached: true, stdio: "ignore" });
  hub.on("error", (error) => console.error(`Unable to open Device Hub: ${error.message}`));
  hub.unref();
} else {
  execFileSync("open", ["-a", "Simulator"], { stdio: "ignore" });
}
execFileSync("xcrun", ["simctl", "bootstatus", simulator.udid, "-b"], {
  stdio: "inherit",
});

const missingKeychainAccess = installed && !simulatorHasKeychainAccess(simulator.udid, bundleIdentifier);
if (forceBuild || !installed || missingKeychainAccess) {
  console.log(
    installed
      ? "Rebuilding PocketCart for the selected simulator..."
      : "PocketCart is not installed on this simulator. Building and installing it now...",
  );
  if (missingKeychainAccess) console.log("The installed simulator app is missing Keychain entitlements. Rebuilding with Xcode...");
  const buildArgs = [
    "-workspace", "ios/PocketCart.xcworkspace", "-scheme", "PocketCart", "-configuration", "Debug",
    "-destination", `platform=iOS Simulator,id=${simulator.udid}`,
    "CODE_SIGNING_ALLOWED=YES", "CODE_SIGN_IDENTITY=-", "IPHONEOS_DEPLOYMENT_TARGET=15.1",
  ];
  execFileSync("xcodebuild", [...buildArgs, "build"], { stdio: "inherit" });
  const settings = JSON.parse(commandOutput("xcodebuild", [...buildArgs, "-showBuildSettings", "-json"]));
  const appSettings = settings.find((entry) => entry.target === "PocketCart")?.buildSettings;
  if (!appSettings) throw new Error("Xcode did not return the PocketCart build location.");
  execFileSync("xcrun", ["simctl", "install", simulator.udid, resolve(appSettings.TARGET_BUILD_DIR, appSettings.FULL_PRODUCT_NAME)], { stdio: "inherit" });
  if (!simulatorHasKeychainAccess(simulator.udid, bundleIdentifier)) throw new Error("The rebuilt simulator app is missing Keychain access. Check the Debug entitlements in Xcode.");
}

if (existsSync(deviceHub)) {
  // Expo SDK 55's --ios launcher still looks for Simulator.app on Xcode 27.
  // Start Metro separately and open the installed client through simctl.
  const portIndex = expoStartArgs.indexOf("--port");
  const port = portIndex >= 0 ? expoStartArgs[portIndex + 1] : "8081";
  const serverUrl = `http://localhost:${port}`;
  const clientUrl = `${scheme}://expo-development-client/?url=${encodeURIComponent(serverUrl)}`;
  try {
    const response = await fetch(`${serverUrl}/json/list`, { signal: AbortSignal.timeout(1000) });
    const clients = response.ok ? await response.json() : [];
    if (clients.some((client) => client.appId === bundleIdentifier)) {
      execFileSync("xcrun", ["simctl", "openurl", simulator.udid, clientUrl], { stdio: "inherit", timeout: 30000 });
      console.log("PocketCart opened using the existing development server.");
      process.exit(0);
    }
  } catch { /* No matching development client is connected yet. */ }
  const metro = spawn("npx", ["expo", "start", "--dev-client", "--scheme", scheme, ...expoStartArgs], { stdio: "inherit" });
  metro.on("error", (error) => { console.error(error.message); process.exit(1); });
  metro.on("exit", (code) => process.exit(code ?? 1));
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`${serverUrl}/status`, { signal: AbortSignal.timeout(1000) });
      if (response.ok && (await response.text()).includes("packager-status:running")) { ready = true; break; }
    } catch { /* Metro is still starting. */ }
    await new Promise((done) => setTimeout(done, 1000));
  }
  if (ready) {
    execFileSync("xcrun", ["simctl", "openurl", simulator.udid, clientUrl], { stdio: "inherit", timeout: 30000 });
    console.log("PocketCart opened in Device Hub with the current local changes.");
  } else {
    console.error(`Metro has not become ready at ${serverUrl}. Check the server output above.`);
  }
} else run("npx", [
  "expo",
  "start",
  "--dev-client",
  "--ios",
  "--scheme",
  scheme,
  ...expoStartArgs,
]);
