import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  formatPhone,
  intlNumberLabel,
  statusLabel,
  type AccountSnapshot,
} from "../../lib/account";
import { findPlanBySlug } from "../../lib/plans";
import { SignInForm } from "../../components/SignInForm";
import { BrandHeader, useScreenTopPadding } from "../../components/BrandHeader";
import { UsageMeters } from "../../components/UsageMeters";
import { ReferralCard } from "../../components/ReferralCard";

export default function AccountTab() {
  const topPadding = useScreenTopPadding();
  const { session, loading: sessionLoading } = useSession();

  const [data, setData] = useState<AccountSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openLineId, setOpenLineId] = useState<string | null>(null);

  const userId = session?.user?.id ?? null;

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (!userId) return;
      if (mode === "initial") setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const snapshot = await fetchAccount(userId);
        setData(snapshot);
        // With a single line there is nothing to choose between, so its meters
        // are open from the start. With several, the customer picks which.
        if (snapshot.lines.length === 1) setOpenLineId(snapshot.lines[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load your account.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    if (userId) load("initial");
    else setData(null);
  }, [userId, load]);

  // Adding a line takes payment and collects eSIM/delivery details, so it runs
  // in the browser — Apple requires real-world service purchases to complete
  // outside the app, and the web flow stays the single source of truth for it.
  const addLine = useCallback(() => {
    const url = session ? `${SITE_URL}/account/add-line` : `${SITE_URL}/checkout`;
    WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url));
  }, [session]);

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
        <Text style={styles.title}>Your account</Text>
        <SignInForm intro="Sign in to see your lines, numbers and activation details." />
      </ScrollView>
    );
  }

  const lines = data?.lines ?? [];
  const multiple = lines.length > 1;

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
      <Text style={styles.title}>Your account</Text>
      {data?.fullName ? <Text style={styles.subtitle}>{data.fullName}</Text> : null}

      {loading && !data ? (
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

      {data && !data.hasCustomerRecord && !loading ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>We can&apos;t find your account yet</Text>
          <Text style={styles.cardBody}>
            If you already have a BitLink line, sign in once at bitlink.co.il to link it to this
            login — after that it will show up here. Message us on WhatsApp if it still doesn&apos;t.
          </Text>
        </View>
      ) : null}

      {data && data.hasCustomerRecord && lines.length === 0 && !loading ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No lines yet</Text>
          <Text style={styles.cardBody}>
            When you add a plan it shows up here with your number, your usage and your activation
            details.
          </Text>
        </View>
      ) : null}

      {lines.map((line) => {
        const plan = findPlanBySlug(line.metadata.plan_slug);
        const phone = formatPhone(line.metadata.phone_number);
        const open = openLineId === line.id;
        const canMeter = line.status === "active";

        return (
          <View key={line.id} style={styles.card}>
            <Pressable
              onPress={() => (multiple ? setOpenLineId(open ? null : line.id) : undefined)}
              disabled={!multiple}
              accessibilityRole={multiple ? "button" : undefined}
              accessibilityState={multiple ? { expanded: open } : undefined}
              accessibilityLabel={
                multiple ? `${phone ?? "Line"}, tap to ${open ? "hide" : "show"} usage` : undefined
              }
            >
              <View style={styles.cardHeader}>
                <Text style={styles.phone}>{phone ?? "Number pending"}</Text>
                <View style={styles.headerRight}>
                  <StatusPill status={line.status} />
                  {multiple ? (
                    <Ionicons
                      name={open ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={colors.inactive}
                    />
                  ) : null}
                </View>
              </View>
              <Text style={styles.planLine}>
                {plan?.name ?? line.metadata.plan_slug ?? "Plan"}
                {line.metadata.is_trial ? " · Trial" : ""}
              </Text>
            </Pressable>

            {open && canMeter ? <UsageMeters lineId={line.id} /> : null}
            {open && !canMeter ? (
              <Text style={styles.inactiveNote}>Usage shows here once the line is active.</Text>
            ) : null}

            {open ? (
              <View style={styles.detailRows}>
                {intlNumberLabel(line.metadata.intl_number) ? (
                  <Row
                    icon="globe-outline"
                    label="Second number"
                    value={intlNumberLabel(line.metadata.intl_number)!}
                  />
                ) : null}
                <Row
                  icon={line.metadata.is_esim ? "cellular-outline" : "card-outline"}
                  label="SIM"
                  value={line.metadata.is_esim ? "eSIM" : "Physical SIM"}
                />
                {line.isKosher ? (
                  <Row icon="shield-checkmark-outline" label="Kosher line" value="Yes" />
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}

      {data?.hasCustomerRecord ? (
        <Pressable
          onPress={addLine}
          style={({ pressed }) => [styles.addLine, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Add a line, opens in your browser"
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
          <Text style={styles.addLineText}>Add a line</Text>
          <Ionicons name="open-outline" size={15} color={colors.inactive} />
        </Pressable>
      ) : null}

      {data?.referralCode ? <ReferralCard code={data.referralCode} /> : null}
    </ScrollView>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "active"
      ? { bg: "#E6F7F0", fg: colors.green }
      : status === "failed"
        ? { bg: "#FDECEA", fg: "#C0392B" }
        : { bg: "#F1F3F5", fg: colors.muted };

  return (
    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
      <Text style={[styles.pillText, { color: tone.fg }]}>{statusLabel(status)}</Text>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: unknown;
}) {
  // Belt and braces after intl_number turned out to be an object: metadata is
  // free-form JSON written by several different code paths, so a value that
  // isn't a string must degrade to something readable rather than crash the
  // whole account screen.
  const text =
    typeof value === "string"
      ? value
      : typeof value === "number" || typeof value === "boolean"
        ? String(value)
        : null;
  if (!text) return null;

  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color={colors.muted} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{text}</Text>
    </View>
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
  cardBody: { marginTop: 6, fontSize: 14, lineHeight: 21, color: colors.muted },
  phone: { fontSize: 22, fontWeight: "700", color: colors.ink },
  planLine: { marginTop: 4, fontSize: 14, color: colors.muted },
  inactiveNote: { marginTop: 12, fontSize: 13, color: colors.muted },

  detailRows: { marginTop: 4 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: "700" },

  row: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  rowLabel: { fontSize: 13, color: colors.muted, flex: 1 },
  rowValue: { fontSize: 13, fontWeight: "600", color: colors.ink },

  addLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
  },
  addLineText: { fontSize: 15, fontWeight: "700", color: colors.ink },
  pressed: { opacity: 0.7 },

  errorCard: { backgroundColor: "#FDECEA", borderRadius: 18, padding: 16 },
  errorText: { color: "#C0392B", fontSize: 14, fontWeight: "600" },
  errorHint: { color: "#C0392B", fontSize: 13, marginTop: 4 },
});
