import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../lib/supabase";
import { colors, SITE_URL } from "../lib/theme";

export function SignInForm({ intro }: { intro: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    Keyboard.dismiss();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError("Enter your email and password.");
      return;
    }

    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    });
    setBusy(false);

    if (signInError) {
      // Supabase returns "Invalid login credentials" for both a wrong password
      // and an unknown email, which is the correct behaviour (no account
      // enumeration) — just say it in plainer words.
      setError(
        signInError.message === "Invalid login credentials"
          ? "That email and password don't match an account."
          : signInError.message,
      );
      return;
    }
    // On success the auth listener in SessionProvider swaps this screen out.
  };

  const openForgotPassword = () => {
    const url = `${SITE_URL}/forgot-password`;
    WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url));
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.intro}>{intro}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.inactive}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="username"
        editable={!busy}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.inactive}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        textContentType="password"
        editable={!busy}
        onSubmitEditing={signIn}
        returnKeyType="go"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        onPress={signIn}
        disabled={busy}
        style={({ pressed }) => [styles.button, (pressed || busy) && styles.buttonPressed]}
        accessibilityRole="button"
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Sign in</Text>
        )}
      </Pressable>

      <Pressable onPress={openForgotPassword} accessibilityRole="button">
        <Text style={styles.link}>Forgot your password?</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  intro: { fontSize: 15, lineHeight: 22, color: colors.muted, marginBottom: 4 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.ink,
  },
  error: { color: "#C0392B", fontSize: 13, lineHeight: 19 },
  button: {
    backgroundColor: colors.ink,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  link: { textAlign: "center", color: colors.accent, fontSize: 14, fontWeight: "600", paddingVertical: 8 },
});
