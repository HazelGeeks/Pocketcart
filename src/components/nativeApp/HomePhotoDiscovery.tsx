import { ImageBackground, Text, View } from "react-native";
import { st } from "../../screens/nativeAppStyles";

const groceryPhoto = require("../../../assets/photos/fresh-grocery-basket.jpg");

export function HomePhotoBanner({ productCount }: { productCount: number }) {
  return (
    <ImageBackground
      source={groceryPhoto}
      resizeMode="cover"
      style={st.homePhotoBanner}
      imageStyle={st.homePhotoBannerImage}
      accessibilityLabel="Basket filled with fresh vegetables"
    >
      <View style={st.homePhotoBannerShade} />
      <View style={st.homePhotoBannerCopy}>
        <View style={st.homePhotoBannerEyebrowWrap}>
          <Text style={st.homePhotoBannerEyebrow}>WEEKLY PRICE BOARD</Text>
        </View>
        <Text style={st.homePhotoBannerTitle}>Start with today&apos;s price.</Text>
        <Text style={st.homePhotoBannerBody}>
          Compare {productCount} currently priced groceries before you make your list.
        </Text>
      </View>
    </ImageBackground>
  );
}
