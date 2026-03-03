import React from "react";
import { Platform, Pressable } from "react-native";

type Props = {
  href: string;
  onPress?: () => void;
  children: React.ReactNode;
  accessibilityLabel?: string;
  target?: "_self" | "_blank";
  rel?: string;
};

export default function WebLink({
  href,
  onPress,
  children,
  accessibilityLabel,
  target = "_self",
  rel,
}: Props) {
  if (Platform.OS === "web") {
    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (!onPress) return;
      event.preventDefault();
      onPress();
    };

    return (
      <a
        href={href}
        onClick={handleClick}
        aria-label={accessibilityLabel}
        target={target}
        rel={rel}
        style={{
          color: "inherit",
          textDecoration: "none",
          display: "inline-flex",
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <Pressable onPress={onPress} accessibilityLabel={accessibilityLabel}>
      {children}
    </Pressable>
  );
}
