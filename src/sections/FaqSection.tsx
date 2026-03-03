import React from "react";
import { Text, View } from "react-native";
import { motion } from "framer-motion";
import { isWeb, fadeUp, scaleIn } from "../constants/variants";
import useLayout from "../hooks/useLayout";
import s from "../styles";
import { useSiteI18n } from "../i18n/siteI18n";

export default function FaqSection() {
  const { isMd, isLg, pad } = useLayout();
  const { copy } = useSiteI18n();
  const faqs = copy.faq.items;

  return (
    <View
      nativeID="faq"
      {...(isWeb ? ({ id: "faq" } as any) : {})}
      role="region"
      aria-label="FAQ"
      style={[
        s.faqWrap,
        { paddingHorizontal: pad },
        isWeb && ({ scrollMarginTop: 96 } as any),
      ]}
    >
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
              <Text style={s.sectionEyebrow}>{copy.faq.eyebrow}</Text>
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
                {copy.faq.title}
              </Text>
            </motion.div>
          </>
        ) : (
          <>
            <Text style={s.sectionEyebrow}>{copy.faq.eyebrow}</Text>
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={[
                s.sectionTitle,
                isLg && { fontSize: 42, lineHeight: 50 },
              ]}
            >
              {copy.faq.title}
            </Text>
          </>
        )}

        <View style={[s.faqGrid, isMd && { flexDirection: "row" }]}>
          {faqs.map((faq, idx) => {
            const card = (
              <View key={faq.q} style={[s.faqCard, isMd && { flex: 1 }]}>
                <Text style={s.faqQ}>{faq.q}</Text>
                <Text style={s.faqA}>{faq.a}</Text>
              </View>
            );

            if (!isWeb) return card;

            return (
              <motion.div
                key={faq.q}
                variants={scaleIn}
                custom={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                whileHover={{
                  y: -6,
                  boxShadow: "0 12px 40px rgba(171,201,0,0.14)",
                  transition: { duration: 0.25 },
                }}
                style={{
                  flex: isMd ? 1 : undefined,
                  borderRadius: 22,
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
