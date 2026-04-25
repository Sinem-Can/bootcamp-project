import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Button } from "../../components/ui/button";
import { colors, spacing } from "../../theme/tokens";
import type { RootStackParamList } from "../../navigation/types";
import { authStore } from "../../stores/auth.store";

type Props = NativeStackScreenProps<RootStackParamList, "MissingReport">;

const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function MissingProductReportScreen({ route, navigation }: Props) {
  const { barcode } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <View style={styles.root}>
        <View style={styles.card}>
          <Text style={styles.title}>Kamera izni gerekli</Text>
          <Text style={styles.sub}>Ürün fotoğrafını çekebilmek için kamera izni ver.</Text>
          <View style={{ marginTop: spacing[16] }}>
            <Button label="İzin Ver" onPress={() => requestPermission()} />
          </View>
        </View>
      </View>
    );
  }

  const submit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) throw new Error("Fotoğraf alınamadı.");

      const token = authStore.getState().accessToken;
      const form = new FormData();
      form.append("barcode_no", barcode);
      form.append("photo", {
        uri: photo.uri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);

      const res = await fetch(`${baseUrl}/product/missing`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });

      if (!res.ok) throw new Error("Gönderilemedi.");

      Alert.alert("Başarılı", "Bildirim alındı. Teşekkürler.", [
        { text: "Tamam", onPress: () => navigation.popToTop() },
      ]);
    } catch (e) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.cameraRoot}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      <View style={styles.overlay}>
        <View style={styles.bottom}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Eksik Ürün Bildir</Text>
            <Text style={styles.sub}>Barkod: {barcode}</Text>
            <View style={{ marginTop: spacing[12], gap: spacing[12] }}>
              <Button label={isSubmitting ? "Gönderiliyor..." : "Fotoğraf Çek & Gönder"} onPress={submit} disabled={isSubmitting} />
              <Button variant="surface" label="Vazgeç" onPress={() => navigation.goBack()} disabled={isSubmitting} />
            </View>
            {isSubmitting && (
              <View style={{ marginTop: spacing[12], flexDirection: "row", gap: spacing[12], alignItems: "center" }}>
                <ActivityIndicator />
                <Text style={{ color: colors.textSecondary }}>Arka planda işleniyor…</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, padding: spacing[16], justifyContent: "center" },
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
  cameraRoot: { flex: 1, backgroundColor: "#000" },
  overlay: { flex: 1, justifyContent: "flex-end" },
  bottom: { padding: spacing[16] },
  sheet: { backgroundColor: colors.surface, borderRadius: 24, padding: spacing[16] },
});

