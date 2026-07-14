import React from "react";
import { useFonts } from "@expo-google-fonts/nunito/useFonts";
import { Nunito_400Regular } from "@expo-google-fonts/nunito/400Regular";
import { Nunito_600SemiBold } from "@expo-google-fonts/nunito/600SemiBold";
import { Nunito_700Bold } from "@expo-google-fonts/nunito/700Bold";
import { Nunito_800ExtraBold } from "@expo-google-fonts/nunito/800ExtraBold";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BrandedLaunchScreen } from "./src/components/nativeApp/BrandedLaunchScreen";
import NativeAppScreen from "./src/screens/NativeAppScreen";

export default function App() {
  const [showLaunchScreen, setShowLaunchScreen] = React.useState(true);
  const finishLaunchScreen = React.useCallback(() => {
    setShowLaunchScreen(false);
  }, []);
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (showLaunchScreen) {
    return (
      <BrandedLaunchScreen
        ready={fontsLoaded || Boolean(fontError)}
        onFinish={finishLaunchScreen}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <NativeAppScreen />
    </SafeAreaProvider>
  );
}
