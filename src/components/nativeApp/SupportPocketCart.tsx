import { Alert, Linking } from "react-native";
import { POCKETCART_SUPPORT_URL } from "../../constants/support";
import { SettingsLinkRow } from "./SettingsMenu";

export function SupportPocketCart() {
  return (
      <SettingsLinkRow
        label="❤️ Support Pocket Cart"
        value="Help keep Pocket Cart growing"
        onPress={() => {
          void Linking.openURL(POCKETCART_SUPPORT_URL).catch(() => {
            Alert.alert("Unable to open support", `Please try again later or visit ${POCKETCART_SUPPORT_URL} in your browser.`);
          });
        }}
      />
  );
}
