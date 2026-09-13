import { Image, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Space between the safe area and the brand mark. Exported so every screen
 * uses the identical top offset — when each screen set its own, two of them
 * drifted ~60pt lower than the others and the tabs visibly jumped when you
 * switched between them.
 */
export const SCREEN_TOP_GAP = 12;

/**
 * Returns the top padding a tab screen should use. Screens differ in shape —
 * Plans pins a segmented control above a scrolling list, the others scroll as
 * one — so they cannot share a single container, but they must share this
 * number or the brand mark moves between tabs.
 */
export function useScreenTopPadding() {
  return useSafeAreaInsets().top + SCREEN_TOP_GAP;
}

// The same wordmark the website renders (public/assets/logo-v2.png), copied in
// so the app and the site are visibly one brand.
//
// Deliberately not a navigation bar: no background, no border, no back button.
// A chrome bar on all four tabs would eat vertical space on every screen and
// reads as dated on iOS in 2026, where tab roots use large titles instead.
// This is a brand mark sitting above the screen's own title — present on every
// tab so the app always identifies itself, without becoming furniture.
export function BrandHeader() {
  return (
    <View style={styles.row}>
      <Image
        source={require("../assets/logo-wordmark.png")}
        style={styles.logo}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="BitLink"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    // The wordmark is 3:1, so height drives the size.
    height: 26,
    width: 78,
  },
});
