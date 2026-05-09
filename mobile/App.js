import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TOKENS = {
  primary: "#059669",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  danger: "#EF4444",
  warning: "#F59E0B",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
};

const RECENT_SCANS = [
  { id: "1", name: "Tam Yağlı Süt", score: 86 },
  { id: "2", name: "Fıstık Ezmesi", score: 62 },
  { id: "3", name: "Çikolata", score: 28 },
  { id: "4", name: "Yulaf Bar", score: 74 },
];

const TABS = [
  { id: "home", label: "Ana Sayfa", icon: "home-outline" },
  { id: "profile", label: "Profil", icon: "person-outline" },
  { id: "settings", label: "Ayarlar", icon: "settings-outline" },
];

function getScoreVariant(score) {
  if (score >= 75) return "good";
  if (score >= 45) return "warning";
  return "danger";
}

function getVariantColors(variant) {
  if (variant === "good") {
    return {
      text: TOKENS.primary,
      tint: "rgba(5, 150, 105, 0.10)",
    };
  }
  if (variant === "warning") {
    return {
      text: TOKENS.warning,
      tint: "rgba(245, 158, 11, 0.10)",
    };
  }
  return {
    text: TOKENS.danger,
    tint: "rgba(239, 68, 68, 0.10)",
  };
}

function VariantChip({ variant, children }) {
  const c = getVariantColors(variant);
  return (
    <View style={[styles.chip, { backgroundColor: c.tint }]}>
      <Text style={[styles.chipText, { color: c.text }]}>{children}</Text>
    </View>
  );
}

export default function App() {
  const scans = useMemo(
    () =>
      RECENT_SCANS.map((s) => ({
        ...s,
        variant: getScoreVariant(s.score),
      })),
    []
  );

  const [activeTab, setActiveTab] = useState("home");
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("loading"); // loading | result
  const timerRef = useRef(null);

  useEffect(() => {
    if (!analysisOpen) return;
    setAnalysisStep("loading");
    timerRef.current = setTimeout(() => setAnalysisStep("result"), 2000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [analysisOpen]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Hoş geldin, Sinem</Text>
            <Text style={styles.subtitle}>
              Bugün sağlığın için ne taramak istersin?
            </Text>
          </View>

          <View style={styles.ctaWrap}>
            <TouchableOpacity
              activeOpacity={0.9}
              accessibilityRole="button"
              style={styles.ctaButton}
              onPress={() => setAnalysisOpen(true)}
            >
              <View style={styles.ctaInner}>
                <View style={styles.ctaIcon}>
                  <Ionicons
                    name="barcode-outline"
                    size={20}
                    color={TOKENS.surface}
                  />
                </View>
                <Text style={styles.ctaText}>Yeni Ürün Tara</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Geçmiş Taramalar</Text>
            <Text style={styles.sectionHint}>Son taradıkların</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {scans.map((item) => {
              const c = getVariantColors(item.variant);
              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.thumb}>
                      <Ionicons
                        name="fast-food-outline"
                        size={18}
                        color={TOKENS.textSecondary}
                      />
                    </View>
                    <View style={[styles.scorePill, { backgroundColor: c.tint }]}>
                      <Text style={[styles.scorePillText, { color: c.text }]}>
                        {item.score}/100
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardMeta}>Mini sağlık skoru</Text>
                </View>
              );
            })}
          </ScrollView>
        </ScrollView>

        <View style={styles.tabBar}>
          {TABS.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                accessibilityRole="button"
                activeOpacity={0.85}
                style={styles.tabItem}
                onPress={() => setActiveTab(t.id)}
              >
                <Ionicons
                  name={t.icon}
                  size={22}
                  color={isActive ? TOKENS.primary : TOKENS.textSecondary}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? TOKENS.primary : TOKENS.textSecondary },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Modal
        visible={analysisOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAnalysisOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {analysisStep === "loading" ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator size="large" color={TOKENS.primary} />
                <Text style={styles.modalTitle}>Analiz Ediliyor...</Text>
                <Text style={styles.modalSub}>
                  İçerikler sağlık profilinle karşılaştırılıyor
                </Text>
              </View>
            ) : (
              <View style={styles.resultBlock}>
                <View style={styles.resultHeader}>
                  <View style={styles.resultThumb}>
                    <Ionicons
                      name="nutrition-outline"
                      size={20}
                      color={TOKENS.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>Popkek</Text>
                    <Text style={styles.modalSub}>Örnek sağlık analizi</Text>
                  </View>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => setAnalysisOpen(false)}
                    activeOpacity={0.8}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={18} color={TOKENS.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Riskli İçerikler</Text>
                  <View style={styles.chipsRow}>
                    <VariantChip variant="danger">Palmiye Yağı</VariantChip>
                    <VariantChip variant="warning">Yüksek Şeker</VariantChip>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Temiz İçerikler</Text>
                  <View style={styles.chipsRow}>
                    <VariantChip variant="good">Doğal Aroma</VariantChip>
                  </View>
                </View>

                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.9}
                  style={styles.primaryInlineButton}
                  onPress={() => setAnalysisOpen(false)}
                >
                  <Text style={styles.primaryInlineButtonText}>Kapat</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: TOKENS.background,
  },
  screen: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 110,
  },
  header: {
    gap: 8,
  },
  title: {
    color: TOKENS.textPrimary,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  subtitle: {
    color: TOKENS.textSecondary,
    fontSize: 15,
    lineHeight: 21,
  },
  ctaWrap: {
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: "center",
  },
  ctaButton: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: TOKENS.primary,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0, 0, 0, 0.04)",
        shadowOpacity: 1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 5,
      },
    }),
  },
  ctaInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ctaIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: TOKENS.surface,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  sectionHeader: {
    gap: 4,
    paddingBottom: 12,
  },
  sectionTitle: {
    color: TOKENS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  sectionHint: {
    color: TOKENS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  horizontalList: {
    paddingRight: 24,
    gap: 12,
  },
  card: {
    width: 230,
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0, 0, 0, 0.04)",
        shadowOpacity: 1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(5, 150, 105, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: TOKENS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  scorePill: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  scorePillText: {
    fontSize: 13,
    fontWeight: "700",
  },
  cardMeta: {
    color: TOKENS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    paddingTop: 6,
  },

  tabBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 14,
    backgroundColor: TOKENS.surface,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0, 0, 0, 0.04)",
        shadowOpacity: 1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    padding: 16,
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: TOKENS.surface,
    borderRadius: 24,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0, 0, 0, 0.04)",
        shadowOpacity: 1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 8,
      },
    }),
  },
  loadingBlock: {
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  resultBlock: {
    gap: 16,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resultThumb: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(5, 150, 105, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(100, 116, 139, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    color: TOKENS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  modalSub: {
    color: TOKENS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  modalSection: {
    gap: 10,
  },
  modalSectionTitle: {
    color: TOKENS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  primaryInlineButton: {
    marginTop: 2,
    width: "100%",
    borderRadius: 16,
    backgroundColor: TOKENS.primary,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0, 0, 0, 0.04)",
        shadowOpacity: 1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primaryInlineButtonText: {
    color: TOKENS.surface,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});  

