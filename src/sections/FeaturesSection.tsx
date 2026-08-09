import React from "react";
import { Text, View } from "react-native";
import { motion } from "framer-motion";
import { isWeb, fadeUp, scaleIn } from "../constants/variants";
import useLayout from "../hooks/useLayout";
import Blob from "../components/Blob";
import s from "../styles";
import { useSiteI18n } from "../i18n/siteI18n";
import { AppIcon, type AppIconName } from "../components/icons/AppIcon";

const FEATURE_ICONS: AppIconName[] = ["map", "heart", "list", "bell"];

export default function FeaturesSection() {
  const { isMd, isLg, pad } = useLayout();
  const { copy } = useSiteI18n();
  const features = copy.features.cards;

  return (
    <View
      nativeID="features"
      {...(isWeb ? ({ id: "features" } as any) : {})}
      role="region"
      aria-label="Features"
      style={[
        s.featWrap,
        { paddingHorizontal: pad },
        isWeb && ({ scrollMarginTop: 96 } as any),
      ]}
    >
      {isWeb ? (
        <>
          <motion.div
            animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              top: -40,
              left: isLg ? 100 : -40,
              width: 340,
              height: 340,
              borderRadius: 170,
              backgroundColor: "rgba(97,227,146,0.05)",
              pointerEvents: "none" as const,
            }}
          />
          <motion.div
            animate={{ y: [0, -15, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 11,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            style={{
              position: "absolute",
              bottom: -60,
              right: -40,
              width: 260,
              height: 260,
              borderRadius: 130,
              backgroundColor: "rgba(97,227,146,0.06)",
              pointerEvents: "none" as const,
            }}
          />
        </>
      ) : (
        <>
          <Blob
            size={340}
            color="rgba(97,227,146,0.05)"
            top={-40}
            left={isLg ? 100 : -40}
          />
          <Blob
            size={260}
            color="rgba(97,227,146,0.06)"
            bottom={-60}
            right={-40}
          />
        </>
      )}

      <View style={[s.sectionInner, { maxWidth: 1200 }]}>
        {isWeb ? (
          <>
            <motion.div
              variants={fadeUp}
              custom={0}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <Text style={s.sectionEyebrow}>{copy.features.eyebrow}</Text>
            </motion.div>
            <motion.div
              variants={fadeUp}
              custom={1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <Text
                accessibilityRole="header"
                aria-level={2}
                style={[
                  s.sectionTitle,
                  isLg && { fontSize: 42, lineHeight: 50 },
                ]}
              >
                {copy.features.titleLine1}
                {"\n"}
                {copy.features.titleLine2}
              </Text>
            </motion.div>
            <motion.div
              variants={fadeUp}
              custom={2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <Text style={[s.sectionSub, { maxWidth: 520 }]}>
                {copy.features.sub}
              </Text>
            </motion.div>
          </>
        ) : (
          <>
            <Text style={s.sectionEyebrow}>{copy.features.eyebrow}</Text>
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={[s.sectionTitle, isLg && { fontSize: 42, lineHeight: 50 }]}
            >
              {copy.features.titleLine1}
              {"\n"}
              {copy.features.titleLine2}
            </Text>
            <Text style={[s.sectionSub, { maxWidth: 520 }]}>
              {copy.features.sub}
            </Text>
          </>
        )}

        <View
          style={[
            s.featGrid,
            isMd && { flexDirection: "row", flexWrap: "wrap" },
          ]}
        >
          {features.map((f, i) => {
            const icon = FEATURE_ICONS[i] ?? "map";
            const card = (
              <View
                key={f.title}
                style={[
                  s.featCard,
                  isMd && { flexBasis: "47%", flexGrow: 1 },
                  i % 2 === 1 && isMd && { marginTop: 28 },
                ]}
              >
                <View style={s.featIconWrap}>
                  <AppIcon name={icon} color="#16784A" size={25} strokeWidth={2.1} />
                </View>
                <Text style={s.featTitle}>{f.title}</Text>
                <Text style={s.featBody}>{f.body}</Text>
              </View>
            );

            if (!isWeb) return card;

            return (
              <motion.div
                key={f.title}
                variants={scaleIn}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                whileHover={{
                  y: -8,
                  boxShadow: "0 16px 48px rgba(97,227,146,0.12)",
                  transition: { duration: 0.25 },
                }}
                style={{
                  borderRadius: 24,
                  ...(isMd ? { flexBasis: "47%", flexGrow: 1 } : {}),
                  ...(i % 2 === 1 && isMd ? { marginTop: 28 } : {}),
                }}
              >
                <View style={[s.featCard, { marginTop: 0 }]}>
                  <View style={s.featIconWrap}>
                    <AppIcon name={icon} color="#16784A" size={25} strokeWidth={2.1} />
                  </View>
                  <Text style={s.featTitle}>{f.title}</Text>
                  <Text style={s.featBody}>{f.body}</Text>
                </View>
              </motion.div>
            );
          })}
        </View>
      </View>
    </View>
  );
}
