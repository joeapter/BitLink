import { Platform } from "react-native";
// Importing Tabs from the package root is deprecated in SDK 57; the navigator
// now lives at expo-router/js-tabs.
import { Tabs } from "expo-router/js-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../lib/theme";

const ICONS: Record<
  string,
  { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }
> = {
  plans: { focused: "pricetags", unfocused: "pricetags-outline" },
  index: { focused: "person-circle", unfocused: "person-circle-outline" },
  settings: { focused: "settings", unfocused: "settings-outline" },
};

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={({ route }) => ({
        // Every screen draws its own title inside its scroll view, so there is
        // no navigation header anywhere in the app.
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarIcon: ({ focused, color, size }) => {
          const set = ICONS[route.name];
          if (!set) return null;
          return <Ionicons name={focused ? set.focused : set.unfocused} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="plans" options={{ title: "Plans" }} />
      <Tabs.Screen name="index" options={{ title: "Account" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
