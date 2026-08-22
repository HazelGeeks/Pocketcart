import { CameraView, useCameraPermissions } from "expo-camera";
import React from "react";
import { ActivityIndicator, Image, Linking, Pressable, Text, View } from "react-native";
import useFoodScanProductLink from "../../hooks/useFoodScanProductLink";
import { st } from "../../screens/nativeAppStyles";
import { analyzeFoodPhoto, type FoodScanMode, type FoodScanResult } from "../../services/foodScan";
import type { MarketProduct } from "../../services/marketData";
import { marketingPalette as C } from "../../shared/design/palette";
import { AppIcon } from "../icons/AppIcon";
import { FoodScanModeSelector } from "./FoodScanModeSelector";
import { FoodScanNotice } from "./FoodScanNotice";
import { FoodScanResultSurface } from "./FoodScanResultSurface";

type CapturedPhoto = {
  uri: string;
  base64: string;
  mimeType: "image/jpeg" | "image/png";
};

export function FoodScanPanel({
  onOpenProduct,
}: {
  onOpenProduct: (product: MarketProduct) => void;
}) {
  const cameraRef = React.useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = React.useState<FoodScanMode>("fresh");
  const [photo, setPhoto] = React.useState<CapturedPhoto | null>(null);
  const [barcode, setBarcode] = React.useState<string | null>(null);
  const [capturing, setCapturing] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [result, setResult] = React.useState<FoodScanResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const productLink = useFoodScanProductLink({ barcode, result });

  const resetScan = React.useCallback(() => {
    setPhoto(null);
    setBarcode(null);
    setResult(null);
    setError(null);
  }, []);

  const changeMode = React.useCallback(
    (nextMode: FoodScanMode) => {
      setMode(nextMode);
      resetScan();
    },
    [resetScan],
  );

  const takePhoto = React.useCallback(async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    setError(null);
    setResult(null);
    try {
      const captured = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.55,
      });
      if (!captured?.base64) {
        throw new Error("The camera did not return image data. Please try again.");
      }
      setPhoto({
        uri: captured.uri,
        base64: captured.base64,
        mimeType: captured.format === "png" ? "image/png" : "image/jpeg",
      });
    } catch (captureError) {
      setError(
        captureError instanceof Error ? captureError.message : "Could not capture the photo.",
      );
    } finally {
      setCapturing(false);
    }
  }, [capturing]);

  const analyze = React.useCallback(async () => {
    if (!photo || analyzing) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const nextResult = await analyzeFoodPhoto({
        base64: photo.base64,
        mimeType: photo.mimeType,
        mode,
        barcode,
      });
      setResult(nextResult);
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Food analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, barcode, mode, photo]);

  return (
    <View style={st.foodScanStack}>
      <FoodScanModeSelector mode={mode} onChange={changeMode} />

      {result ? (
        <FoodScanResultSurface
          mode={mode}
          result={result}
          productLink={productLink.link}
          productLinkLoading={productLink.loading}
          onOpenProduct={onOpenProduct}
          onScanAgain={resetScan}
        />
      ) : photo ? (
        <>
          <View style={st.foodScanCameraCard}>
            <Image source={{ uri: photo.uri }} resizeMode="cover" style={st.foodScanPreview} />
            {analyzing ? (
              <View style={st.foodScanAnalysisOverlay}>
                <ActivityIndicator color={C.white} />
                <Text style={st.foodScanAnalysisTitle}>Looking closely…</Text>
                <Text style={st.foodScanAnalysisText}>Checking visible food details.</Text>
              </View>
            ) : null}
          </View>
          <View style={st.foodScanCaptureRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retake photo"
              disabled={analyzing}
              onPress={resetScan}
              style={[
                st.foodScanAction,
                st.foodScanActionSecondary,
                st.foodScanReviewAction,
                analyzing && st.foodScanActionDisabled,
              ]}
            >
              <AppIcon name="retake" color={C.text} size={23} strokeWidth={2.2} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Analyze photo"
              disabled={analyzing}
              onPress={() => {
                void analyze();
              }}
              style={[
                st.foodScanAction,
                st.foodScanActionPrimary,
                st.foodScanReviewAction,
                analyzing && st.foodScanActionDisabled,
              ]}
            >
              {analyzing ? (
                <ActivityIndicator color={C.white} />
              ) : (
                <AppIcon name="sparkles" color={C.white} size={23} strokeWidth={2.2} />
              )}
            </Pressable>
          </View>
        </>
      ) : !permission ? (
        <View style={st.foodScanStatusCard}>
          <ActivityIndicator color={C.primaryDeep} />
          <Text style={st.itemMeta}>Checking camera permission…</Text>
        </View>
      ) : !permission.granted ? (
        <View style={st.foodScanPermissionCard}>
          <Text style={st.itemName}>Camera permission needed</Text>
          <Text style={st.itemMeta}>
            PocketCart only uses the photo you capture for this analysis. The photo is not added to
            your library.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (permission.canAskAgain) void requestPermission();
              else void Linking.openSettings();
            }}
            style={[st.foodScanAction, st.foodScanActionPrimary, st.foodScanActionFullWidth]}
          >
            <Text style={st.foodScanActionPrimaryText}>
              {permission.canAskAgain ? "Allow camera" : "Open App Settings"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={st.foodScanCameraCard}>
            <CameraView
              ref={cameraRef}
              facing="back"
              mode="picture"
              style={st.foodScanCamera}
              barcodeScannerSettings={
                mode === "label" ? { barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] } : undefined
              }
              onBarcodeScanned={
                mode === "label" && !barcode ? (scan) => setBarcode(scan.data) : undefined
              }
            />
            <View pointerEvents="none" style={st.foodScanGuide}>
              <Text style={st.foodScanGuideText}>
                {mode === "fresh"
                  ? "Fill the frame with one fruit or vegetable in even light."
                  : "Keep the ingredient list flat, sharp, and fully visible."}
              </Text>
            </View>
            {barcode ? (
              <View style={st.foodScanBarcodeBadge}>
                <Text style={st.foodScanBarcodeText}>Barcode {barcode}</Text>
              </View>
            ) : null}
          </View>

          <View style={st.foodScanCaptureRow}>
            <Pressable
              accessibilityRole="button"
              disabled={capturing || analyzing}
              onPress={() => {
                void takePhoto();
              }}
              style={[
                st.foodScanAction,
                st.foodScanActionPrimary,
                st.foodScanActionCentered,
                (capturing || analyzing) && st.foodScanActionDisabled,
              ]}
            >
              <Text style={st.foodScanActionPrimaryText}>
                {capturing ? "Capturing…" : "Take photo"}
              </Text>
            </Pressable>
          </View>
        </>
      )}

      <FoodScanNotice error={error} showSafetyNote={!result} />
    </View>
  );
}
