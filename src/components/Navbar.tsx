import { Image, Pressable, Text, View } from "react-native";
import { motion } from "framer-motion";
import { isWeb } from "../constants/variants";
import useLayout from "../hooks/useLayout";
import type { Route } from "../constants/palette";
import { useSiteI18n } from "../i18n/siteI18n";
import WebLink from "./WebLink";
import MobileNavigation from "./MobileNavigation";
import s from "../styles";

export type SectionId = "features" | "how-it-works" | "faq" | "download";

export default function Navbar({
  onNavigate,
  onNavigateSection,
}: {
  onNavigate: (r: Route) => void;
  onNavigateSection: (s: SectionId) => void;
}) {
  const { isMd, pad, w } = useLayout();
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
      style={[s.nav, { paddingHorizontal: pad }]}
    >
      <View style={s.navInner}>
        <WebLink href="/" accessibilityLabel="PocketCart" onPress={() => onNavigate("home")}>
          <View style={[s.brand, !isMd && { gap: 6 }]}>
            <Image
              source={require("../../assets/web-logo.png")}
              style={[s.brandMark, !isMd && { width: 30, height: 30 }]}
            />
            {w >= 480 ? (
              <Text style={[s.brandName, !isMd && { fontSize: 14 }]}>PocketCart</Text>
            ) : null}
          </View>
        </WebLink>

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

        <View style={[s.navActionRow, !isMd && { gap: 8 }]}>
          <View accessibilityLabel={copy.nav.language} style={s.navLangWrap}>
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
                    !isMd && { minWidth: 32, paddingHorizontal: 6 },
                    active && s.navLangOptionActive,
                    pressed && s.navLangOptionPressed,
                  ]}
                >
                  <Text style={[s.navLangOptionText, active && s.navLangOptionTextActive]}>
                    {option.shortLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <WebLink href="/#download" onPress={() => onNavigateSection("download")}>
            <View style={[s.navCta, !isMd && { paddingHorizontal: 12 }]}>
              <Text style={[s.navCtaText, !isMd && { fontSize: 12 }]}>{copy.nav.getApp}</Text>
            </View>
          </WebLink>
          {!isMd && isWeb ? (
            <MobileNavigation
              locale={locale}
              links={navLinks.map((item) => ({
                label: item.label,
                href: item.kind === "route" ? `/${item.route}` : `/#${item.section}`,
                onSelect: () =>
                  item.kind === "route" ? onNavigate(item.route) : onNavigateSection(item.section),
              }))}
            />
          ) : null}
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
