import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { categoryToIconVariant } from "../../utils/categoryIcon";
import { CategoryPlaceholderIcon } from "./CategoryPlaceholderIcon";

type Props = { uri?: string | null; category?: string; name: string };

export function CartProductThumbnail({ uri, category, name }: Props) {
  const [failedUri, setFailedUri] = React.useState<string | null>(null);
  return (
    <View style={styles.frame}>
      {uri && uri !== failedUri ? (
        <Image source={{ uri }} accessibilityLabel={name} resizeMode="contain"
          style={styles.image} onError={() => setFailedUri(uri)} />
      ) : (
        <View accessibilityLabel={`No image for ${name}`} accessibilityRole="image">
          <CategoryPlaceholderIcon variant={categoryToIconVariant(category ?? null)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: 56, height: 56, flexShrink: 0, borderRadius: 12, overflow: "hidden", backgroundColor: C.primaryGhost, alignItems: "center", justifyContent: "center" },
  image: { width: 56, height: 56, backgroundColor: C.white },
});
