import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { colors, SITE_URL } from "../../lib/theme";
import { useSession } from "../../lib/auth";
import {
  fetchAccount,
  fetchActiveGrants,
  formatPhone,
  type AccountLine,
  type ActiveGrant,
} from "../../lib/account";
import { buyTopup, findTopup, topupsForLine, type NativeTopUp } from "../../lib/topups";
import { SignInForm } from "../../components/SignInForm";
import { BrandHeader, useScreenTopPadding } from "../../components/BrandHeader";

export default function TopupsTab() {
  const topPadding = useScreenTopPadding();
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user?.id ?? null;

  const [lines, setLines] = useState<AccountLine[]>([]);
  const [grants, setGrants] = useState<ActiveGrant[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (!userId) return;
      if (mode === "initial") setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const account = await fetchAccount(userId);
        // Only active lines can take a top-up — grantTopup rejects anything
        // else, so offering one on a paused or ended line would be a button
        // that always fails.
        const active = account.lines.filter((line) => line.status === "active");
        setLines(active);
        setGrants(await fetchActiveGrants(active.map((line) => line.id)));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load your top-ups.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    if (userId) load("initial");
    else {
      setLines([]);
      setGrants([]);
    }
  }, [userId, load]);

  // Real money, one tap away — so it always asks first, and `pendingId` keeps
  // a double tap from becoming a double charge (the purchase itself is not
  // idempotent: each call writes a new grant and bills the card).
  const buy = useCallback(
    (line: AccountLine, topup: NativeTopUp) => {
      if (pendingId) return;
      Alert.alert(
        `Buy ${topup.name}?`,
        `${topup.price} will be charged to your card on file and added to ${
          formatPhone(line.metadata.phone_number) ?? "your line"
        }.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: `Buy ${topup.price}`,
            onPress: async () => {
              setPendingId(topup.id);
              try {
                const message = await buyTopup(line.id, topup.id);
                Alert.alert("Top-up added", message);
                await load("refresh");
              } catch (e) {
                // The usual cause is no usable card on file — the charge is an
                // immediate Stripe invoice against the saved payment method —
                // so offer the way to fix it rather than just reporting it.
                Alert.alert(
                  "Top-up failed",
                  e instanceof Error ? e.message : "Please try again, or message us on WhatsApp.",
                  [
                    { text: "OK", style: "cancel" },
                    {
                      text: "Check payment method",
                      onPress: () => {
                        const url = `${SITE_URL}/account/billing`;
                        WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url));
                      },
                    },
                  ],
                );
              } finally {
                setPendingId(null);
              }
            },
          },
        ],
      );
    },
    [pendingId, load],
  );

  if (sessionLoading) {
    return (
      <View style={[styles.screen, styles.centre]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!session) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: topPadding }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <BrandHeader />
      <Text style={styles.title}>Top-ups</Text>
        <SignInForm intro="Sign in to add data or minutes to your line." />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: topPadding }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load("refresh")}
          tintColor={colors.accent}
        />
      }
    >
      <BrandHeader />
      <Text style={styles.title}>Top-ups</Text>
      <Text style={styles.subtitle}>Add data or minutes. Valid 30 days.</Text>

      {loading && lines.length === 0 ? (
        <View style={styles.centrePad}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>Pull down to try again.</Text>
        </View>
      ) : null}

      {!loading && !error && lines.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No active line</Text>
          <Text style={styles.cardBody}>
            Top-ups attach to an active BitLink line. Once your line is running you can add data or
            minutes here any time.
          </Text>
        </View>
      ) : null}

      {lines.map((line) => {
        const options = topupsForLine(line.isKosher);
        const lineGrants = grants.filter((g) => g.lineId === line.id);
        return (
          <View key={line.id} style={styles.lineBlock}>
            <Text style={styles.lineHeading}>
              {formatPhone(line.metadata.phone_number) ?? "Your line"}
            </Text>

            {lineGrants.length > 0 ? (
              <View style={styles.activeWrap}>
                {lineGrants.map((grant) => {
                  const topup = findTopup(grant.topupId);
                  return (
                    <View key={grant.id} style={styles.activeChip}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.green} />
                      <Text style={styles.activeChipText}>
                        {topup?.name ?? grant.topupId}
                        {grant.frequency === "monthly" ? " · monthly" : ""}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {options.map((topup) => (
              <Pressable
                key={topup.id}
                onPress={() => buy(line, topup)}
                disabled={pendingId !== null}
                style={({ pressed }) => [
                  styles.topupRow,
                  (pressed || pendingId !== null) && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Buy ${topup.name} for ${topup.price}`}
              >
                <View style={styles.topupText}>
                  <View style={styles.topupNameRow}>
                    <Text style={styles.topupName}>{topup.name}</Text>
                    {topup.badge ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{topup.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.topupDesc}>{topup.description}</Text>
                </View>
                <View style={styles.priceBlock}>
                  {pendingId === topup.id ? (
                    <ActivityIndicator color={colors.accent} />
                  ) : (
                    <>
                      <Text style={styles.topupPrice}>{topup.price}</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.inactive} />
                    </>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        );
      })}

      {lines.length > 0 ? (
        <Text style={styles.footnote}>
          Top-ups are charged to your card on file and are live within minutes.
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 120, gap: 14 },
  centre: { alignItems: "center", justifyContent: "center" },
  centrePad: { paddingVertical: 40, alignItems: "center" },
  title: { fontSize: 30, fontWeight: "800", color: colors.ink },
  subtitle: { fontSize: 15, color: colors.muted, marginTop: -8 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
  cardBody: { marginTop: 6, fontSize: 14, lineHeight: 21, color: colors.muted },

  lineBlock: { gap: 8 },
  lineHeading: { fontSize: 15, fontWeight: "700", color: colors.ink, marginTop: 4 },

  activeWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 2 },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#E6F7F0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  activeChipText: { fontSize: 12, fontWeight: "600", color: colors.green },

  topupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pressed: { opacity: 0.7 },
  topupText: { flex: 1 },
  topupNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  topupName: { fontSize: 16, fontWeight: "700", color: colors.ink },
  topupDesc: { marginTop: 2, fontSize: 13, color: colors.muted },
  badge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: { fontSize: 10, fontWeight: "700", color: colors.accent },
  priceBlock: { flexDirection: "row", alignItems: "center", gap: 2 },
  topupPrice: { fontSize: 16, fontWeight: "700", color: colors.ink },

  footnote: { fontSize: 12, lineHeight: 18, color: colors.muted, textAlign: "center", marginTop: 4 },

  errorCard: { backgroundColor: "#FDECEA", borderRadius: 18, padding: 16 },
  errorText: { color: "#C0392B", fontSize: 14, fontWeight: "600" },
  errorHint: { color: "#C0392B", fontSize: 13, marginTop: 4 },
});
