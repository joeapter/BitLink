import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Linking, Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as WebBrowser from "expo-web-browser";
import WebView, { type WebViewNavigation } from "react-native-webview";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";

// The account portal is a server-rendered Next.js app, not a JSON API — the
// fastest, least redundant way to ship a native shell is to load it live
// rather than rebuild it as a native UI. Site updates then reach the app
// instantly with no store resubmission. See app-mode CSS in the Next.js repo
// (src/app/layout.tsx / globals.css) for how the marketing header/footer get
// hidden so this doesn't read as "a website in a box."
const ACCOUNT_URL = "https://www.bitlink.co.il/account";
const APP_HOST = "bitlink.co.il";

SplashScreen.preventAutoHideAsync().catch(() => {});

function shouldOpenExternally(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "http:" && protocol !== "https:") return true; // tel:, mailto:, etc.
    // Anything leaving our own domain — Stripe Checkout, the Stripe billing
    // portal, future OAuth-style redirects — goes to the system browser so
    // payment never happens inside the app shell (Apple's external-purchase
    // requirement) and so the customer keeps their real browser's autofill.
    return hostname !== APP_HOST && !hostname.endsWith(`.${APP_HOST}`);
  } catch {
    return false;
  }
}

function Portal() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const handleShouldStartLoad = useCallback((request: ShouldStartLoadRequest) => {
    if (shouldOpenExternally(request.url)) {
      WebBrowser.openBrowserAsync(request.url).catch(() => Linking.openURL(request.url));
      return false;
    }
    return true;
  }, []);

  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  }, []);

  return (
    <View style={[styles.flex, { paddingTop: insets.top, backgroundColor: "#050606" }]}>
      <WebView
        ref={webViewRef}
        source={{ uri: ACCOUNT_URL }}
        style={styles.flex}
        onLoadEnd={() => SplashScreen.hideAsync().catch(() => {})}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        pullToRefreshEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        decelerationRate="normal"
        allowsBackForwardNavigationGestures
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#0FC2C2" />
          </View>
        )}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Portal />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050606",
  },
});
