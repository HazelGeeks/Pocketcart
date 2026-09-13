import React from "react";
import { Pressable, Text, View } from "react-native";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import { calendarDays, shiftCalendarMonth } from "../../utils/calendarDays";

export function BestBeforePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState(() => value || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`);
  const choose = (date: string) => { onChange(date); setOpen(false); };
  return <View style={{ gap: 8 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Best-before date: ${value || "Not set"}`} onPress={() => { if (!open && value) setMonth(value); setOpen(!open); }} style={st.freezerInput}>
      <Text style={st.shoppingBodyText}>{value || "Choose date"}</Text>
    </Pressable>
    {open ? <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setMonth(shiftCalendarMonth(month, -1))} style={st.headerIconButton}><Text>‹</Text></Pressable>
        <Text style={st.shoppingSectionTitle}>{new Date(`${month.slice(0, 7)}-01T12:00:00`).toLocaleDateString("en-CA", { month: "long", year: "numeric" })}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => setMonth(shiftCalendarMonth(month, 1))} style={st.headerIconButton}><Text>›</Text></Pressable>
      </View>
      <View style={{ flexDirection: "row" }}>{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => <Text key={day} style={[st.shoppingFootnote, { width: "14.2857%", textAlign: "center" }]}>{day}</Text>)}</View>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {calendarDays(month).map((day, index) => day ? <Pressable key={day} accessibilityRole="button" accessibilityLabel={day} accessibilityState={{ selected: value === day }} onPress={() => choose(day)} style={{ width: "14.2857%", minHeight: 44, alignItems: "center", justifyContent: "center", backgroundColor: value === day ? C.primaryPale : C.white, borderRadius: 8 }}><Text style={st.shoppingBodyText}>{Number(day.slice(-2))}</Text></Pressable> : <View key={`blank-${index}`} style={{ width: "14.2857%" }} />)}
      </View>
      <Pressable accessibilityRole="button" onPress={() => choose("")} style={st.shoppingAddButton}><Text style={st.shoppingRefreshText}>No date</Text></Pressable>
    </View> : null}
  </View>;
}
