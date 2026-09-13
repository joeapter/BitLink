import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../lib/theme";
import { useSession } from "../../lib/auth";
import { fetchAccount, formatPhone, statusLabel, type AccountSnapshot } from "../../lib/account";
import { findPlanBySlug } from "../../lib/plans";
import { SignInForm } from "../../components/SignInForm";
import { BrandHeader, useScreenTopPadding } from "../../components/BrandHeader";

export default function AccountTab() {
  const topPadding = useScreenTopPadding();
  const { session, loading: sessionLoading } = useSession();

  const [data, setData] = useState<AccountSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = session?.user?.id ?? null;

  const load = useCallback(async (mode: "initial" | "refresh") => {
    if (!userId) return;
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      setData(await fetchAccount(userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your account.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) load("initial");
    else setData(null);
  }, [userId, load]);

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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: topPadding }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load("refresh")} tintColor={colors.accent} />
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

      {data && data.hasCustomerRecord && data.lines.length === 0 && !loading ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No lines yet</Text>
          <Text style={styles.cardBody}>
            When you add a plan it shows up here with your number and activation details.
          </Text>
        </View>
      ) : null}

      {data?.lines.map((line) => {
        const plan = findPlanBySlug(line.metadata.plan_slug);
        const phone = formatPhone(line.metadata.phone_number);
        return (
          <View key={line.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.phone}>{phone ?? "Number pending"}</Text>
              <StatusPill status={line.status} />
            </View>

            <Text style={styles.planLine}>{plan?.name ?? line.metadata.plan_slug ?? "Plan"}</Text>

            {line.metadata.intl_number ? (
              <Row icon="globe-outline" label="Second number" value={line.metadata.intl_number} />
            ) : null}
            {line.metadata.is_trial ? <Row icon="time-outline" label="Trial line" value="Yes" /> : null}
            <Row
              icon={line.metadata.is_esim ? "cellular-outline" : "card-outline"}
              label="SIM"
              value={line.metadata.is_esim ? "eSIM" : "Physical SIM"}
            />
            {line.isKosher ? <Row icon="shield-checkmark-outline" label="Kosher line" value="Yes" /> : null}
          </View>
        );
      })}

      {data?.referralCode ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your referral code</Text>
          <Text style={styles.referral}>{data.referralCode}</Text>
          <Text style={styles.cardBody}>
            Friends who sign up with your code get bonus data, and so do you.
          </Text>
        </View>
      ) : null}
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
  value: string;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color={colors.muted} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
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
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
  cardBody: { marginTop: 6, fontSize: 14, lineHeight: 21, color: colors.muted },
  phone: { fontSize: 22, fontWeight: "700", color: colors.ink },
  planLine: { marginTop: 4, fontSize: 14, color: colors.muted },

  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: "700" },

  row: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  rowLabel: { fontSize: 13, color: colors.muted, flex: 1 },
  rowValue: { fontSize: 13, fontWeight: "600", color: colors.ink },

  referral: { marginTop: 8, fontSize: 22, fontWeight: "800", color: colors.accent, letterSpacing: 1 },

  errorCard: {
    backgroundColor: "#FDECEA",
    borderRadius: 18,
    padding: 16,
  },
  errorText: { color: "#C0392B", fontSize: 14, fontWeight: "600" },
  errorHint: { color: "#C0392B", fontSize: 13, marginTop: 4 },
});
