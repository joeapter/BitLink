import { useCallback } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { WebViewScreen } from "./components/WebViewScreen";

// The account portal is a server-rendered Next.js app, not a JSON API — the
// fastest, least redundant way to ship a native shell is to load each tab's
// page live rather than rebuild it as native UI. Site updates then reach the
// app instantly with no store resubmission. See app-mode CSS in the Next.js
// repo (src/app/layout.tsx / globals.css) for how the marketing header/
// footer get hidden so this doesn't read as "a website in a box."
const SITE = "https://www.bitlink.co.il";

SplashScreen.preventAutoHideAsync().catch(() => {});

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#0FC2C2",
    background: "#050606",
    card: "#0B0D0E",
    border: "#1C1F20",
  },
};

const ICONS: Record<string, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  Plans: { focused: "pricetags", unfocused: "pricetags-outline" },
  Account: { focused: "person-circle", unfocused: "person-circle-outline" },
  Settings: { focused: "settings", unfocused: "settings-outline" },
};

export default function App() {
  const handleReady = useCallback(() => {
    // Navigation is mounted and ready to paint — hand off from the native
    // splash to our own UI now instead of holding it open until the account
    // page's network round trip finishes. Each screen shows its own spinner
    // (WebViewScreen's renderLoading) for that wait, which is the normal,
    // fast-feeling pattern instead of a long native splash hold.
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={navTheme} onReady={handleReady}>
        <Tab.Navigator
          initialRouteName="Account"
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: "#0FC2C2",
            tabBarInactiveTintColor: "#7A8688",
            tabBarStyle: {
              backgroundColor: "#0B0D0E",
              borderTopColor: "#1C1F20",
              height: Platform.OS === "ios" ? 88 : 64,
              paddingTop: 8,
            },
            tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
            tabBarIcon: ({ focused, color, size }) => {
              const set = ICONS[route.name];
              return <Ionicons name={focused ? set.focused : set.unfocused} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Plans" options={{ title: "Plans" }}>
            {() => <WebViewScreen url={`${SITE}/account/add-line`} />}
          </Tab.Screen>
          <Tab.Screen name="Account" options={{ title: "Account" }}>
            {() => <WebViewScreen url={`${SITE}/account`} />}
          </Tab.Screen>
          <Tab.Screen name="Settings" options={{ title: "Settings" }}>
            {() => <WebViewScreen url={`${SITE}/account/settings`} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
