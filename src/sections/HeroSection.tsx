import React from "react";
import { Text, View } from "react-native";
import { motion } from "framer-motion";
import { isWeb, fadeUp, fadeIn, scaleIn, slideLeft } from "../constants/variants";
import useLayout from "../hooks/useLayout";
import { BadgeRow } from "../components/StoreBadge";
import { HeroProductPreview } from "../components/HeroProductPreview";
import s from "../styles";
import { useSiteI18n } from "../i18n/siteI18n";

export default function HeroSection() {
  const { isMd, isLg, pad } = useLayout();
  const { copy } = useSiteI18n();
  const pills = copy.hero.pills;

  return (
    <View role="banner" style={[s.heroWrap, { paddingHorizontal: pad }]}>
      <View
        style={[
          s.heroContent,
          { maxWidth: 1280, alignSelf: "center", width: "100%" },
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
                style={[s.heroTitle, isLg && { fontSize: 68, lineHeight: 72 }]}
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
              style={[s.heroTitle, isLg && { fontSize: 68, lineHeight: 72 }]}
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

        {/* Right — product experience preview */}
        {isWeb ? (
            <motion.div
              variants={slideLeft}
              initial="hidden"
              animate={{ opacity: 1, x: 0 }}
              transition={{
                opacity: { duration: 0.7, ease: "easeOut" as const },
                x: { duration: 0.7, ease: "easeOut" as const },
              }}
               style={{
                 width: isLg ? 540 : isMd ? 390 : "100%",
                 minHeight: isMd ? 520 : 460,
                 position: "relative",
               }}
             >
               <HeroProductPreview {...copy.hero.card} />
             </motion.div>
           ) : (
             <View style={s.heroCardWrap}>
               <HeroProductPreview {...copy.hero.card} />
             </View>
          )}
      </View>
    </View>
  );
}
