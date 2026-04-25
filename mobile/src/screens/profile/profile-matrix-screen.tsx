import { useMutation } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { Button } from "../../components/ui/button";
import { updateProfile } from "../../features/profile/profile.api";
import { colors, radii, spacing } from "../../theme/tokens";

const ALLERGEN_OPTIONS = ["laktoz", "gluten", "fıstık", "yumurta"] as const;
const UNDESIRED_OPTIONS = ["palm yağı", "şeker", "glikoz şurubu"] as const;
const DIET_OPTIONS = ["vegan", "vejetaryen", "ketojenik"] as const;

function ToggleChip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, isActive ? styles.chipActive : styles.chipIdle]}
      accessibilityRole="button"
    >
      <Text style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextIdle]}>{label}</Text>
    </Pressable>
  );
}

export function ProfileMatrixScreen() {
  const navigation = useNavigation();
  const [allergens, setAllergens] = useState<string[]>([]);
  const [undesired, setUndesired] = useState<string[]>([]);
  const [diet, setDiet] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => updateProfile({ allergens, undesired, diet }),
    onSuccess: () =>
      Alert.alert("Kaydedildi", "Profil matrisi güncellendi.", [
        { text: "Devam", onPress: () => navigation.navigate("Home" as never) },
      ]),
    onError: () => Alert.alert("Hata", "Profil kaydedilemedi."),
  });

  const isSaving = mutation.isPending;
  const dietLabel = useMemo(() => (diet ? diet : "Seçilmedi"), [diet]);

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Alerjenler</Text>
        <View style={styles.chipRow}>
          {ALLERGEN_OPTIONS.map((a) => (
            <ToggleChip
              key={a}
              label={a}
              isActive={allergens.includes(a)}
              onPress={() =>
                setAllergens((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))
              }
            />
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: spacing[24] }]}>Diyet Tipi</Text>
        <Text style={styles.helper}>Seçili: {dietLabel}</Text>
        <View style={styles.chipRow}>
          {DIET_OPTIONS.map((d) => (
            <ToggleChip key={d} label={d} isActive={diet === d} onPress={() => setDiet((prev) => (prev === d ? null : d))} />
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: spacing[24] }]}>İstenmeyenler</Text>
        <View style={styles.chipRow}>
          {UNDESIRED_OPTIONS.map((u) => (
            <ToggleChip
              key={u}
              label={u}
              isActive={undesired.includes(u)}
              onPress={() =>
                setUndesired((prev) => (prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]))
              }
            />
          ))}
        </View>

        <View style={{ marginTop: spacing[24] }}>
          <Button label={isSaving ? "Kaydediliyor..." : "Kaydet"} onPress={() => mutation.mutate()} disabled={isSaving} />
        </View>
      </View>
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
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  helper: { marginTop: spacing[8], color: colors.textSecondary, fontSize: 13 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[12], marginTop: spacing[12] },
  chip: {
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    borderRadius: radii.card,
    borderWidth: 1,
  },
  chipIdle: { backgroundColor: colors.surface, borderColor: "rgba(15, 23, 42, 0.06)" },
  chipActive: { backgroundColor: "rgba(5, 150, 105, 0.10)", borderColor: "rgba(5, 150, 105, 0.35)" },
  chipText: { fontSize: 14, fontWeight: "600" },
  chipTextIdle: { color: colors.textPrimary },
  chipTextActive: { color: colors.primary },
});

