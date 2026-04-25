import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Button } from "../../components/ui/button";
import { successHaptic } from "../../lib/haptics";
import { colors, spacing } from "../../theme/tokens";
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Scanner">;

export function ScannerScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualVisible, setManualVisible] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const scannedRef = useRef(false);

  useEffect(() => {
    scannedRef.current = false;
    setManualVisible(false);
    setManualCode("");

    const timer = setTimeout(() => setManualVisible(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={styles.root}>
        <View style={styles.card}>
          <Text style={styles.title}>Kamera izni gerekli</Text>
          <Text style={styles.sub}>Barkod taraması için kamera izni vermen gerekiyor.</Text>
          <View style={{ marginTop: spacing[16] }}>
            <Button label="İzin Ver" onPress={() => requestPermission()} />
          </View>
        </View>
      </View>
    );
  }

  const goWithBarcode = async (barcode: string) => {
    if (!barcode) return;
    if (scannedRef.current) return;
    scannedRef.current = true;
    await successHaptic();
    navigation.replace("ProductResult", { barcode });
  };

  return (
    <View style={styles.cameraRoot}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"] }}
        onBarcodeScanned={(event) => goWithBarcode(event.data)}
      />
      <View style={styles.overlay}>
        <View style={styles.frame} />
        <View style={styles.bottom}>
          {manualVisible ? (
            <View style={styles.manualCard}>
              <Text style={styles.manualTitle}>Manuel Barkod</Text>
              <TextInput
                value={manualCode}
                onChangeText={setManualCode}
                placeholder="Barkod numarası"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                style={styles.manualInput}
              />
              <View style={{ flexDirection: "row", gap: spacing[12] }}>
                <View style={{ flex: 1 }}>
                  <Button label="Devam" onPress={() => goWithBarcode(manualCode.trim())} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    variant="surface"
                    label="İptal"
                    onPress={() => {
                      Alert.alert("İptal", "Tarama iptal edildi.", [{ text: "Tamam", onPress: () => navigation.goBack() }]);
                    }}
                  />
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.hint}>Barkodu çerçeveye hizala…</Text>
          )}
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
  overlay: { flex: 1, justifyContent: "space-between", padding: spacing[16] },
  frame: {
    alignSelf: "center",
    marginTop: 120,
    width: "80%",
    height: 220,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(248, 250, 252, 0.65)",
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  bottom: { alignItems: "center" },
  hint: { color: "rgba(248, 250, 252, 0.9)", fontSize: 14, fontWeight: "600" },
  manualCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing[16],
    gap: spacing[12],
  },
  manualTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  manualInput: {
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[16],
    color: colors.textPrimary,
  },
});

