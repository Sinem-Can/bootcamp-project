import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect } from "react";

import { LoginRegisterScreen } from "../screens/auth/login-register-screen";
import { HomeScreen } from "../screens/home/home-screen";
import { MissingProductReportScreen } from "../screens/missing/missing-product-report-screen";
import { ProfileMatrixScreen } from "../screens/profile/profile-matrix-screen";
import { ProductResultScreen } from "../screens/product/product-result-screen";
import { ScannerScreen } from "../screens/scanner/scanner-screen";
import { useAuthStore } from "../stores/auth.store";
import { colors } from "../theme/tokens";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigation() {
  const { accessToken, hydrate, isHydrated, initialRoute } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!isHydrated) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={accessToken ? initialRoute : "Auth"}
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {!accessToken ? (
          <Stack.Screen name="Auth" component={LoginRegisterScreen} options={{ title: "Giriş / Kayıt" }} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: "TemizSepet" }} />
            <Stack.Screen name="ProfileMatrix" component={ProfileMatrixScreen} options={{ title: "Profil Matrisi" }} />
            <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: "Tarama" }} />
            <Stack.Screen name="ProductResult" component={ProductResultScreen} options={{ title: "Sonuç" }} />
            <Stack.Screen name="MissingReport" component={MissingProductReportScreen} options={{ title: "Eksik Ürün" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

