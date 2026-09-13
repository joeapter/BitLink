import { NativeTabs } from "expo-router/unstable-native-tabs";
import { colors } from "../../lib/theme";

// A real UITabBar (and BottomNavigationView on Android) rather than a
// JS-drawn one. The press, the selection animation and the iOS 26 scroll
// minimise behaviour are all handled by the OS, so tab switching can never sit
// behind a busy JS thread — which is exactly where a React-drawn tab bar feels
// sluggish. Icons are SF Symbols on iOS and Material icons on Android, so each
// platform gets its own native iconography instead of one set forced on both.
//
// Tab order follows the order of these triggers. `index` is the initial route
// by expo-router convention, which puts Account in the middle and open by
// default.
export default function TabsLayout() {
  return (
    <NativeTabs tintColor={colors.accent}>
      <NativeTabs.Trigger name="plans">
        <NativeTabs.Trigger.Icon sf={{ default: "tag", selected: "tag.fill" }} md="local_offer" />
        <NativeTabs.Trigger.Label>Plans</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="topups">
        <NativeTabs.Trigger.Icon
          sf={{ default: "bolt", selected: "bolt.fill" }}
          md="bolt"
        />
        <NativeTabs.Trigger.Label>Top-ups</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }}
          md="account_circle"
        />
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          md="settings"
        />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
