import { Text, View } from "react-native";
import { motion } from "framer-motion";
import { isWeb, fadeUp } from "../constants/variants";
import useLayout from "../hooks/useLayout";
import { BadgeRow } from "../components/StoreBadge";
import s from "../styles";
import { useSiteI18n } from "../i18n/siteI18n";

export default function CtaSection() {
  const { isLg, pad } = useLayout();
  const { copy } = useSiteI18n();

  return (
    <View
      role="region"
      aria-label="Download"
      style={[s.ctaWrap, { paddingHorizontal: pad }]}
    >
      <View
        style={[
          s.ctaInner,
          { maxWidth: 720, alignSelf: "center", width: "100%" },
        ]}
      >
        {isWeb ? (
          <>
            <motion.div
              variants={fadeUp}
              custom={0}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
            >
              <Text style={s.ctaEyebrow}>{copy.cta.eyebrow}</Text>
            </motion.div>
            <motion.div
              variants={fadeUp}
              custom={1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
            >
              <Text
                accessibilityRole="header"
                aria-level={2}
                style={[s.ctaTitle, isLg && { fontSize: 48, lineHeight: 56 }]}
              >
                {copy.cta.titleLine1}
                {"\n"}
                {copy.cta.titleLine2}
              </Text>
            </motion.div>
            <motion.div
              variants={fadeUp}
              custom={2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
            >
              <Text style={[s.ctaSub, { maxWidth: 480 }]}>{copy.cta.sub}</Text>
            </motion.div>
            <motion.div
              variants={fadeUp}
              custom={3}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
            >
              <BadgeRow center />
            </motion.div>
          </>
        ) : (
          <>
            <Text style={s.ctaEyebrow}>{copy.cta.eyebrow}</Text>
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={[s.ctaTitle, isLg && { fontSize: 48, lineHeight: 56 }]}
            >
              {copy.cta.titleLine1}
              {"\n"}
              {copy.cta.titleLine2}
            </Text>
            <Text style={[s.ctaSub, { maxWidth: 480 }]}>{copy.cta.sub}</Text>
            <BadgeRow center />
          </>
        )}
      </View>
    </View>
  );
}
