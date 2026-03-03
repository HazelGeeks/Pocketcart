import React from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { motion } from "framer-motion";
import { isWeb, scaleIn } from "../constants/variants";
import AppleIcon from "./icons/AppleIcon";
import GooglePlayIcon from "./icons/GooglePlayIcon";
import s from "../styles";

function StoreBadge({
  store,
  delay,
}: {
  store: "apple" | "google";
  delay?: number;
}) {
  const isApple = store === "apple";
  const url = isApple
    ? "https://apps.apple.com"
    : "https://play.google.com/store";

  const inner = (
    <Pressable
      onPress={() => Linking.openURL(url)}
      style={({ pressed }) => [s.badge, pressed && { opacity: 0.8 }]}
    >
      <View style={s.badgeIconWrap}>
        {isApple ? (
          <AppleIcon size={20} color="#FFFFFF" />
        ) : (
          <GooglePlayIcon size={20} color="#FFFFFF" />
        )}
      </View>
      <View>
        <Text style={s.badgeSmall}>
          {isApple ? "Download on the" : "GET IT ON"}
        </Text>
        <Text style={s.badgeLarge}>
          {isApple ? "App Store" : "Google Play"}
        </Text>
      </View>
    </Pressable>
  );

  if (!isWeb) return inner;

  return (
    <motion.div
      variants={scaleIn}
      custom={delay ?? 0}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      whileHover={{ scale: 1.05, y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {inner}
    </motion.div>
  );
}

export function BadgeRow({ center }: { center?: boolean }) {
  return (
    <View style={[s.badgeRow, center && { justifyContent: "center" }]}>
      <StoreBadge store="apple" delay={5} />
      <StoreBadge store="google" delay={6} />
    </View>
  );
}

export default StoreBadge;
