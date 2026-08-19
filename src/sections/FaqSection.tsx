import React from "react";
import { Pressable, Text, View } from "react-native";
import { AnimatePresence, motion } from "framer-motion";
import { isWeb, fadeUp } from "../constants/variants";
import useLayout from "../hooks/useLayout";
import s from "../styles";
import { useSiteI18n } from "../i18n/siteI18n";
import { AppIcon } from "../components/icons/AppIcon";

export default function FaqSection() {
  const { isMd, isLg, pad } = useLayout();
  const { copy } = useSiteI18n();
  const [openIndex, setOpenIndex] = React.useState(0);

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
      <View style={[s.faqInner, isMd && { flexDirection: "row" }]}>
        <View style={[s.faqIntro, isMd && { flex: 0.72 }]}>
          <Text style={s.sectionEyebrow}>{copy.faq.eyebrow}</Text>
          <Text
            accessibilityRole="header"
            aria-level={2}
            style={[s.sectionTitle, isLg && { fontSize: 48, lineHeight: 54 }]}
          >
            {copy.faq.title}
          </Text>
        </View>

        <View style={[s.faqList, isMd && { flex: 1.28 }]}>
          {copy.faq.items.map((faq, index) => {
            const open = openIndex === index;
            const questionId = `faq-question-${index}`;
            const answerId = `faq-answer-${index}`;
            return (
              <motion.div
                key={faq.q}
                variants={fadeUp}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
                <View style={s.faqItem}>
                  <Pressable
                    {...(isWeb
                      ? ({ id: questionId, "aria-controls": answerId } as any)
                      : {})}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    onPress={() => setOpenIndex(open ? -1 : index)}
                    style={({ pressed }) => pressed && { opacity: 0.82 }}
                  >
                    <View style={s.faqQuestionRow}>
                      <Text style={s.faqItemNum}>0{index + 1}</Text>
                      <Text style={s.faqQ}>{faq.q}</Text>
                      <View style={[s.faqToggle, open && s.faqToggleOpen]}>
                        <AppIcon
                          name={open ? "close" : "chevron-right"}
                          color={open ? "#FFFFFF" : "#102918"}
                          size={16}
                        />
                      </View>
                    </View>
                  </Pressable>
                  <AnimatePresence initial={false}>
                    {open ? (
                      <motion.div
                        id={answerId}
                        role="region"
                        aria-labelledby={questionId}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.24, ease: "easeOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <Text style={s.faqA}>{faq.a}</Text>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </View>
              </motion.div>
            );
          })}
        </View>
      </View>
    </View>
  );
}
