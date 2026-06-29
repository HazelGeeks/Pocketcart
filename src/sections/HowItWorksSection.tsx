import React from "react";
import { Text, View } from "react-native";
import { motion } from "framer-motion";
import { isWeb, fadeUp, scaleIn } from "../constants/variants";
import useLayout from "../hooks/useLayout";
import Blob from "../components/Blob";
import s from "../styles";
import { useSiteI18n } from "../i18n/siteI18n";

export default function HowItWorksSection() {
  const { isMd, isLg, pad } = useLayout();
  const { copy } = useSiteI18n();
  const steps = copy.how.steps;
  const stats = copy.how.stats;

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
      {isWeb ? (
        <>
          <motion.div
            animate={{ y: [0, -25, 0], x: [0, 12, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              top: -120,
              right: isLg ? -80 : -120,
              width: 480,
              height: 480,
              borderRadius: 240,
              backgroundColor: "rgba(97,227,146,0.06)",
              pointerEvents: "none" as const,
            }}
          />
          <motion.div
            animate={{ y: [0, 15, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5,
            }}
            style={{
              position: "absolute",
              bottom: 20,
              left: 40,
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: "rgba(234,242,192,0.5)",
              pointerEvents: "none" as const,
            }}
          />
        </>
      ) : (
        <>
          <Blob
            size={480}
            color="rgba(97,227,146,0.06)"
            top={-120}
            right={isLg ? -80 : -120}
          />
          <Blob
            size={200}
            color="rgba(234,242,192,0.5)"
            bottom={20}
            left={40}
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
              <Text style={s.sectionEyebrow}>{copy.how.eyebrow}</Text>
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
                {copy.how.titleLine1}
                {"\n"}
                {copy.how.titleLine2}
              </Text>
            </motion.div>
          </>
        ) : (
          <>
            <Text style={s.sectionEyebrow}>{copy.how.eyebrow}</Text>
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={[s.sectionTitle, isLg && { fontSize: 42, lineHeight: 50 }]}
            >
              {copy.how.titleLine1}
              {"\n"}
              {copy.how.titleLine2}
            </Text>
          </>
        )}

        <View style={[s.stepGrid, isMd && { flexDirection: "row" }]}>
          {steps.map((step, i) => {
            const card = (
              <View key={step.num} style={[s.stepCard, isMd && { flex: 1 }]}>
                <View style={s.stepNumCircle}>
                  <Text style={s.stepNumText}>{step.num}</Text>
                </View>
                {i < steps.length - 1 && isMd && (
                  <View style={s.stepConnector}>
                    <View style={s.stepConnectorDot} />
                  </View>
                )}
                <Text style={s.stepTitle}>{step.title}</Text>
                <Text style={s.stepBody}>{step.body}</Text>
              </View>
            );

            if (!isWeb) return card;

            return (
              <motion.div
                key={step.num}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                whileHover={{ y: -6 }}
                style={isMd ? { flex: 1 } : {}}
              >
                <View style={[s.stepCard]}>
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      delay: i * 0.2,
                    }}
                  >
                    <View style={s.stepNumCircle}>
                      <Text style={s.stepNumText}>{step.num}</Text>
                    </View>
                  </motion.div>
                  {i < steps.length - 1 && isMd && (
                    <View style={s.stepConnector}>
                      <View style={s.stepConnectorDot} />
                    </View>
                  )}
                  <Text style={s.stepTitle}>{step.title}</Text>
                  <Text style={s.stepBody}>{step.body}</Text>
                </View>
              </motion.div>
            );
          })}
        </View>

        {/* Stat highlights */}
        <View style={[s.statRow, isMd && { flexDirection: "row" }]}>
          {stats.map((stat, i) => {
            const card = (
              <View key={stat.label} style={[s.statCard, isMd && { flex: 1 }]}>
                <Text style={s.statValue}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            );

            if (!isWeb) return card;

            return (
              <motion.div
                key={stat.label}
                variants={scaleIn}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 36px rgba(97,227,146,0.15)",
                }}
                style={{
                  flex: isMd ? 1 : undefined,
                  borderRadius: 22,
                }}
              >
                <View style={s.statCard}>
                  <motion.div
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.5,
                    }}
                  >
                    <Text style={s.statValue}>{stat.value}</Text>
                  </motion.div>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </View>
              </motion.div>
            );
          })}
        </View>
      </View>
    </View>
  );
}
