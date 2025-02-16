import { Stack } from "expo-router";
import {
  PaperProvider,
  MD3LightTheme,
  MD3DarkTheme,
  adaptNavigationTheme,
  Text,
} from "react-native-paper";
import {
  NavigationContainer,
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";
import merge from "deepmerge";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "expo-dev-client";

import { useColorScheme } from "@/hooks/useColorScheme";

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

// Custom theme that combines both Paper and Navigation themes
const CombinedDefaultTheme = merge(MD3LightTheme, LightTheme);
const CombinedDarkTheme = merge(MD3DarkTheme, DarkTheme);

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // const theme =
  //   colorScheme === "dark" ? CombinedDarkTheme : CombinedDefaultTheme;
  const theme = CombinedDefaultTheme;

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="add"
            options={{
              title: "Add Expense",
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: "Settings",
              presentation: "modal",
            }}
          />
        </Stack>
      </PaperProvider>
    </QueryClientProvider>
  );
}
