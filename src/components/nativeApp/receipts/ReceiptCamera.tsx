import React from "react";
import { ActivityIndicator, Linking, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { ReceiptPhoto } from "../../../utils/receiptDraft";
import { ReceiptButton } from "./ReceiptControls";
import { rs } from "./receiptStyles";
export function ReceiptCamera({
  onCapture,
  onCancel,
}: {
  onCapture: (photo: ReceiptPhoto) => void;
  onCancel: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = React.useRef<CameraView>(null);
  const [ready, setReady] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const capture = async () => {
    if (!ready || !camera.current || busy) return;
    setBusy(true);
    setError(null);
    try {
      const photo = await camera.current.takePictureAsync({ base64: true, quality: 0.65 });
      if (!photo?.base64) throw new Error("Could not capture the receipt. Please try again.");
      if (photo.base64.length > 8_000_000)
        throw new Error("This photo is too large. Move a little closer and try again.");
      onCapture({
        uri: photo.uri,
        base64: photo.base64,
        mimeType: photo.format === "png" ? "image/png" : "image/jpeg",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not take a photo.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={rs.stack}>
      <Text style={rs.title}>Photograph your receipt</Text>
      <Text style={rs.muted}>
        Lay it flat in good light. Include the store, date, all items and the total. Keep payment
        details out of the frame when possible.
      </Text>
      {!permission ? (
        <ActivityIndicator />
      ) : permission.granted ? (
        <View style={rs.camera}>
          <CameraView
            ref={camera}
            facing="back"
            mode="picture"
            style={{ flex: 1 }}
            onCameraReady={() => setReady(true)}
            onMountError={() =>
              setError("Camera unavailable. You can enter your receipt manually.")
            }
          />
        </View>
      ) : (
        <View style={rs.card}>
          <Text style={rs.text}>Allow camera access to photograph a receipt.</Text>
          <ReceiptButton
            label={permission.canAskAgain ? "Allow camera" : "Open App Settings"}
            onPress={() => {
              void (permission.canAskAgain ? requestPermission() : Linking.openSettings()).catch(
                () => setError("Could not open camera permissions. Please try again."),
              );
            }}
          />
        </View>
      )}
      {error ? (
        <Text accessibilityRole="alert" style={rs.error}>
          {error}
        </Text>
      ) : null}
      {permission?.granted ? (
        <ReceiptButton
          label={busy ? "Capturing…" : "Take photo"}
          disabled={busy || !ready}
          onPress={() => {
            void capture();
          }}
        />
      ) : null}
      <ReceiptButton label="Back to receipt" disabled={busy} secondary onPress={onCancel} />
    </View>
  );
}
