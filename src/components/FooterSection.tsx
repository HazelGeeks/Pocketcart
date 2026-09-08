import React from "react";
import { Image, Text, View } from "react-native";
import type { Route } from "../constants/palette";
import useLayout from "../hooks/useLayout";
import s from "../styles";
import { useSiteI18n } from "../i18n/siteI18n";
import WebLink from "./WebLink";

export default function FooterSection({ navigate }: { navigate: (r: Route) => void }) {
  const { isXl, isMd, pad } = useLayout();
  const { copy } = useSiteI18n();

  const LINK_ROUTES: Record<string, Route | null> = {
    blog: "blog",
    privacy: "privacy",
    terms: "terms",
    support: "support",
    "delete-account": "delete-account",
  };

  const utilityIds = new Set(["support", "delete-account"]);
  const linkGroups = copy.footer.groups.map((group) => ({
    ...group,
    links: group.links.filter((link) => !utilityIds.has(link.id)),
  }));
  const utilityLinks = copy.footer.groups
    .flatMap((group) => group.links)
    .filter((link) => utilityIds.has(link.id));

  if (!isMd) {
    const links = copy.footer.groups.flatMap((group) => group.links);
    const mobileLinks = ["blog", "support", "privacy", "terms", "delete-account"]
      .map((id) => links.find((link) => link.id === id))
      .filter((link): link is NonNullable<typeof link> => Boolean(link));

    return (
      <View role="contentinfo" style={[s.footer, s.footerCompact, { paddingHorizontal: pad }]}>
        <WebLink href="/" onPress={() => navigate("home")} accessibilityLabel="PocketCart">
          <View style={s.footerBrandRow}>
            <Image source={require("../../assets/web-logo.png")} style={s.footerCompactMark} />
            <Text style={s.footerCompactName}>PocketCart</Text>
          </View>
        </WebLink>
        <View style={s.footerCompactLinks}>
          {mobileLinks.map((link) => (
            <WebLink
              key={link.id}
              href={`/${LINK_ROUTES[link.id]}`}
              onPress={() => navigate(LINK_ROUTES[link.id]!)}
            >
              <View style={s.footerCompactLinkHit}>
                <Text style={s.footerCompactLink}>{link.label}</Text>
              </View>
            </WebLink>
          ))}
        </View>
        <Text style={s.footerCompactCopyright}>{copy.footer.copyright}</Text>
      </View>
    );
  }

  return (
    <View role="contentinfo" style={[s.footer, { paddingHorizontal: pad }]}>
      <View style={[s.footerInner, { maxWidth: 1200 }, isXl && s.footerInnerRow]}>
        {/* Brand column */}
        <View style={[s.footerBrand, isXl && s.footerCol]}>
          <WebLink href="/" onPress={() => navigate("home")}>
            <View style={s.footerBrandRow}>
              <Image source={require("../../assets/web-logo.png")} style={s.footerMark} />
              <Text style={s.footerBrandName}>PocketCart</Text>
            </View>
          </WebLink>
          <Text style={s.footerTagline}>{copy.footer.tagline}</Text>
        </View>

        {/* Link columns */}
        <View style={[s.footerLinkCols, isXl && s.footerCol, !isXl && s.footerLinkColsMobile]}>
          {linkGroups.map((g) => (
            <View key={g.title} style={s.footerLinkCol}>
              <Text style={s.footerLinkTitle}>{g.title}</Text>
              {g.links.map((link) =>
                LINK_ROUTES[link.id] ? (
                  <WebLink
                    key={link.id}
                    href={`/${LINK_ROUTES[link.id]}`}
                    onPress={() => navigate(LINK_ROUTES[link.id]!)}
                  >
                    <Text style={s.footerLink}>{link.label}</Text>
                  </WebLink>
                ) : (
                  <Text key={link.id} style={s.footerLinkMuted}>
                    {link.label}
                  </Text>
                ),
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Bottom row */}
      <View style={[s.footerBottom, { maxWidth: 1200 }]}>
        <View style={s.footerDivider} />
        <View style={s.footerMetaRow}>
          <Text style={s.footerCopy}>{copy.footer.copyright}</Text>

          <View style={s.footerUtilityRow}>
            {utilityLinks.map((link, idx) => (
              <React.Fragment key={link.id}>
                {idx > 0 ? <Text style={s.footerUtilitySep}>·</Text> : null}
                <WebLink
                  href={`/${LINK_ROUTES[link.id]}`}
                  onPress={() => navigate(LINK_ROUTES[link.id]!)}
                >
                  <Text style={s.footerUtilityLink}>{link.label}</Text>
                </WebLink>
              </React.Fragment>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
