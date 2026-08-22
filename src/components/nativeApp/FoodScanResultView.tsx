import { Text, View } from "react-native";
import { st } from "../../screens/nativeAppStyles";
import type { FoodScanMode, FoodScanResult } from "../../services/foodScan";

const RIPENESS_LABELS: Record<FoodScanResult["ripenessLevel"], string> = {
  unripe: "Likely unripe",
  ready: "Likely ready",
  overripe: "Possibly overripe",
  unknown: "Ripeness unclear",
  not_applicable: "Not applicable",
};

export function FoodScanResultView({
  result,
  mode,
}: {
  result: FoodScanResult;
  mode: FoodScanMode;
}) {
  return (
    <View accessibilityLiveRegion="polite" style={st.foodScanResultCard}>
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
      <ResultList
        title="Ingredients read from label"
        items={result.ingredients}
        emptyLabel={mode === "label" ? "No ingredients were readable." : undefined}
      />
      <ResultList title="Possible allergens on label" items={result.allergens} />
      <ResultList title="Nutrition highlights" items={result.nutritionHighlights} />
      <ResultList title="What to do next" items={result.nextSteps} />

      {result.requiresConfirmation ? (
        <View style={st.foodScanSafetyCard}>
          <Text style={st.foodScanSafetyTitle}>Please confirm the result</Text>
          <Text style={st.foodScanSafetyText}>
            The item or label was not identified with high confidence. Check the name and packaging
            before relying on the details above.
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
      {items.length === 0 ? (
        <Text style={st.itemMeta}>{emptyLabel}</Text>
      ) : (
        items.map((item) => (
          <View key={`${title}-${item}`} style={st.foodScanBulletRow}>
            <Text style={st.foodScanBullet}>•</Text>
            <Text style={st.foodScanBulletText}>{item}</Text>
          </View>
        ))
      )}
    </View>
  );
}
