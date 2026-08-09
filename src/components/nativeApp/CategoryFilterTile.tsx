import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { st } from "../../screens/nativeAppStyles";
import { categoryToIconVariant } from "../../utils/categoryIcon";
import { CategoryPlaceholderIcon } from "./CategoryPlaceholderIcon";

const allCategoriesPhoto = require("../../../assets/photos/fresh-grocery-basket.jpg");

type Props = {
  active: boolean;
  imageUrl?: string;
  label: string;
  onPress: () => void;
};

export function CategoryFilterTile({ active, imageUrl, label, onPress }: Props) {
  const isAll = label === "All";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Show ${label} products`}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={st.categoryTile}
    >
      <View style={[st.categoryTileImageFrame, active && st.categoryTileImageFrameActive]}>
        {isAll ? (
          <Image source={allCategoriesPhoto} resizeMode="cover" style={st.categoryTileImage} />
        ) : imageUrl ? (
          <Image source={{ uri: imageUrl }} resizeMode="cover" style={st.categoryTileImage} />
        ) : (
          <CategoryPlaceholderIcon variant={categoryToIconVariant(label)} />
        )}
      </View>
      <Text
        numberOfLines={1}
        style={[st.categoryTileLabel, active && st.categoryTileLabelActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
