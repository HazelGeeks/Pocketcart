import React from "react";
import { Text, View } from "react-native";
import { AppIcon } from "./icons/AppIcon";
import s from "../styles";

type PriceRow = {
  store: string;
  price: string;
  delta: string;
  best: boolean;
};

export function HeroProductPreview({
  header,
  searchPlaceholder,
  categoryLabel,
  productName,
  productMeta,
  liveLabel,
  rows,
  saving,
}: {
  header: string;
  searchPlaceholder: string;
  categoryLabel: string;
  productName: string;
  productMeta: string;
  liveLabel: string;
  rows: PriceRow[];
  saving: string;
}) {
  return (
    <View style={s.previewShell}>
      <View style={s.previewTopBar}>
        <View>
          <Text style={s.previewKicker}>POCKETCART</Text>
          <Text style={s.previewHeading}>{header}</Text>
        </View>
        <View style={s.previewAvatar}>
          <Text style={s.previewAvatarText}>PC</Text>
        </View>
      </View>

      <View style={s.previewSearch}>
        <AppIcon name="location" color="#476253" size={17} strokeWidth={2} />
        <Text style={s.previewSearchText}>{searchPlaceholder}</Text>
      </View>

      <View style={s.previewProductRow}>
        <View style={s.previewProductVisual}>
          <View style={s.previewProductGlyph}>
            <AppIcon name="basket" color="#C95832" size={30} strokeWidth={1.8} />
          </View>
        </View>
        <View style={s.previewProductCopy}>
          <Text style={s.previewProductMeta}>{categoryLabel}</Text>
          <Text style={s.previewProductName}>{productName}</Text>
          <Text style={s.previewProductUnit}>{productMeta}</Text>
        </View>
        <View style={s.previewLiveBadge}>
          <View style={s.previewLiveDot} />
          <Text style={s.previewLiveText}>{liveLabel}</Text>
        </View>
      </View>

      <View style={s.previewPriceList}>
        {rows.map((row) => (
          <View
            key={row.store}
            style={[s.previewPriceRow, row.best && s.previewPriceRowBest]}
          >
            <View style={s.previewStoreMark}>
              <Text style={s.previewStoreMarkText}>{row.store.slice(0, 1)}</Text>
            </View>
            <Text style={s.previewStoreName}>{row.store}</Text>
            <Text style={s.previewDelta}>{row.delta}</Text>
            <Text style={s.previewPrice}>{row.price}</Text>
          </View>
        ))}
      </View>

      <View style={s.previewSavingBar}>
        <View style={s.previewSavingIcon}>
          <AppIcon name="check" color="#071f12" size={16} strokeWidth={2.4} />
        </View>
        <Text style={s.previewSavingText}>{saving}</Text>
        <AppIcon name="chevron-right" color="#071f12" size={16} />
      </View>
    </View>
  );
}
