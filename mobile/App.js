import React, { useMemo } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

export default function DashboardScreen() {
  const scans = useMemo(
    () =>
      RECENT_SCANS.map((s) => ({
        ...s,
        variant: getScoreVariant(s.score),
      })),
    []
  );

  return (
    <SafeAreaView style={styles.safe}>
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
            onPress={() => {}}
          >
            <Text style={styles.ctaText}>Yeni Ürün Tara</Text>
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
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.cardFooter}>
                  <View style={[styles.scorePill, { backgroundColor: c.tint }]}>
                    <Text style={[styles.scorePillText, { color: c.text }]}>
                      {item.score}/100
                    </Text>
                  </View>
                  <Text style={styles.cardMeta}>Skor</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: TOKENS.background,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
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
        elevation: 3,
      },
    }),
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
    width: 190,
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
        elevation: 2,
      },
    }),
  },
  cardTitle: {
    color: TOKENS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  cardFooter: {
    paddingTop: 14,
    gap: 8,
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
    fontSize: 12,
    lineHeight: 16,
  },
});

