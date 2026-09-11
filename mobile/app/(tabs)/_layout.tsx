import { Platform } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const ICONS: Record<string, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  plans: { focused: "pricetags", unfocused: "pricetags-outline" },
  index: { focused: "person-circle", unfocused: "person-circle-outline" },
  settings: { focused: "settings", unfocused: "settings-outline" },
};

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
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
      <Tabs.Screen name="plans" options={{ title: "Plans" }} />
      <Tabs.Screen name="index" options={{ title: "Account" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
