import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Button } from "../../components/ui/button";
import { useAuthStore } from "../../stores/auth.store";
import { colors, spacing } from "../../theme/tokens";
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const logout = useAuthStore((s) => s.logout);

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>Hazır mısın?</Text>
        <Text style={styles.sub}>Barkod tarayıp ürün analizini anında gör.</Text>
        <View style={{ gap: spacing[12], marginTop: spacing[16] }}>
          <Button label="TARAMA YAP" onPress={() => navigation.navigate("Scanner")} />
          <Button variant="surface" label="Profil Matrisi" onPress={() => navigation.navigate("ProfileMatrix")} />
          <Button variant="surface" label="Çıkış Yap" onPress={() => logout()} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: spacing[16],
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing[24],
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  sub: { marginTop: spacing[8], color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
});

