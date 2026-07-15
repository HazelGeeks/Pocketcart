import React from "react";
import {
  Image,
  Linking,
  Text,
  View,
} from "react-native";
import type { Route } from "../constants/palette";
import useLayout from "../hooks/useLayout";
import s from "../styles";
import {
  FacebookIcon,
  InstagramIcon,
  XIcon,
} from "./icons/SocialIcons";
import { useSiteI18n } from "../i18n/siteI18n";
import WebLink from "./WebLink";
import EmailSignupForm from "./EmailSignupForm";

export default function FooterSection({
  navigate,
}: {
  navigate: (r: Route) => void;
}) {
  const { isXl, pad } = useLayout();
  const { copy } = useSiteI18n();

  const LINK_ROUTES: Record<string, Route | null> = {
    blog: "blog",
    privacy: "privacy",
    terms: "terms",
    support: "support",
    "delete-account": "delete-account",
  };

  const linkGroups = copy.footer.groups;
  const socialLinks = [
    {
      key: "instagram",
      label: "Instagram",
      url: "https://instagram.com",
      Icon: InstagramIcon,
    },
    {
      key: "facebook",
      label: "Facebook",
      url: "https://facebook.com",
      Icon: FacebookIcon,
    },
    {
      key: "x",
      label: "X",
      url: "https://x.com",
      Icon: XIcon,
    },
  ];

  return (
    <View
      role="contentinfo"
      style={[s.footer, { paddingHorizontal: pad }]}
    >
      <View
        style={[
          s.footerInner,
          { maxWidth: 1200 },
          isXl && s.footerInnerRow,
        ]}
      >
        {/* Brand column */}
        <View style={[s.footerBrand, isXl && s.footerCol]}>
          <WebLink href="/" onPress={() => navigate("home")}>
            <View style={s.footerBrandRow}>
              <Image
                source={require("../../assets/web-logo.png")}
                style={s.footerMark}
              />
              <Text style={s.footerBrandName}>PocketCart</Text>
            </View>
          </WebLink>
          <Text style={s.footerTagline}>{copy.footer.tagline}</Text>
        </View>

        {/* Email signup */}
        <View
          style={[
            s.footerSignup,
            isXl && s.footerCol,
            isXl && s.footerSignupDesktop,
          ]}
        >
          <EmailSignupForm
            title={copy.footer.signupTitle}
            subtitle={copy.footer.signupSub}
            emailPlaceholder={copy.footer.emailPlaceholder}
            submitLabel={copy.footer.notify}
            successLabel={copy.footer.signupDone}
            tone="dark"
            compact
            stackOnDesktop={!isXl}
          />
        </View>

        {/* Link columns */}
        <View
          style={[
            s.footerLinkCols,
            isXl && s.footerCol,
            !isXl && s.footerLinkColsMobile,
          ]}
        >
          {linkGroups.map((g) => (
            <View key={g.title} style={s.footerLinkCol}>
              <Text style={s.footerLinkTitle}>{g.title}</Text>
              {g.links.map((link) => (
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
                )
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Bottom row */}
      <View style={[s.footerBottom, { maxWidth: 1200 }]}>
        <View style={s.footerDivider} />
        <View style={s.footerMetaRow}>
          <Text style={s.footerCopy}>{copy.footer.copyright}</Text>

          <View style={s.footerSocialRow}>
            {socialLinks.map((item, idx) => (
              <React.Fragment key={item.key}>
                {idx > 0 ? (
                  <Text style={s.footerSocialSep}>|</Text>
                ) : null}
                <WebLink
                  href={item.url}
                  accessibilityLabel={item.label}
                  onPress={() => Linking.openURL(item.url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <View style={s.footerSocialLink}>
                    <item.Icon
                      size={16}
                      color="rgba(255,255,255,0.75)"
                    />
                  </View>
                </WebLink>
              </React.Fragment>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
