import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/auth";
import { colors, contact } from "../../lib/theme";
import { SignInForm } from "../../components/SignInForm";
import { BrandHeader, useScreenTopPadding } from "../../components/BrandHeader";

export default function SettingsTab() {
  const topPadding = useScreenTopPadding();
  const { session, loading } = useSession();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const email = session?.user?.email ?? null;

  useEffect(() => {
    if (!session) {
      setProfileName(null);
      return;
    }
    let active = true;
    supabase
      .from("customers")
      .select("full_name")
      // Scoped explicitly: an admin session can read every customer row, so
      // without this the query returns many rows and maybeSingle() errors.
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setProfileName((data?.full_name as string | null) ?? null);
      });
    return () => {
      active = false;
    };
  }, [session]);

  // wa.me through Linking rather than an in-app browser: on a phone with
  // WhatsApp installed this opens the app directly via its universal link.
  // No prefilled text — the customer says what they want to say.
  const openWhatsApp = useCallback(() => {
    Linking.openURL(`https://wa.me/${contact.whatsappNumber}`).catch(() => {
      Alert.alert("WhatsApp unavailable", `Message us at ${contact.whatsappDisplay}.`);
    });
  }, []);

  const sendPasswordReset = useCallback(async () => {
    if (!email) return;
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setBusy(false);
    Alert.alert(
      error ? "Couldn't send the email" : "Check your inbox",
      error ? error.message : `We've sent a password reset link to ${email}.`,
    );
  }, [email]);

  const confirmSignOut = useCallback(() => {
    Alert.alert("Sign out?", "You'll need to sign in again to see your account.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          supabase.auth.signOut();
        },
      },
    ]);
  }, []);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: topPadding }]}
      keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
    >
      <BrandHeader />
      <Text style={styles.title}>Settings</Text>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : session ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profile</Text>
            <View style={styles.kvRow}>
              <Text style={styles.kvLabel}>Name</Text>
              <Text style={styles.kvValue}>{profileName ?? "—"}</Text>
            </View>
            <View style={[styles.kvRow, styles.kvRowLast]}>
              <Text style={styles.kvLabel}>Email</Text>
              <Text style={styles.kvValue}>{email ?? "—"}</Text>
            </View>
            <Text style={styles.note}>
              To change your name or email, message us — we&apos;ll sort it out.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Password</Text>
            <Text style={styles.cardBody}>We&apos;ll email you a link to set a new one.</Text>
            <Pressable
              onPress={sendPasswordReset}
              disabled={busy}
              style={({ pressed }) => [styles.secondaryButton, (pressed || busy) && styles.pressed]}
              accessibilityRole="button"
            >
              {busy ? (
                <ActivityIndicator color={colors.ink} />
              ) : (
                <Text style={styles.secondaryButtonText}>Send password reset email</Text>
              )}
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in</Text>
          <View style={{ marginTop: 12 }}>
            <SignInForm intro="Sign in to manage your profile and password." />
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact us</Text>
        <Text style={styles.cardBody}>Real people. No chatbot maze.</Text>

        <ContactRow
          icon="logo-whatsapp"
          iconColor="#25D366"
          label="WhatsApp"
          value={contact.whatsappDisplay}
          onPress={openWhatsApp}
        />
        <ContactRow
          icon="call-outline"
          label="Call from Israel"
          value={contact.israelDisplay}
          onPress={() => Linking.openURL(`tel:${contact.israelTel}`)}
        />
        <ContactRow
          icon="call-outline"
          label="Call from the USA"
          value={contact.usaDisplay}
          onPress={() => Linking.openURL(`tel:${contact.usaTel}`)}
        />
        <ContactRow
          icon="mail-outline"
          label="Email"
          value={contact.email}
          onPress={() => Linking.openURL(`mailto:${contact.email}`)}
          last
        />
      </View>

      {session ? (
        <Pressable
          onPress={confirmSignOut}
          style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      ) : null}

      <View style={styles.business}>
        {contact.businessLines.map((line) => (
          <Text key={line} style={styles.businessText}>
            {line}
          </Text>
        ))}
        <Text style={styles.versionText}>
          BitLink v{Constants.expoConfig?.version ?? "1.0.0"}
        </Text>
      </View>
    </ScrollView>
  );
}

function ContactRow({
  icon,
  iconColor,
  label,
  value,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.contactRow, last && styles.kvRowLast, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
    >
      <Ionicons name={icon} size={20} color={iconColor ?? colors.accent} />
      <View style={styles.contactText}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactValue}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.inactive} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 120, gap: 14 },
  title: { fontSize: 30, fontWeight: "800", color: colors.ink },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
  cardBody: { marginTop: 6, fontSize: 14, lineHeight: 21, color: colors.muted },

  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  kvRowLast: { borderBottomWidth: 0 },
  kvLabel: { fontSize: 14, color: colors.muted },
  kvValue: { fontSize: 14, fontWeight: "600", color: colors.ink, flexShrink: 1, textAlign: "right" },
  note: { marginTop: 10, fontSize: 12, lineHeight: 18, color: colors.muted },

  secondaryButton: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: { fontSize: 15, fontWeight: "600", color: colors.ink },
  pressed: { opacity: 0.7 },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contactText: { flex: 1 },
  contactLabel: { fontSize: 14, fontWeight: "600", color: colors.ink },
  contactValue: { fontSize: 13, color: colors.muted, marginTop: 1 },

  signOut: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    alignItems: "center",
  },
  signOutText: { fontSize: 15, fontWeight: "700", color: "#C0392B" },

  business: { marginTop: 8, gap: 3, alignItems: "center" },
  businessText: { fontSize: 11, color: colors.inactive, textAlign: "center" },
  versionText: { marginTop: 6, fontSize: 11, color: colors.inactive },
});
