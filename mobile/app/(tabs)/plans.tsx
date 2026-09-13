import { useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { colors, SITE_URL } from "../../lib/theme";
import { fiveGPlans, kosherPlans, type NativePlan } from "../../lib/plans";

type Segment = "5g" | "kosher";

export default function PlansTab() {
  const insets = useSafeAreaInsets();
  const [segment, setSegment] = useState<Segment>("5g");
  const [selected, setSelected] = useState<NativePlan | null>(null);

  const plans = segment === "5g" ? fiveGPlans : kosherPlans;

  // Signing up takes money, so it happens in the system browser rather than
  // inside the app — Apple requires real-world service purchases to complete
  // outside the app, and it keeps card entry in the browser's trusted UI.
  const openSignup = (plan: NativePlan) => {
    const url = `${SITE_URL}/account/add-line?plan=${plan.slug}`;
    WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url));
  };

  if (selected) {
    return (
      <PlanDetail plan={selected} onBack={() => setSelected(null)} onAdd={() => openSignup(selected)} />
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.segmentRow}>
        <SegmentButton label="5G Plans" active={segment === "5g"} onPress={() => setSegment("5g")} />
        <SegmentButton label="Kosher" active={segment === "kosher"} onPress={() => setSegment("kosher")} />
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {plans.map((plan) => (
          <Pressable
            key={plan.slug}
            onPress={() => setSelected(plan)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            accessibilityRole="button"
            accessibilityLabel={`${plan.name}, ${plan.price} per month`}
          >
            <View style={styles.cardTop}>
              <View style={styles.cardTitleBlock}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planTagline}>{plan.tagline}</Text>
              </View>
              {plan.badge ? (
                <View style={[styles.badge, plan.featured && styles.badgeFeatured]}>
                  <Text style={[styles.badgeText, plan.featured && styles.badgeTextFeatured]}>
                    {plan.badge}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.price}>{plan.price}</Text>
              <Text style={styles.priceUnit}>/month</Text>
            </View>

            <View style={styles.specRow}>
              <Spec label="Data" value={plan.specs.data} />
              <Spec label="Calls" value={plan.specs.calls} />
              <Spec label="Texts" value={plan.specs.texts} />
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>View plan</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.accent} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function PlanDetail({
  plan,
  onBack,
  onAdd,
}: {
  plan: NativePlan;
  onBack: () => void;
  onAdd: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
        <Pressable onPress={onBack} style={styles.backRow} accessibilityRole="button">
          <Ionicons name="chevron-back" size={20} color={colors.accent} />
          <Text style={styles.backText}>Back to plans</Text>
        </Pressable>

        <Text style={styles.detailName}>{plan.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.detailPrice}>{plan.price}</Text>
          <Text style={styles.priceUnit}>/month</Text>
        </View>
        <Text style={styles.detailBody}>{plan.detail}</Text>

        <View style={styles.detailSpecs}>
          <DetailSpec label="Data" value={plan.specs.data} />
          <DetailSpec label="Calls" value={plan.specs.calls} />
          <DetailSpec label="Texts" value={plan.specs.texts} />
          <DetailSpec label="Activation" value={plan.specs.activation} last />
        </View>

        <Text style={styles.sectionHeading}>What&apos;s included</Text>
        {plan.features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.green} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: 12 }]}>
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Add this plan</Text>
          <Ionicons name="open-outline" size={16} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.actionNote}>Opens in your browser to complete signup</Text>
      </View>
    </View>
  );
}

function SegmentButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segment, active && styles.segmentActive]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.spec}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

function DetailSpec({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.detailSpecRow, last && styles.detailSpecRowLast]}>
      <Text style={styles.detailSpecLabel}>{label}</Text>
      <Text style={styles.detailSpecValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  segmentRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  segmentText: { fontSize: 14, fontWeight: "600", color: colors.muted },
  segmentTextActive: { color: "#FFFFFF" },

  listContent: { padding: 20, paddingTop: 12, gap: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: { opacity: 0.7 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  cardTitleBlock: { flex: 1 },
  planName: { fontSize: 20, fontWeight: "700", color: colors.ink },
  planTagline: { marginTop: 2, fontSize: 13, color: colors.muted },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
    alignSelf: "flex-start",
  },
  badgeFeatured: { backgroundColor: colors.accent },
  badgeText: { fontSize: 11, fontWeight: "700", color: colors.accent },
  badgeTextFeatured: { color: "#FFFFFF" },

  priceRow: { flexDirection: "row", alignItems: "baseline", marginTop: 14 },
  price: { fontSize: 30, fontWeight: "800", color: colors.ink },
  priceUnit: { marginLeft: 4, fontSize: 14, color: colors.muted },

  specRow: { flexDirection: "row", marginTop: 16, gap: 10 },
  spec: { flex: 1 },
  specLabel: { fontSize: 11, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  specValue: { marginTop: 3, fontSize: 13, fontWeight: "600", color: colors.ink },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cardFooterText: { fontSize: 14, fontWeight: "600", color: colors.accent },

  detailContent: { padding: 20, paddingBottom: 24 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 16 },
  backText: { fontSize: 15, fontWeight: "600", color: colors.accent },
  detailName: { fontSize: 30, fontWeight: "800", color: colors.ink },
  detailPrice: { fontSize: 34, fontWeight: "800", color: colors.ink },
  detailBody: { marginTop: 12, fontSize: 15, lineHeight: 23, color: colors.muted },

  detailSpecs: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  detailSpecRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailSpecRowLast: { borderBottomWidth: 0 },
  detailSpecLabel: { fontSize: 14, color: colors.muted },
  detailSpecValue: { fontSize: 14, fontWeight: "600", color: colors.ink, flexShrink: 1, textAlign: "right" },

  sectionHeading: { marginTop: 26, marginBottom: 10, fontSize: 16, fontWeight: "700", color: colors.ink },
  featureRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", paddingVertical: 6 },
  featureText: { flex: 1, fontSize: 14, lineHeight: 21, color: colors.ink },

  actionBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  primaryButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.ink,
    paddingVertical: 16,
    borderRadius: 16,
  },
  primaryButtonPressed: { opacity: 0.85 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  actionNote: { marginTop: 8, textAlign: "center", fontSize: 12, color: colors.muted },
});
