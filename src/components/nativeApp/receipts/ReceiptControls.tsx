import { Pressable, Text, TextInput, View } from "react-native";
import { rs } from "./receiptStyles";
export function ReceiptButton({
  label,
  onPress,
  disabled = false,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[rs.button, secondary && rs.secondary, disabled && rs.disabled]}
    >
      <Text style={[rs.buttonText, secondary && rs.secondaryText]}>{label}</Text>
    </Pressable>
  );
}
export function ReceiptField({
  label,
  value,
  onChange,
  numeric = false,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  numeric?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <View style={rs.field}>
      <Text style={rs.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? "decimal-pad" : "default"}
        placeholder={placeholder}
        placeholderTextColor="#78887C"
        autoCorrect={false}
        editable={!disabled}
        style={rs.input}
      />
    </View>
  );
}
