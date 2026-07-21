import React from "react";
import { Pressable, Text, View } from "react-native";

export type AdminTechnicalDetailItem = {
  key: string;
  label: string;
  value: string;
};

type Props = {
  accessibilityContext: string;
  items: AdminTechnicalDetailItem[];
  styles: Record<string, any>;
};

type CopyState = {
  key: string;
  status: "copied" | "failed";
};

export default function AdminTechnicalDetails({
  accessibilityContext,
  items,
  styles: st,
}: Props) {
  const [expanded, setExpanded] = React.useState(false);
  const [copyState, setCopyState] = React.useState<CopyState | null>(null);
  const resetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const resetCopyStateLater = React.useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => setCopyState(null), 1800);
  }, []);

  const handleCopy = React.useCallback(
    async (key: string, value: string) => {
      try {
        if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
          throw new Error("Clipboard is unavailable.");
        }
        await navigator.clipboard.writeText(value);
        setCopyState({ key, status: "copied" });
      } catch {
        setCopyState({ key, status: "failed" });
      }
      resetCopyStateLater();
    },
    [resetCopyStateLater],
  );

  return (
    <View style={st.technicalDetails}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? "Hide" : "Show"} technical details for ${accessibilityContext}`}
        accessibilityState={{ expanded }}
        onPress={(event) => {
          event.stopPropagation();
          setExpanded((current) => !current);
        }}
        style={st.technicalDetailsToggle}
      >
        <Text style={st.technicalDetailsToggleText}>
          {expanded ? "Hide details" : "Details"}
        </Text>
      </Pressable>

      {expanded ? (
        <View style={st.technicalDetailsPanel}>
          {items.map((item) => {
            const itemCopyState = copyState?.key === item.key ? copyState.status : null;
            return (
              <View key={item.key} style={st.technicalDetailsRow}>
                <View style={st.technicalDetailsTextGroup}>
                  <Text style={st.technicalDetailsLabel}>{item.label}</Text>
                  <Text selectable style={st.technicalDetailsValue}>
                    {item.value}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Copy ${item.label}`}
                  onPress={(event) => {
                    event.stopPropagation();
                    void handleCopy(item.key, item.value);
                  }}
                  style={st.technicalDetailsCopyButton}
                >
                  <Text
                    accessibilityLiveRegion="polite"
                    style={st.technicalDetailsCopyButtonText}
                  >
                    {itemCopyState === "copied"
                      ? "Copied"
                      : itemCopyState === "failed"
                        ? "Try again"
                        : "Copy"}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
