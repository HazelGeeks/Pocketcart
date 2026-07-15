import * as Location from "expo-location";
import { Platform } from "react-native";

type PermissionStatus = "granted" | "denied" | "unsupported";

export type GeoPermissionResult = {
  granted: boolean;
  status: PermissionStatus;
  latitude?: number;
  longitude?: number;
  message?: string;
  source?: string;
};

const fallbackMessage = {
  locationUnsupported: "Location is not available in this build. Use postal code instead.",
  locationDenied: "Location access was denied. Use postal code instead.",
};

function getNavigator(): any {
  return (globalThis as any).navigator;
}

function getPermissionsApi(): any {
  const navigator = getNavigator();
  return navigator?.permissions;
}

function readPositionErrorMessage(error: any): string {
  const code = (error?.code as string | number) ?? "";
  const message = String(error?.message ?? "");

  if (code === 1 || /permission/i.test(message)) {
    return fallbackMessage.locationDenied;
  }

  if (code === 2 || /timeout|timed out/i.test(message)) {
    return "Location request timed out. Try again with a better GPS signal.";
  }

  return message || "Unable to read current location.";
}

function requestCurrentPosition(): Promise<GeoPermissionResult> {
  const navigator = getNavigator();
  const geolocation = navigator?.geolocation;

  if (!geolocation || typeof geolocation.getCurrentPosition !== "function") {
    return Promise.resolve({
      granted: false,
      status: "unsupported",
      message: fallbackMessage.locationUnsupported,
      source: "api",
    });
  }

  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      (position: { coords: { latitude: number; longitude: number } }) => {
        const coords = position.coords;
        if (!coords) {
          resolve({
            granted: false,
            status: "denied",
            message: "Location service returned no coordinates.",
            source: "api",
          });
          return;
        }

        resolve({
          granted: true,
          status: "granted",
          source: "api",
          latitude: coords.latitude,
          longitude: coords.longitude,
          message: `Location found (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`,
        });
      },
      (error: { code?: number; message?: string }) => {
        resolve({
          granted: false,
          status: "denied",
          source: "api",
          message: readPositionErrorMessage(error),
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 10 * 60 * 1000,
      },
    );
  });
}

async function requestNativeCurrentPosition(): Promise<GeoPermissionResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (permission.status !== "granted") {
      return {
        granted: false,
        status: permission.canAskAgain === false ? "unsupported" : "denied",
        source: "expo-location",
        message:
          permission.canAskAgain === false
            ? "Location permission permanently denied. Open app settings and allow location."
            : fallbackMessage.locationDenied,
      };
    }

    const lastKnownPosition = await Location.getLastKnownPositionAsync({
      maxAge: 10 * 60 * 1000,
      requiredAccuracy: 3000,
    });
    const position =
      lastKnownPosition ??
      (await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        mayShowUserSettingsDialog: true,
      }));

    return {
      granted: true,
      status: "granted",
      source: "expo-location",
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      message: `Location found (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`,
    };
  } catch (error) {
    return {
      granted: false,
      status: "denied",
      source: "expo-location",
      message: readPositionErrorMessage(error),
    };
  }
}

async function queryWebPermissionState(permissionName: "geolocation"): Promise<PermissionStatus> {
  try {
    const permissionsApi = getPermissionsApi();
    if (!permissionsApi || typeof permissionsApi.query !== "function") {
      return "granted";
    }

    const result = await permissionsApi.query({ name: permissionName });
    if (result.state === "granted") {
      return "granted";
    }
    if (result.state === "denied") {
      return "denied";
    }
    return "unsupported";
  } catch {
    return "unsupported";
  }
}

export async function requestLocationPermissionAndPosition(): Promise<GeoPermissionResult> {
  const navigator = getNavigator();

  if (Platform.OS === "ios" || Platform.OS === "android") {
    return requestNativeCurrentPosition();
  }

  if (Platform.OS === "web") {
    const permissionState = await queryWebPermissionState("geolocation");
    if (permissionState === "denied") {
      return {
        granted: false,
        status: "denied",
        source: "web-permissions",
        message: fallbackMessage.locationDenied,
      };
    }
  }

  if (!navigator?.geolocation) {
    return {
      granted: false,
      status: "unsupported",
      source: "web-permissions",
      message: fallbackMessage.locationUnsupported,
    };
  }

  return requestCurrentPosition();
}

export type OnboardingLocationMode = "share" | "postal" | "skip";
