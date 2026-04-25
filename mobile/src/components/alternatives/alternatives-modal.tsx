import { useQuery } from "@tanstack/react-query";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { getAlternatives } from "../../features/product/product.api";
import { colors, spacing } from "../../theme/tokens";

type Props = {
  visible: boolean;
  barcode: string;
  onClose: () => void;
};

export function AlternativesModal({ visible, barcode, onClose }: Props) {
  const query = useQuery({
    queryKey: ["alternatives", barcode],
    queryFn: () => getAlternatives(barcode),
    enabled: visible,
    retry: false,
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>Alternatifler</Text>
        {query.isLoading ? (
          <Text style={styles.text}>Yükleniyor…</Text>
        ) : query.isError ? (
          <Text style={styles.text}>Kriterlere uygun ürün bulunamadı</Text>
        ) : (
          <View style={{ gap: spacing[12] }}>
            {(query.data ?? []).map((p) => (
              <View key={p.barkod} style={styles.item}>
                <Text style={styles.itemTitle}>{p.ad}</Text>
                <Text style={styles.itemSub}>
                  {p.kategori} • Fiyat seg: {p.fiyat_segmenti}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.35)" },
  sheet: {
    backgroundColor: colors.surface,
    padding: spacing[24],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: spacing[16],
  },
  title: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  text: { color: colors.textSecondary },
  item: { backgroundColor: colors.background, padding: spacing[16], borderRadius: 16 },
  itemTitle: { fontWeight: "700", color: colors.textPrimary },
  itemSub: { marginTop: spacing[8], color: colors.textSecondary, fontSize: 13 },
});

