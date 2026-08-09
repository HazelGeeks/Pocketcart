import React from "react";
import { ImageBackground, Text, View } from "react-native";
import s from "../styles";

const groceryPhoto = require("../../assets/photos/fresh-grocery-basket.jpg");

type Props = {
  compact?: boolean;
};

export function HeroGroceryPhoto({ compact = false }: Props) {
  return (
    <View style={s.heroPhotoCard}>
      <ImageBackground
        source={groceryPhoto}
        resizeMode="cover"
        style={[s.heroPhotoImage, compact && { minHeight: 300 }]}
        imageStyle={s.heroPhotoImageSurface}
        accessibilityLabel="Basket filled with fresh vegetables"
      >
        <View style={s.heroPhotoShade} />
        <View style={s.heroPhotoCopy}>
          <View style={s.heroPhotoEyebrowWrap}>
            <Text style={s.heroPhotoEyebrow}>WEEKLY PRICE BOARD</Text>
          </View>
          <Text style={[s.heroPhotoTitle, compact && { fontSize: 30, lineHeight: 34 }]}>Compare before you shop.</Text>
          <Text style={s.heroPhotoBody}>
            Current tracked prices from local grocery stores, in one clear view.
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}
