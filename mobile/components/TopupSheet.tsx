import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { colors, SITE_URL } from "../lib/theme";
import { cardLabel, fetchPaymentCard, type CardSummary } from "../lib/usage";
import type { NativeTopUp } from "../lib/topups";

/**
 * Purchase confirmation for a top-up.
 *
 * A sheet rather than a system alert because this spends the customer's money:
 * it names the bundle, the price, the line it lands on, and — the part an
 * alert cannot show — the card that will actually be charged. The card comes
 * from /api/app/payment-method, which resolves it the same way the charge does
 * (the customer's default invoice payment method), so the sheet can never name
 * a different card than the one billed.
 */
export function TopupSheet({
  visible,
  topup,
  linePhone,
  lineId,
  busy,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  topup: NativeTopUp | null;
  linePhone: string | null;
  lineId: string | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [card, setCard] = useState<CardSummary | null>(null);
  const [cardLoading, setCardLoading] = useState(false);

  useEffect(() => {
    if (!visible || !lineId) return;
    let active = true;
    setCardLoading(true);
    setCard(null);
    fetchPaymentCard(lineId)
      .then((result) => {
        if (active) setCard(result.card);
      })
      .catch(() => {
        // A card we can't read isn't a reason to block the purchase — it may
        // still go through — so the sheet just shows nothing here.
        if (active) setCard(null);
      })
      .finally(() => {
        if (active) setCardLoading(false);
      });
    return () => {
      active = false;
    };
  }, [visible, lineId]);

  const openBilling = () => {
    const url = `${SITE_URL}/account/billing`;
    WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url));
  };

  return (
    <Modal
      visible={visible && topup !== null}
      transparent
      animationType="slide"
      onRequestClose={busy ? undefined : onCancel}
    >
      <Pressable style={styles.backdrop} onPress={busy ? undefined : onCancel} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.grabber} />

        <Text style={styles.heading}>Confirm top-up</Text>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{topup?.name}</Text>
            <Text style={styles.summaryPrice}>{topup?.price}</Text>
          </View>
          <Text style={styles.summaryDesc}>{topup?.description}</Text>
        </View>

        <View style={styles.detailList}>
          <DetailRow icon="call-outline" label="Added to" value={linePhone ?? "Your line"} />
          {cardLoading ? (
            <DetailRow icon="card-outline" label="Paying with" value="Checking…" />
          ) : card ? (
            <DetailRow icon="card-outline" label="Paying with" value={cardLabel(card)} />
          ) : (
            <Pressable onPress={openBilling} style={styles.warnRow} accessibilityRole="button">
              <Ionicons name="alert-circle-outline" size={18} color="#C0392B" />
              <Text style={styles.warnText}>
                No card on file — tap to add one before buying.
              </Text>
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={onConfirm}
          disabled={busy}
          style={({ pressed }) => [styles.confirm, (pressed || busy) && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Confirm, pay ${topup?.price}`}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmText}>Pay {topup?.price}</Text>
          )}
        </Pressable>

        <Pressable onPress={busy ? undefined : onCancel} disabled={busy} accessibilityRole="button">
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>

        <Text style={styles.footnote}>
          Charged to your card on file. Valid 30 days. Live within minutes.
        </Text>
      </View>
    </Modal>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={colors.muted} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(5,6,6,0.35)" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
    gap: 14,
  },
  grabber: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(5,6,6,0.15)",
    marginBottom: 6,
  },
  heading: { fontSize: 20, fontWeight: "800", color: colors.ink },

  summary: {
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: 16,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  summaryLabel: { fontSize: 17, fontWeight: "700", color: colors.ink },
  summaryPrice: { fontSize: 20, fontWeight: "800", color: colors.ink },
  summaryDesc: { marginTop: 4, fontSize: 13, color: colors.muted },

  detailList: { gap: 2 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  detailLabel: { flex: 1, fontSize: 14, color: colors.muted },
  detailValue: { fontSize: 14, fontWeight: "600", color: colors.ink },

  warnRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 },
  warnText: { flex: 1, fontSize: 13, color: "#C0392B", fontWeight: "600" },

  confirm: {
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
  },
  pressed: { opacity: 0.85 },
  confirmText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  cancel: { textAlign: "center", fontSize: 15, fontWeight: "600", color: colors.muted, paddingVertical: 6 },
  footnote: { textAlign: "center", fontSize: 12, color: colors.inactive, lineHeight: 17 },
});
