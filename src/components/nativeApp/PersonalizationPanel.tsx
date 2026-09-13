import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  SHOPPING_FREQUENCY_LABELS,
  type ProfilePreferences,
  type ShoppingFrequency,
} from "../../services/profilePreferences";
import { st } from "../../screens/nativeAppStyles";

const INTEREST_OPTIONS = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Bakery",
  "Snacks",
  "Beverages",
  "Household",
];

const FREQUENCY_OPTIONS = Object.entries(SHOPPING_FREQUENCY_LABELS) as Array<
  [ShoppingFrequency, string]
>;

type PersonalizationPanelProps = {
  editing?: boolean;
  initialPreferences: ProfilePreferences;
  storeOptions: string[];
  saving: boolean;
  onSave: (preferences: ProfilePreferences) => void;
  onDraftChange: (preferences: ProfilePreferences) => void;
  onSkip: () => void;
};

export function PersonalizationPanel({
  editing = false,
  initialPreferences,
  storeOptions,
  saving,
  onSave,
  onDraftChange,
  onSkip,
}: PersonalizationPanelProps) {
  const [interests, setInterests] = React.useState(initialPreferences.interestedCategories);
  const [frequency, setFrequency] = React.useState<ShoppingFrequency | null>(initialPreferences.shoppingFrequency);
  const [favoriteStores, setFavoriteStores] = React.useState(initialPreferences.favoriteStores);

  React.useEffect(() => {
    if (editing) return;
    onDraftChange({
      interestedCategories: interests,
      shoppingFrequency: frequency,
      favoriteStores,
      completed: initialPreferences.completed,
    });
  }, [editing, favoriteStores, frequency, initialPreferences.completed, interests, onDraftChange]);

  const toggleValue = (value: string, values: string[], setValues: (next: string[]) => void) => {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const actions = (
    <View style={[st.personalizationActions, editing && { flexDirection: "row", alignItems: "center" }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onSave({
            interestedCategories: interests,
            shoppingFrequency: frequency,
            favoriteStores,
            completed: true,
          })}
          style={[st.settingsButton, st.settingsButtonPrimary, editing && { flex: 1 }]}
          disabled={saving}
        >
          <Text style={st.settingsButtonPrimaryText}>{saving ? "Saving..." : "Save Preferences"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onSkip} style={st.personalizationSkipButton} disabled={saving}>
          <Text style={st.authTextButtonLabel}>{editing ? "Cancel" : "Skip for now"}</Text>
        </Pressable>
      </View>
  );
  return (
    <View style={st.personalizationPage}>
      {editing ? actions : null}
      {!editing ? <View style={st.authIntro}>
        <Text style={st.authTitle}>Make PocketCart more useful</Text>
        <Text style={st.authDescription}>
          Three quick questions help us prioritize relevant deals. Every question is optional.
        </Text>
      </View> : null}

      <SurveyQuestion compact={editing} number="1" title="What do you usually shop for?" description="Choose as many as you like.">
        <View style={st.surveyChipWrap}>
          {INTEREST_OPTIONS.map((option) => (
            <ChoiceChip
              key={option}
              label={option}
              selected={interests.includes(option)}
              onPress={() => toggleValue(option, interests, setInterests)}
            />
          ))}
        </View>
      </SurveyQuestion>

      <SurveyQuestion compact={editing} number="2" title="How often do you buy groceries?">
        <View style={st.surveyOptionStack}>
          {FREQUENCY_OPTIONS.map(([value, label]) => (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: frequency === value }}
              onPress={() => setFrequency(value)}
              style={[st.surveyRadioRow, frequency === value && st.surveyRadioRowSelected]}
            >
              <View style={[st.surveyRadio, frequency === value && st.surveyRadioSelected]}>
                {frequency === value ? <View style={st.surveyRadioDot} /> : null}
              </View>
              <Text style={st.surveyRadioLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </SurveyQuestion>

      <SurveyQuestion compact={editing} number="3" title="Which stores do you visit most?" description="Select any stores you regularly use.">
        <View style={st.surveyChipWrap}>
          {storeOptions.map((option) => (
            <ChoiceChip
              key={option}
              label={option}
              selected={favoriteStores.includes(option)}
              onPress={() => toggleValue(option, favoriteStores, setFavoriteStores)}
            />
          ))}
        </View>
      </SurveyQuestion>

      {!editing ? actions : null}
    </View>
  );
}

function SurveyQuestion({
  compact,
  number,
  title,
  description,
  children,
}: {
  compact?: boolean;
  number: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={compact ? { gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#dce8df" } : st.surveyCard}>
      <View style={st.surveyQuestionHeader}>
        {!compact ? <View style={st.surveyNumber}><Text style={st.surveyNumberText}>{number}</Text></View> : null}
        <View style={st.settingsRowCopy}>
          <Text style={st.surveyTitle}>{title}</Text>
          {description ? <Text style={st.settingsHelp}>{description}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

function ChoiceChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[st.surveyChip, selected && st.surveyChipSelected]}
    >
      <Text style={[st.surveyChipText, selected && st.surveyChipTextSelected]}>{label}</Text>
    </Pressable>
  );
}
