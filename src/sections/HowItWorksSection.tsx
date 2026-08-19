import React from "react";
import { Text, View } from "react-native";
import { motion } from "framer-motion";
import { isWeb, fadeUp, scaleIn } from "../constants/variants";
import useLayout from "../hooks/useLayout";
import s from "../styles";
import { useSiteI18n } from "../i18n/siteI18n";

export default function HowItWorksSection() {
  const { isMd, isLg, pad } = useLayout();
  const { copy } = useSiteI18n();

  return (
    <View
      nativeID="how-it-works"
      {...(isWeb ? ({ id: "how-it-works" } as any) : {})}
      role="region"
      aria-label="How it works"
      style={[
        s.howWrap,
        { paddingHorizontal: pad },
        isWeb && ({ scrollMarginTop: 96 } as any),
      ]}
    >
      <View style={[s.sectionInner, { maxWidth: 1280 }]}>
        <View style={[s.howEditorial, isMd && { flexDirection: "row" }]}>
          <View style={[s.howIntro, isMd && { flex: 0.82 }]}>
            <Text style={s.sectionEyebrow}>{copy.how.eyebrow}</Text>
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={[s.sectionTitle, isLg && { fontSize: 48, lineHeight: 54 }]}
            >
              {copy.how.titleLine1}{"\n"}{copy.how.titleLine2}
            </Text>
            <View style={s.howRule} />
          </View>

          <View style={[s.workflowList, isMd && { flex: 1.18 }]}>
            {copy.how.steps.map((step, index) => {
              const content = (
                <View style={s.workflowRow}>
                  <Text style={s.workflowNum}>{step.num}</Text>
                  <View style={s.workflowCopy}>
                    <Text style={s.workflowTitle}>{step.title}</Text>
                    <Text style={s.workflowBody}>{step.body}</Text>
                  </View>
                </View>
              );

              if (!isWeb) return <React.Fragment key={step.num}>{content}</React.Fragment>;

              return (
                <motion.div
                  key={step.num}
                  variants={fadeUp}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                >
                  {content}
                </motion.div>
              );
            })}
          </View>
        </View>

        <View style={[s.statRow, isMd && { flexDirection: "row" }]}>
          {copy.how.stats.map((stat, index) => {
            const content = (
              <View style={[s.statCard, isMd && { flex: 1 }]}>
                <Text style={s.statValue}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            );

            if (!isWeb) return <React.Fragment key={stat.label}>{content}</React.Fragment>;

            return (
              <motion.div
                key={stat.label}
                variants={scaleIn}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                style={{ flex: isMd ? 1 : undefined }}
              >
                {content}
              </motion.div>
            );
          })}
        </View>
      </View>
    </View>
  );
}
