import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Button } from "../../components/ui/button";
import { AlternativesModal } from "../../components/alternatives/alternatives-modal";
import { getProductScore } from "../../features/product/product.api";
import { colors, spacing } from "../../theme/tokens";
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ProductResult">;

function statusColor(status: "RED" | "YELLOW" | "GREEN") {
  if (status === "GREEN") return colors.primary;
  if (status === "YELLOW") return colors.warning;
  return colors.danger;
}

export function ProductResultScreen({ route, navigation }: Props) {
  const { barcode } = route.params;
  const [altsVisible, setAltsVisible] = useState(false);

  const query = useQuery({
    queryKey: ["productScore", barcode],
    queryFn: () => getProductScore(barcode),
    retry: false,
  });

  const status = query.data?.status;
  const why = useMemo(() => {
    if (!query.data) return [];
    if (query.data.status === "RED") return query.data.matched_allergens.map((x) => `Alerjen eşleşmesi: ${x}`);
    if (query.data.status === "YELLOW") return query.data.matched_undesired.map((x) => `İstenmeyen madde: ${x}`);
    return ["Profiline göre kısıt bulunmadı."];
  }, [query.data]);

  if (query.isError) {
    return (
      <View style={styles.root}>
        <View style={styles.card}>
          <Text style={styles.title}>Ürün bulunamadı</Text>
          <Text style={styles.sub}>Bu barkod katalogda yok. Fotoğrafla bildirmek ister misin?</Text>
          <View style={{ marginTop: spacing[16], gap: spacing[12] }}>
            <Button label="Eksik Ürün Bildir" onPress={() => navigation.replace("MissingReport", { barcode })} />
            <Button variant="surface" label="Geri" onPress={() => navigation.popToTop()} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>Barkod: {barcode}</Text>
        {query.isLoading ? (
          <Text style={styles.sub}>Analiz ediliyor…</Text>
        ) : (
          <>
            <View style={[styles.pill, { backgroundColor: `${statusColor(status!)}1A` }]}>
              <Text style={[styles.pillText, { color: statusColor(status!) }]}>{status}</Text>
            </View>
            <Text style={[styles.sectionTitle, { marginTop: spacing[16] }]}>Neden bu skor?</Text>
            <View style={{ gap: spacing[8] }}>
              {why.map((line) => (
                <Text key={line} style={styles.reason}>
                  {line}
                </Text>
              ))}
            </View>
            <View style={{ marginTop: spacing[24], gap: spacing[12] }}>
              <Button label="Alternatifleri Gör" onPress={() => setAltsVisible(true)} />
              <Button
                variant="surface"
                label="Yeni Tarama"
                onPress={() => {
                  setAltsVisible(false);
                  navigation.replace("Scanner");
                }}
              />
            </View>
          </>
        )}
      </View>

      <AlternativesModal visible={altsVisible} barcode={barcode} onClose={() => setAltsVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, padding: spacing[16] },
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
  title: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  sub: { marginTop: spacing[8], color: colors.textSecondary, lineHeight: 20 },
  pill: {
    marginTop: spacing[16],
    alignSelf: "flex-start",
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[12],
    borderRadius: 999,
  },
  pillText: { fontWeight: "800" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  reason: { color: colors.textSecondary, lineHeight: 20 },
});

