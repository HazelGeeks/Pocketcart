import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

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
execFileSync("open", ["-a", "Simulator"], { stdio: "ignore" });
execFileSync("xcrun", ["simctl", "bootstatus", simulator.udid, "-b"], {
  stdio: "inherit",
});

if (forceBuild || !installed) {
  console.log(
    installed
      ? "Rebuilding PocketCart for the selected simulator..."
      : "PocketCart is not installed on this simulator. Building and installing it now...",
  );
  run("npx", ["expo", "run:ios", "--device", simulator.udid]);
}

run("npx", [
  "expo",
  "start",
  "--dev-client",
  "--ios",
  "--scheme",
  scheme,
  ...expoStartArgs,
]);
