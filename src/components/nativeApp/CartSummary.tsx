import { StyleSheet, Text, View } from "react-native";
import { money } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";

type Props = {
  familyName: string | null;
  pendingCount: number;
  total: number | null;
  unpricedCount: number;
  loading: boolean;
  listLoading: boolean;
};

export function CartSummary(props: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.title}>
          <Text style={st.shoppingRefreshText} numberOfLines={1}>{props.familyName ? `${props.familyName} · Shared` : "My Cart"}</Text>
          <Text style={st.shoppingFootnote}>{props.listLoading ? "Loading…" : `${props.pendingCount} to buy`}</Text>
        </View>
        <View style={styles.estimate}>
          <Text style={styles.total}>{props.listLoading || props.loading ? "…" : props.pendingCount === 0 ? "All set" : props.total === null ? "—" : money.format(props.total)}</Text>
          <Text style={st.shoppingFootnote}>{props.loading ? "Updating…" : props.pendingCount === 0 ? "" : props.total === null ? "No estimate" : props.unpricedCount > 0 ? `Subtotal · ${props.unpricedCount} unpriced` : "Estimated"}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  summary: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { flex: 1, minWidth: 0, gap: 2 },
  estimate: { alignItems: "flex-end", flexShrink: 1 },
  total: { fontSize: 22, fontWeight: "700", color: C.text },
});
