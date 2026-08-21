import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  Text,
  View,
} from "react-native";
import { st } from "../../screens/nativeAppStyles";
import {
  analyzeFoodPhoto,
  type FoodScanMode,
  type FoodScanResult,
} from "../../services/foodScan";
import { marketingPalette as C } from "../../shared/design/palette";

type CapturedPhoto = {
  uri: string;
  base64: string;
  mimeType: "image/jpeg" | "image/png";
};

const RIPENESS_LABELS: Record<FoodScanResult["ripenessLevel"], string> = {
  unripe: "Likely unripe",
  ready: "Likely ready",
  overripe: "Possibly overripe",
  unknown: "Ripeness unclear",
  not_applicable: "Not applicable",
};

const SAMPLE_RESULT: FoodScanResult = {
  productName: "Banana",
  category: "Fresh produce",
  confidence: 96,
  summary: "This looks like a ripe yellow banana that is likely ready to eat now.",
  ripenessLevel: "ready",
  ripenessConfidence: 91,
  evidence: [
    "The peel is mostly bright yellow.",
    "A few small brown speckles are visible.",
    "No large dark or sunken areas are visible in this photo.",
  ],
  ingredients: [],
  allergens: [],
  nutritionHighlights: ["Bananas commonly provide carbohydrates, fibre, and potassium."],
  nextSteps: ["Eat soon for a firmer texture.", "Use in baking if the peel becomes heavily spotted."],
  safetyNote: "This is a visual estimate only. Check smell and texture before eating, and discard it if you notice mold or an unusual odor.",
  requiresConfirmation: false,
};

export function FoodScanPanel() {
  const cameraRef = React.useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = React.useState<FoodScanMode>("fresh");
  const [photo, setPhoto] = React.useState<CapturedPhoto | null>(null);
  const [barcode, setBarcode] = React.useState<string | null>(null);
  const [capturing, setCapturing] = React.useState(false);
  const [picking, setPicking] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [result, setResult] = React.useState<FoodScanResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const resetScan = React.useCallback(() => {
    setPhoto(null);
    setBarcode(null);
    setResult(null);
    setError(null);
  }, []);

  const changeMode = React.useCallback((nextMode: FoodScanMode) => {
    setMode(nextMode);
    resetScan();
  }, [resetScan]);

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
      setError(captureError instanceof Error ? captureError.message : "Could not capture the photo.");
    } finally {
      setCapturing(false);
    }
  }, [capturing]);

  const pickPhoto = React.useCallback(async () => {
    if (picking || analyzing) return;
    setPicking(true);
    setError(null);
    setResult(null);
    try {
      const selection = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        base64: true,
        quality: 0.55,
        allowsMultipleSelection: false,
      });
      if (selection.canceled) return;

      const selected = selection.assets[0];
      if (!selected?.base64) {
        throw new Error("The selected photo could not be read. Please choose another image.");
      }
      setBarcode(null);
      setPhoto({
        uri: selected.uri,
        base64: selected.base64,
        mimeType: selected.mimeType === "image/png" ? "image/png" : "image/jpeg",
      });
    } catch (selectionError) {
      setError(selectionError instanceof Error ? selectionError.message : "Could not open the photo library.");
    } finally {
      setPicking(false);
    }
  }, [analyzing, picking]);

  const previewSampleResult = React.useCallback(() => {
    setPhoto(null);
    setBarcode(null);
    setError(null);
    setResult(SAMPLE_RESULT);
  }, []);

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
      <View style={st.foodScanIntro}>
        <Text style={st.foodScanEyebrow}>AI food guide</Text>
        <Text style={st.foodScanTitle}>Scan food with your camera</Text>
        <Text style={st.sectionSub}>
          Check visible ripeness for fresh food, or scan an ingredient label. Results are estimates and should be confirmed before use.
        </Text>
      </View>

      <View style={st.foodScanModeRow}>
        <ModeButton
          label="Fresh food"
          active={mode === "fresh"}
          onPress={() => changeMode("fresh")}
        />
        <ModeButton
          label="Ingredient label"
          active={mode === "label"}
          onPress={() => changeMode("label")}
        />
      </View>

      <View style={st.foodScanCaptureRow}>
        <Pressable
          accessibilityRole="button"
          disabled={picking || analyzing}
          onPress={() => { void pickPhoto(); }}
          style={[st.foodScanAction, st.foodScanActionSecondary, (picking || analyzing) && st.foodScanActionDisabled]}
        >
          <Text style={st.foodScanActionSecondaryText}>{picking ? "Opening photos…" : "Choose photo"}</Text>
        </Pressable>
        {__DEV__ ? (
          <Pressable
            accessibilityRole="button"
            disabled={analyzing}
            onPress={previewSampleResult}
            style={[st.foodScanAction, st.foodScanActionSecondary, analyzing && st.foodScanActionDisabled]}
          >
            <Text style={st.foodScanActionSecondaryText}>Preview sample</Text>
          </Pressable>
        ) : null}
      </View>

      {photo ? (
        <>
          <View style={st.foodScanCameraCard}>
            <Image source={{ uri: photo.uri }} resizeMode="cover" style={st.foodScanPreview} />
          </View>
          <View style={st.foodScanCaptureRow}>
            <Pressable
              accessibilityRole="button"
              disabled={analyzing}
              onPress={resetScan}
              style={[st.foodScanAction, st.foodScanActionSecondary, analyzing && st.foodScanActionDisabled]}
            >
              <Text style={st.foodScanActionSecondaryText}>Choose another</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={analyzing}
              onPress={() => { void analyze(); }}
              style={[st.foodScanAction, st.foodScanActionPrimary, analyzing && st.foodScanActionDisabled]}
            >
              <Text style={st.foodScanActionPrimaryText}>{analyzing ? "Analyzing…" : "Analyze photo"}</Text>
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
            PocketCart only uses the photo you capture for this analysis. The photo is not added to your library.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (permission.canAskAgain) void requestPermission();
              else void Linking.openSettings();
            }}
            style={[st.foodScanAction, st.foodScanActionPrimary]}
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
              barcodeScannerSettings={mode === "label" ? { barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] } : undefined}
              onBarcodeScanned={mode === "label" && !barcode ? (scan) => setBarcode(scan.data) : undefined}
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
              onPress={() => { void takePhoto(); }}
              style={[st.foodScanAction, st.foodScanActionPrimary, (capturing || analyzing) && st.foodScanActionDisabled]}
            >
              <Text style={st.foodScanActionPrimaryText}>
                {capturing ? "Capturing…" : "Take photo"}
              </Text>
            </Pressable>
          </View>
        </>
      )}

      {analyzing ? (
        <View style={st.foodScanStatusCard}>
          <ActivityIndicator color={C.primaryDeep} />
          <Text style={st.itemName}>Looking closely…</Text>
          <Text style={st.itemMeta}>Checking visible food details and avoiding unsupported safety claims.</Text>
        </View>
      ) : null}

      {error ? (
        <View style={st.foodScanErrorCard} accessibilityRole="alert">
          <Text style={st.foodScanSectionTitle}>Couldn’t complete the scan</Text>
          <Text style={st.foodScanErrorText}>{error}</Text>
        </View>
      ) : null}

      {result ? <FoodScanResultCard result={result} mode={mode} /> : null}

      <Text style={st.foodScanFootnote}>
        Food Scan cannot detect bacteria, internal spoilage, contamination, or guarantee that food is safe to eat.
      </Text>
    </View>
  );
}

function ModeButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[st.foodScanModeButton, active && st.foodScanModeButtonActive]}
    >
      <Text style={[st.foodScanModeText, active && st.foodScanModeTextActive]}>{label}</Text>
    </Pressable>
  );
}

function FoodScanResultCard({ result, mode }: { result: FoodScanResult; mode: FoodScanMode }) {
  return (
    <View style={st.foodScanResultCard}>
      <View style={st.foodScanResultHeader}>
        <View style={st.foodScanResultIdentity}>
          <Text style={st.foodScanEyebrow}>{result.category}</Text>
          <Text style={st.sectionTitle}>{result.productName}</Text>
        </View>
        <Text style={st.foodScanConfidence}>{result.confidence}% match</Text>
      </View>

      <Text style={st.sectionSub}>{result.summary}</Text>

      {mode === "fresh" && result.ripenessLevel !== "not_applicable" ? (
        <View style={st.foodScanRipeness}>
          <Text style={st.foodScanSectionTitle}>{RIPENESS_LABELS[result.ripenessLevel]}</Text>
          <Text style={st.itemMeta}>{result.ripenessConfidence}% visual confidence</Text>
        </View>
      ) : null}

      <ResultList title="Visible evidence" items={result.evidence} />
      <ResultList title="Ingredients read from label" items={result.ingredients} emptyLabel={mode === "label" ? "No ingredients were readable." : undefined} />
      <ResultList title="Possible allergens on label" items={result.allergens} />
      <ResultList title="Nutrition highlights" items={result.nutritionHighlights} />
      <ResultList title="What to do next" items={result.nextSteps} />

      {result.requiresConfirmation ? (
        <View style={st.foodScanSafetyCard}>
          <Text style={st.foodScanSafetyTitle}>Please confirm the result</Text>
          <Text style={st.foodScanSafetyText}>
            The item or label was not identified with high confidence. Check the name and packaging before relying on the details above.
          </Text>
        </View>
      ) : null}

      <View style={st.foodScanSafetyCard}>
        <Text style={st.foodScanSafetyTitle}>Safety note</Text>
        <Text style={st.foodScanSafetyText}>{result.safetyNote}</Text>
      </View>
    </View>
  );
}

function ResultList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: string[];
  emptyLabel?: string;
}) {
  if (items.length === 0 && !emptyLabel) return null;
  return (
    <View style={st.foodScanSection}>
      <Text style={st.foodScanSectionTitle}>{title}</Text>
      {items.length === 0 ? <Text style={st.itemMeta}>{emptyLabel}</Text> : items.map((item, index) => (
        <View key={`${title}-${index}`} style={st.foodScanBulletRow}>
          <Text style={st.foodScanBullet}>•</Text>
          <Text style={st.foodScanBulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}
