import React from "react";
import { Text, View } from "react-native";
import { motion } from "framer-motion";
import { isWeb, fadeUp, scaleIn } from "../constants/variants";
import useLayout from "../hooks/useLayout";
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
      <View style={[s.sectionInner, { maxWidth: 1280 }]}>
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
                style={[
                  s.featCard,
                  i === 0 && s.featCardFeatured,
                  !isWeb && isMd && { flexBasis: "47%", flexGrow: 1 },
                ]}
              >
                <View style={s.featCardTopline}>
                  <View style={[s.featIconWrap, i === 0 && s.featIconWrapFeatured]}>
                    <AppIcon name={icon} color={i === 0 ? "#CFF36B" : "#16784A"} size={25} strokeWidth={2.1} />
                  </View>
                  <Text style={[s.featIndex, i === 0 && s.featIndexFeatured]}>0{i + 1}</Text>
                </View>
                <Text style={[s.featTitle, i === 0 && s.featTitleFeatured]}>{f.title}</Text>
                <Text style={[s.featBody, i === 0 && s.featBodyFeatured]}>{f.body}</Text>
              </View>
            );

            if (!isWeb) {
              return <React.Fragment key={f.title}>{card}</React.Fragment>;
            }

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
                }}
              >
                {card}
              </motion.div>
            );
          })}
        </View>
      </View>
    </View>
  );
}
