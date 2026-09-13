import "react-native-get-random-values";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as aesjs from "aes-js";
import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";

// The anon key is public by design — it already ships in the website's JS
// bundle, and every table it can reach is gated by row level security (each
// customer sees only their own rows; verified against production). It is not
// a secret and is safe to embed here. A privileged key must never be.
const extra = Constants.expoConfig?.extra ?? {};
const supabaseUrl = extra.supabaseUrl as string | undefined;
const supabaseAnonKey = extra.supabaseAnonKey as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing supabaseUrl/supabaseAnonKey in app.json → expo.extra");
}

// Session tokens are the keys to a customer's account, so they don't sit in
// plain AsyncStorage. Each stored value is AES-encrypted with a per-key random
// secret held in the device keychain (expo-secure-store), and only the
// ciphertext goes to AsyncStorage — SecureStore alone caps out at 2048 bytes,
// which a Supabase session can exceed. This is Supabase's documented pattern
// for React Native.
class EncryptedSessionStore {
  private async encrypt(key: string, value: string) {
    const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));
    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  private async decrypt(key: string, value: string) {
    const encryptionKeyHex = await SecureStore.getItemAsync(key);
    if (!encryptionKeyHex) return null;
    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1),
    );
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }

  async getItem(key: string) {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;
    try {
      return await this.decrypt(key, encrypted);
    } catch {
      // A half-written or key-mismatched blob should log the customer out
      // cleanly rather than wedge the app on every launch.
      await this.removeItem(key);
      return null;
    }
  }

  async setItem(key: string, value: string) {
    const encrypted = await this.encrypt(key, value);
    await AsyncStorage.setItem(key, encrypted);
  }

  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new EncryptedSessionStore(),
    autoRefreshToken: true,
    persistSession: true,
    // No URL to read a session back from in a native app; leaving this on
    // makes supabase-js look for one that never arrives.
    detectSessionInUrl: false,
  },
});
