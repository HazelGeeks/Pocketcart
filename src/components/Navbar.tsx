import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { motion } from "framer-motion";
import { isWeb } from "../constants/variants";
import useLayout from "../hooks/useLayout";
import type { Route } from "../constants/palette";
import { useSiteI18n } from "../i18n/siteI18n";
import WebLink from "./WebLink";
import s from "../styles";

export type SectionId = "features" | "how-it-works" | "faq";

export default function Navbar({
  onNavigate,
  onNavigateSection,
  onOpenApp,
}: {
  onNavigate: (r: Route) => void;
  onNavigateSection: (s: SectionId) => void;
  onOpenApp: () => void;
}) {
  const { isMd, pad } = useLayout();
  const { locale, setLocale, copy } = useSiteI18n();
  const langOptions = [
    { value: "en" as const, shortLabel: "EN", label: copy.nav.english },
    { value: "fr" as const, shortLabel: "FR", label: copy.nav.french },
  ];
  const navLinks: Array<
    | { label: string; kind: "section"; section: SectionId }
    | { label: string; kind: "route"; route: Route }
  > = [
    {
      label: copy.nav.features,
      kind: "section",
      section: "features",
    },
    {
      label: copy.nav.howItWorks,
      kind: "section",
      section: "how-it-works",
    },
    {
      label: copy.nav.faq,
      kind: "section",
      section: "faq",
    },
    { label: copy.nav.blog, kind: "route", route: "blog" },
  ];

  const navContent = (
    <View
      role="navigation"
      accessibilityLabel="Main navigation"
      style={[
        s.nav,
        { paddingHorizontal: pad },
      ]}
    >
        <View style={s.navInner}>
          {/* Brand */}
        <WebLink href="/" onPress={() => onNavigate("home")}>
          <View style={s.brand}>
            {isWeb ? (
              <motion.div
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Image
                  source={require("../../assets/favicon.svg")}
                  style={s.brandMark}
                />
              </motion.div>
            ) : (
              <Image
                source={require("../../assets/favicon.svg")}
                style={s.brandMark}
              />
            )}
            <Text style={s.brandName}>PocketCart</Text>
          </View>
        </WebLink>

        {/* Links (desktop) */}
        {isMd && (
          <View style={s.navLinks}>
            {navLinks.map((item) => (
              <WebLink
                key={item.label}
                href={
                  item.kind === "route"
                    ? item.route === "home"
                      ? "/"
                      : `/${item.route}`
                    : `/#${item.section}`
                }
                onPress={() => {
                  if (item.kind === "route") {
                    onNavigate(item.route);
                    return;
                  }
                  onNavigateSection(item.section);
                }}
              >
                <Text style={s.navLink}>{item.label}</Text>
              </WebLink>
            ))}
          </View>
        )}

        <View style={s.navActionRow}>
          <View
            accessibilityLabel={copy.nav.language}
            style={s.navLangWrap}
          >
            {langOptions.map((option) => {
              const active = locale === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: active }}
                  onPress={() => setLocale(option.value)}
                  style={({ pressed }) => [
                    s.navLangOption,
                    active && s.navLangOptionActive,
                    pressed && s.navLangOptionPressed,
                  ]}
                >
                  <Text
                    style={[
                      s.navLangOptionText,
                      active && s.navLangOptionTextActive,
                    ]}
                  >
                    {option.shortLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* CTA */}
          {isWeb ? (
            <motion.div
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
            >
              <WebLink href="/app" onPress={onOpenApp}>
                <View style={s.navCta}>
                  <Text style={s.navCtaText}>{copy.nav.getApp}</Text>
                </View>
              </WebLink>
            </motion.div>
          ) : (
            <Pressable style={s.navCta} onPress={onOpenApp}>
              <Text style={s.navCtaText}>{copy.nav.getApp}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );

  if (!isWeb) return navContent;

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{ position: "sticky", top: 0, zIndex: 100 } as any}
    >
      {navContent}
    </motion.div>
  );
}
