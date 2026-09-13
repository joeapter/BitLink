import { useCallback, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { colors, SITE_URL } from "../lib/theme";

/**
 * Invite card.
 *
 * Shows a link rather than a bare code: /signup?referral=<code> is what the
 * website generates and the signup form pre-fills its referral field from that
 * parameter, so a friend who taps it never has to type or even see the code.
 *
 * Sharing goes through the OS share sheet rather than a WhatsApp-specific
 * button — the sheet already offers WhatsApp first for most people here, plus
 * SMS, email and anything else they use, and it needs no extra permissions or
 * deep-link handling per app.
 */
export function ReferralCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${SITE_URL}/signup?referral=${encodeURIComponent(code)}`;

  const share = useCallback(async () => {
    try {
      await Share.share({
        // iOS uses `url` for the rich preview and `message` for the text; both
        // are set so the link survives wherever it lands.
        message: `Get an Israeli phone plan with BitLink — we both get bonus data when you sign up with my link: ${link}`,
        url: link,
      });
    } catch {
      // The customer dismissed the sheet, or no target was available. Nothing
      // to report: there is a Copy link button right next to this.
    }
  }, [link]);

  const copy = useCallback(async () => {
    await Clipboard.setStringAsync(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [link]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Invite a friend</Text>
      <Text style={styles.body}>
        They get bonus data when they sign up with your link, and so do you.
      </Text>

      <Pressable
        onPress={copy}
        style={({ pressed }) => [styles.linkBox, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Copy your invite link, ${link}`}
      >
        <Text style={styles.link} numberOfLines={1} ellipsizeMode="middle">
          {link.replace(/^https?:\/\//, "")}
        </Text>
        <Ionicons
          name={copied ? "checkmark-circle" : "copy-outline"}
          size={18}
          color={copied ? colors.green : colors.muted}
        />
      </Pressable>

      <Pressable
        onPress={share}
        style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <Ionicons name="share-outline" size={18} color="#FFFFFF" />
        <Text style={styles.shareText}>Share invite</Text>
      </Pressable>

      {copied ? <Text style={styles.copied}>Link copied</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  title: { fontSize: 16, fontWeight: "700", color: colors.ink },
  body: { marginTop: 6, fontSize: 14, lineHeight: 21, color: colors.muted },

  linkBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  link: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.ink },
  pressed: { opacity: 0.7 },

  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    backgroundColor: colors.ink,
    borderRadius: 14,
    paddingVertical: 15,
  },
  shareText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  copied: { marginTop: 8, textAlign: "center", fontSize: 12, color: colors.green, fontWeight: "600" },
});
