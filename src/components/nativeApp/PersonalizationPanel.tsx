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
  initialPreferences: ProfilePreferences;
  storeOptions: string[];
  saving: boolean;
  onSave: (preferences: ProfilePreferences) => void;
  onDraftChange: (preferences: ProfilePreferences) => void;
  onSkip: () => void;
};

export function PersonalizationPanel({
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
    onDraftChange({
      interestedCategories: interests,
      shoppingFrequency: frequency,
      favoriteStores,
      completed: initialPreferences.completed,
    });
  }, [favoriteStores, frequency, initialPreferences.completed, interests, onDraftChange]);

  const toggleValue = (value: string, values: string[], setValues: (next: string[]) => void) => {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  return (
    <View style={st.personalizationPage}>
      <View style={st.authIntro}>
        <Text style={st.authTitle}>Make PocketCart more useful</Text>
        <Text style={st.authDescription}>
          Three quick questions help us prioritize relevant deals. Every question is optional.
        </Text>
      </View>

      <SurveyQuestion number="1" title="What do you usually shop for?" description="Choose as many as you like.">
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

      <SurveyQuestion number="2" title="How often do you buy groceries?">
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

      <SurveyQuestion number="3" title="Which stores do you visit most?" description="Select any stores you regularly use.">
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

      <View style={st.personalizationActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onSave({
            interestedCategories: interests,
            shoppingFrequency: frequency,
            favoriteStores,
            completed: true,
          })}
          style={[st.settingsButton, st.settingsButtonPrimary]}
          disabled={saving}
        >
          <Text style={st.settingsButtonPrimaryText}>{saving ? "Saving..." : "Save Preferences"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onSkip} style={st.personalizationSkipButton} disabled={saving}>
          <Text style={st.authTextButtonLabel}>Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SurveyQuestion({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={st.surveyCard}>
      <View style={st.surveyQuestionHeader}>
        <View style={st.surveyNumber}><Text style={st.surveyNumberText}>{number}</Text></View>
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
