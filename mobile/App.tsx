import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { View } from "react-native";

import { queryClient } from "./src/app/query-client";
import { AppNavigation } from "./src/navigation";
import { colors } from "./src/theme/tokens";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppNavigation />
        <StatusBar style="dark" />
      </View>
    </QueryClientProvider>
  );
}
