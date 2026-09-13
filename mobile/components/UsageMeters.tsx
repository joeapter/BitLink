import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "../lib/theme";
import {
  fetchUsage,
  formatAmount,
  meterLabel,
  type Meter,
  type UsageResult,
} from "../lib/usage";

/**
 * Usage bars for one line. `refreshKey` is bumped by the parent after a top-up
 * so the meter re-reads and the customer actually sees the data they just
 * bought appear — buying data and watching nothing change is the whole reason
 * a top-up feels untrustworthy.
 */
export function UsageMeters({ lineId, refreshKey = 0 }: { lineId: string; refreshKey?: number }) {
  const [usage, setUsage] = useState<UsageResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setUsage(await fetchUsage(lineId));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [lineId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (loading) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (failed) {
    return <Text style={styles.stateText}>Usage is unavailable right now.</Text>;
  }

  const meters = usage?.meters ?? [];
  if (meters.length === 0) {
    return (
      <Text style={styles.stateText}>
        No usage to show yet. It appears once the line has been used.
      </Text>
    );
  }

  return (
    <View style={styles.wrap}>
      {meters.map((meter) => (
        <MeterBar key={meter.id} meter={meter} />
      ))}
    </View>
  );
}

function MeterBar({ meter }: { meter: Meter }) {
  // Guard against a zero allowance so an unlimited or unmetered bucket can't
  // divide by zero and render a NaN-width bar.
  const pctUsed = meter.total > 0 ? Math.min(100, Math.round((meter.used / meter.total) * 100)) : 0;
  const tone = pctUsed > 90 ? "#C0392B" : pctUsed > 70 ? "#D98C00" : colors.green;

  return (
    <View style={styles.meter}>
      <View style={styles.meterTop}>
        <Text style={styles.meterLabel}>{meterLabel(meter.kind)}</Text>
        <Text style={styles.meterRemaining}>
          {formatAmount(meter.kind, meter.remaining)} left
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pctUsed}%`, backgroundColor: tone }]} />
      </View>
      <Text style={styles.meterFoot}>
        {formatAmount(meter.kind, meter.used)} used of {formatAmount(meter.kind, meter.total)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14, marginTop: 14 },
  state: { paddingVertical: 16, alignItems: "flex-start" },
  stateText: { marginTop: 12, fontSize: 13, color: colors.muted, lineHeight: 19 },

  meter: { gap: 6 },
  meterTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  meterLabel: { fontSize: 13, fontWeight: "700", color: colors.ink },
  meterRemaining: { fontSize: 13, fontWeight: "600", color: colors.muted },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(5,6,6,0.08)",
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 999 },
  meterFoot: { fontSize: 11, color: colors.muted },
});
