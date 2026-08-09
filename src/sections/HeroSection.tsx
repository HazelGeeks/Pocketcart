import React from "react";
import { Text, View } from "react-native";
import { motion } from "framer-motion";
import {
  isWeb,
  fadeUp,
  fadeIn,
  scaleIn,
  slideLeft,
} from "../constants/variants";
import useLayout from "../hooks/useLayout";
import Blob from "../components/Blob";
import { BadgeRow } from "../components/StoreBadge";
import { HeroGroceryPhoto } from "../components/HeroGroceryPhoto";
import s from "../styles";
import { useSiteI18n } from "../i18n/siteI18n";

export default function HeroSection() {
  const { isMd, isLg, pad } = useLayout();
  const { copy } = useSiteI18n();
  const pills = copy.hero.pills;

  return (
    <View role="banner" style={[s.heroWrap, { paddingHorizontal: pad }]}>
      {/* Background blobs — ambient floating */}
      {isWeb ? (
        <>
          <motion.div
            animate={{ y: [0, -30, 0], x: [0, 15, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              top: -80,
              right: isLg ? -120 : -60,
              width: isLg ? 620 : 400,
              height: isLg ? 620 : 400,
              borderRadius: (isLg ? 620 : 400) / 2,
              backgroundColor: "rgba(97,227,146,0.07)",
              pointerEvents: "none" as const,
            }}
          />
          <motion.div
            animate={{ y: [0, 20, 0], x: [0, -12, 0], scale: [1, 1.08, 1] }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            style={{
              position: "absolute",
              bottom: 40,
              left: -60,
              width: isLg ? 340 : 220,
              height: isLg ? 340 : 220,
              borderRadius: (isLg ? 340 : 220) / 2,
              backgroundColor: "rgba(97,227,146,0.10)",
              pointerEvents: "none" as const,
            }}
          />
          <motion.div
            animate={{ y: [0, -18, 0], scale: [1, 1.12, 1] }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            style={{
              position: "absolute",
              top: isLg ? 200 : 120,
              right: isLg ? 280 : 80,
              width: isLg ? 180 : 120,
              height: isLg ? 180 : 120,
              borderRadius: (isLg ? 180 : 120) / 2,
              backgroundColor: "rgba(205,223,96,0.14)",
              pointerEvents: "none" as const,
            }}
          />
        </>
      ) : (
        <>
          <Blob
            size={isLg ? 620 : 400}
            color="rgba(97,227,146,0.07)"
            top={-80}
            right={isLg ? -120 : -60}
          />
          <Blob
            size={isLg ? 340 : 220}
            color="rgba(97,227,146,0.10)"
            bottom={40}
            left={-60}
          />
          <Blob
            size={isLg ? 180 : 120}
            color="rgba(205,223,96,0.14)"
            top={isLg ? 200 : 120}
            right={isLg ? 280 : 80}
          />
        </>
      )}

      <View
        style={[
          s.heroContent,
          { maxWidth: 1200, alignSelf: "center", width: "100%" },
          isMd && { flexDirection: "row", alignItems: "center" },
        ]}
      >
        {/* Left — copy */}
        <View style={[s.heroCopy, isMd && { flex: 1 }]}>
          {/* Pills */}
          {isWeb ? (
            <motion.div
              style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
              }}
              variants={fadeIn}
              custom={0}
              initial="hidden"
              animate="visible"
            >
              {pills.map((p, i) => (
                <motion.div
                  key={p}
                  variants={scaleIn}
                  custom={i * 0.5}
                  initial="hidden"
                  animate="visible"
                >
                  <View style={s.heroPill}>
                    <Text style={s.heroPillText}>{p}</Text>
                  </View>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <View style={s.heroPillRow}>
              {pills.map((p) => (
                <View key={p} style={s.heroPill}>
                  <Text style={s.heroPillText}>{p}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Title */}
          {isWeb ? (
            <motion.div
              variants={fadeUp}
              custom={1}
              initial="hidden"
              animate="visible"
            >
              <Text
                accessibilityRole="header"
                aria-level={1}
                style={[s.heroTitle, isLg && { fontSize: 56, lineHeight: 64 }]}
              >
                {copy.hero.titleLine1}
                {"\n"}
                {copy.hero.titleLine2}
              </Text>
            </motion.div>
          ) : (
            <Text
              accessibilityRole="header"
              aria-level={1}
              style={[s.heroTitle, isLg && { fontSize: 56, lineHeight: 64 }]}
            >
              {copy.hero.titleLine1}
              {"\n"}
              {copy.hero.titleLine2}
            </Text>
          )}

          {/* Subtitle */}
          {isWeb ? (
            <motion.div
              variants={fadeUp}
              custom={2}
              initial="hidden"
              animate="visible"
            >
              <Text style={[s.heroSub, { maxWidth: 520 }]}>{copy.hero.sub}</Text>
            </motion.div>
          ) : (
            <Text style={[s.heroSub, { maxWidth: 520 }]}>{copy.hero.sub}</Text>
          )}

          {/* Badges */}
          {isWeb ? (
            <motion.div
              variants={fadeUp}
              custom={3}
              initial="hidden"
              animate="visible"
            >
              <BadgeRow />
            </motion.div>
          ) : (
            <BadgeRow />
          )}
        </View>

        {/* Right — real grocery photography */}
        {isWeb ? (
            <motion.div
              variants={slideLeft}
              initial="hidden"
              animate={{ opacity: 1, x: 0 }}
              transition={{
                opacity: { duration: 0.7, ease: "easeOut" as const },
                x: { duration: 0.7, ease: "easeOut" as const },
              }}
              whileHover={{ y: -4 }}
              style={{
                width: isLg ? 340 : isMd ? 300 : "100%",
                minHeight: isMd ? 340 : 300,
                position: "relative",
              }}
            >
              <HeroGroceryPhoto compact={!isMd} />
            </motion.div>
          ) : (
            <View style={s.heroCardWrap}>
              <HeroGroceryPhoto compact={!isMd} />
            </View>
          )}
      </View>
    </View>
  );
}
