import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Linking, Platform, StyleSheet, View } from "react-native";
import { useIsFocused } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import WebView, { type WebViewNavigation } from "react-native-webview";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";

const APP_HOST = "bitlink.co.il";

function shouldOpenExternally(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "http:" && protocol !== "https:") return true; // tel:, mailto:, etc.
    // Anything leaving our own domain — Stripe Checkout, the Stripe billing
    // portal, future OAuth-style redirects — goes to the system browser so
    // payment never happens inside the app shell (Apple's external-purchase
    // requirement). sharedCookiesEnabled below means a login made in-app is
    // already there waiting on iOS (shared NSHTTPCookieStorage); Android's
    // Custom Tabs don't share the embedded WebView's cookie jar the same
    // way, so a signed-out landing there is expected on that platform.
    return hostname !== APP_HOST && !hostname.endsWith(`.${APP_HOST}`);
  } catch {
    return false;
  }
}

export function WebViewScreen({ url }: { url: string }) {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (Platform.OS !== "android" || !isFocused) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack, isFocused]);

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
    <View style={[styles.flex, { paddingBottom: insets.bottom, backgroundColor: "#ffffff" }]}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.flex}
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
    backgroundColor: "#ffffff",
  },
});
