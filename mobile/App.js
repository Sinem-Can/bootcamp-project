import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";

const TOKENS = {
  primary: "#059669",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  danger: "#EF4444",
  warning: "#F59E0B",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
};

const TAB_ITEMS = [
  { id: "home", label: "Home", icon: "home-outline" },
  { id: "history", label: "History", icon: "time-outline" },
  { id: "profile", label: "Profile", icon: "person-outline" },
];

const INITIAL_HISTORY = [
  { id: "h1", name: "Tam Yağlı Süt", score: 86, date: "Bugün" },
  { id: "h2", name: "Fıstık Ezmesi", score: 62, date: "Dün" },
  { id: "h3", name: "Çikolata", score: 28, date: "2 gün önce" },
  { id: "h4", name: "Yulaf Bar", score: 74, date: "Geçen hafta" },
];

const SCREEN_H = Dimensions.get("window").height;
const BOTTOM_SHEET_HEIGHT = Math.round(SCREEN_H * 0.8);

const DISCOVER_CATEGORIES = [
  { id: "snack", label: "Atıştırmalık", icon: "nutrition-outline" },
  { id: "drink", label: "İçecek", icon: "water-outline" },
  { id: "breakfast", label: "Kahvaltılık", icon: "cafe-outline" },
  { id: "dairy", label: "Süt Ürünleri", icon: "flask-outline" },
  { id: "bakery", label: "Fırın", icon: "pizza-outline" },
  { id: "frozen", label: "Donuk", icon: "snow-outline" },
];

function getHealthierAlternative(product) {
  const raw = (product?.name ?? "").toLowerCase();
  const rules = [
    {
      keys: ["cips", "chip", "kraker"],
      title: "Fırınlanmış Nohut Atıştırmalığı",
      reason:
        "Aynı ‘tuzlu atıştırma’ ihtiyacında daha yüksek lif, daha az trans/hidrojene yağ riski.",
    },
    {
      keys: ["kola", "gazoz", "asitli", "enerji içecek"],
      title: "Doğal Maden Suyu veya Maden + Limon",
      reason:
        "Ek şeker ve asit yükü olmadan serinletir; aynı fiyat bandında rafta sık bulunur.",
    },
    {
      keys: ["çikolata", "gofret", "bar", "şekerleme"],
      title: "%70+ Kakao Bitter veya Hurma",
      reason:
        "Şeker yoğunluğunu düşürür; daha kısa içerik listesiyle kontrol kolaylaşır.",
    },
    {
      keys: ["süt", "yoğurt", "kefir"],
      title: "Yağ Oranı Düşük veya Laktozsuz Günlük Süt",
      reason:
        "Aynı kategoride daha dengeli yağ; laktoz hassasiyetinde laktozsuz seçenek.",
    },
    {
      keys: ["meyve", "nektar", "smoothie"],
      title: "Katkısız %100 Meyve Suyu (Sınırlı Porsiyon)",
      reason:
        "Meyve nektarı yerine posalı/posasız ama ek şekersiz etiketli ürün tercih edin.",
    },
    {
      keys: ["ekmek", "beyaz", "sandviç"],
      title: "Tam Tahıllı veya Çavdarlı Ekmek",
      reason:
        "Glisemik yükü daha yumuşatır; lif ve doygunluk açısından daha verimli.",
    },
  ];
  for (const r of rules) {
    if (r.keys.some((k) => raw.includes(k))) {
      return { title: r.title, reason: r.reason };
    }
  }
  return {
    title: "Tam Tahıllı Kraker veya Kuruyemiş Karışımı",
    reason:
      "Benzer raflarda daha kısa içerik listesi ve daha düşük işlenmiş yağ profili arayın.",
  };
}

function getScoreVariant(score) {
  if (score >= 75) return "good";
  if (score >= 45) return "warning";
  return "danger";
}

function getVariantColors(variant) {
  if (variant === "good") {
    return { text: TOKENS.primary, tint: "rgba(5, 150, 105, 0.10)" };
  }
  if (variant === "warning") {
    return { text: TOKENS.warning, tint: "rgba(245, 158, 11, 0.10)" };
  }
  return { text: TOKENS.danger, tint: "rgba(239, 68, 68, 0.10)" };
}

function VariantChip({ variant, children, icon }) {
  const c = getVariantColors(variant);
  return (
    <View style={[styles.chip, { backgroundColor: c.tint }]}>
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={c.text}
          style={{ marginRight: 6 }}
        />
      ) : null}
      <Text style={[styles.chipText, { color: c.text }]}>{children}</Text>
    </View>
  );
}

function PremiumCard({ children, style }) {
  return <View style={[styles.cardBase, style]}>{children}</View>;
}

function PrimaryButton({ label, icon, onPress, style }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      accessibilityRole="button"
      style={[styles.primaryButton, style]}
      onPress={onPress}
    >
      <View style={styles.primaryButtonInner}>
        {icon ? (
          <View style={styles.primaryButtonIcon}>
            <Ionicons name={icon} size={20} color={TOKENS.surface} />
          </View>
        ) : null}
        <Text style={styles.primaryButtonText}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const canLogin = email.trim().length > 2 && password.trim().length > 2;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.authContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.authHeader}>
            <Text style={styles.authTitle}>TemizSepet</Text>
            <Text style={styles.authSubtitle}>
              Premium analiz deneyimi için giriş yap
            </Text>
          </View>

          <PremiumCard style={{ padding: 18, borderRadius: 24 }}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={TOKENS.textSecondary}
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="ornek@domain.com"
                placeholderTextColor={TOKENS.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Şifre</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={TOKENS.textSecondary}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={TOKENS.textSecondary}
                secureTextEntry
                style={styles.input}
              />
            </View>

            <PrimaryButton
              label="Giriş Yap"
              icon="log-in-outline"
              style={{ marginTop: 18, opacity: canLogin ? 1 : 0.6 }}
              onPress={() => {
                if (!canLogin) return;
                onLogin({ email });
              }}
            />
          </PremiumCard>

          <Text style={styles.authFootnote}>
            Dev mod: Backend bağlı değil, giriş local state ile simüle edilir.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CameraScanModal({ visible, onClose, onSimulateScan }) {
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!visible) return;
    if (!permission || permission.status !== "granted") {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safe, { backgroundColor: "#000000" }]}>
        <View style={styles.cameraTopBar}>
          <Text style={styles.cameraTitle}>Tarama</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onClose}
            activeOpacity={0.85}
            style={styles.cameraClose}
          >
            <Ionicons name="close" size={18} color={TOKENS.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.cameraStage}>
          {permission?.status === "granted" ? (
            <CameraView style={styles.camera} facing="back" />
          ) : (
            <View style={styles.cameraPermission}>
              <Text style={styles.cameraPermissionTitle}>
                Kamera izni gerekli
              </Text>
              <Text style={styles.cameraPermissionSub}>
                Ürün barkodlarını taramak için kameraya erişim ver.
              </Text>
              <PrimaryButton
                label="İzin Ver"
                icon="camera-outline"
                onPress={requestPermission}
                style={{ marginTop: 16 }}
              />
            </View>
          )}

          <View style={styles.scanOverlay} pointerEvents="none">
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>Barkodu kadraja hizala</Text>
          </View>
        </View>

        <View style={styles.cameraBottom}>
          <PrimaryButton
            label="Tara"
            icon="barcode-outline"
            onPress={onSimulateScan}
          />
          <Text style={styles.cameraBottomHint}>
            Demo: “Tara” ile analiz simülasyonu başlar.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function AnalysisModal({ visible, onClose, product }) {
  const [step, setStep] = useState("loading"); // loading | result
  const timerRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    setStep("loading");
    timerRef.current = setTimeout(() => setStep("result"), 2000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.bottomSheetOverlay}>
        <TouchableOpacity
          style={styles.bottomSheetBackdrop}
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
        />
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHandle} />
          {step === "loading" ? (
            <View style={styles.bottomSheetLoadingWrap}>
              <View style={styles.loadingBlock}>
                <ActivityIndicator size="large" color={TOKENS.primary} />
                <Text style={styles.modalTitle}>Ürün Analiz Ediliyor...</Text>
                <Text style={[styles.modalSub, styles.modalSubLeft]}>
                  İçerikler sağlık standartlarına göre değerlendiriliyor
                </Text>
              </View>
            </View>
          ) : (
            <ScrollView
              style={styles.bottomSheetScrollFlex}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.bottomSheetScroll}
            >
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
                    <Text style={styles.modalTitle}>
                      {product?.name ?? "Popkek"}
                    </Text>
                    <Text style={[styles.modalSub, styles.modalSubLeft]}>
                      Örnek içerik analizi
                    </Text>
                  </View>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={onClose}
                    activeOpacity={0.85}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={18} color={TOKENS.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Riskli İçerikler</Text>
                  <View style={styles.chipsRow}>
                    <VariantChip variant="danger" icon="warning-outline">
                      Palmiye Yağı
                    </VariantChip>
                    <VariantChip variant="warning" icon="alert-circle-outline">
                      Şeker Oranı Yüksek
                    </VariantChip>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Temiz İçerikler</Text>
                  <View style={styles.chipsRow}>
                    <VariantChip variant="good" icon="checkmark-circle-outline">
                      Doğal Aroma
                    </VariantChip>
                  </View>
                </View>

                <PrimaryButton label="Kapat" icon="close-outline" onPress={onClose} />
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ProductDetailModal({ visible, product, onClose }) {
  const score = product?.score ?? 0;
  const variant = getScoreVariant(score);
  const vc = getVariantColors(variant);
  const showAlternative = variant === "warning" || variant === "danger";
  const alternative = useMemo(
    () => (showAlternative ? getHealthierAlternative(product) : null),
    [product, showAlternative]
  );

  const items = useMemo(() => {
    const base = [{ variant: "good", text: "Palmiye Yağı Yok" }];
    if (score < 45) {
      return [
        ...base,
        { variant: "danger", text: "Yüksek Şeker" },
        { variant: "danger", text: "Katkı Profili Riskli" },
        { variant: "warning", text: "Dikkatli Tüketim Önerilir" },
      ];
    }
    if (score < 75) {
      return [
        ...base,
        { variant: "warning", text: "Şeker Oranı Orta" },
        { variant: "warning", text: "Katkı Maddesi Dikkat" },
        { variant: "good", text: "Aroma Profili Uygun" },
      ];
    }
    return [
      ...base,
      { variant: "good", text: "Şeker Oranı Düşük" },
      { variant: "good", text: "Katkı Profili Temiz" },
      { variant: "good", text: "Tuz Oranı Dengeli" },
    ];
  }, [score]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.bottomSheetOverlay}>
        <TouchableOpacity
          style={styles.bottomSheetBackdrop}
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
        />
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHandle} />
          <ScrollView
            style={styles.bottomSheetScrollFlex}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bottomSheetScroll}
          >
            <View style={styles.resultHeader}>
              <View style={styles.resultThumb}>
                <Ionicons
                  name="fast-food-outline"
                  size={20}
                  color={TOKENS.textSecondary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{product?.name ?? "Ürün"}</Text>
                <Text style={[styles.modalSub, styles.modalSubLeft]}>
                  Detaylı sağlık özeti
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={onClose}
                activeOpacity={0.85}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={18} color={TOKENS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailScoreRow}>
              <View style={styles.donutWrap}>
                <View
                  style={[
                    styles.donutRing,
                    {
                      borderColor: vc.text,
                    },
                  ]}
                >
                  <Text style={[styles.donutScore, { color: vc.text }]}>
                    {score}
                  </Text>
                  <Text style={styles.donutLabel}>/100</Text>
                </View>
              </View>
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={styles.modalSectionTitle}>Sağlık Skoru</Text>
                <View style={[styles.scorePill, { backgroundColor: vc.tint }]}>
                  <Text style={[styles.scorePillText, { color: vc.text }]}>
                    {variant === "good"
                      ? "Yeşil — Uygun"
                      : variant === "warning"
                      ? "Sarı — Dikkat"
                      : "Kırmızı — Risk"}
                  </Text>
                </View>
                <Text style={[styles.modalSub, styles.modalSubLeft]}>
                  Trafik lambası skoru; şeker, yağ, tuz ve katkı yoğunluğuna göre
                  simüle edilmiştir.
                </Text>
              </View>
            </View>

            <View style={{ paddingTop: 8, gap: 10 }}>
              <Text style={styles.modalSectionTitle}>İçerik Analizi</Text>
              <View style={styles.chipsRow}>
                {items.map((it, idx) => (
                  <VariantChip
                    key={`${it.text}-${idx}`}
                    variant={it.variant}
                    icon={
                      it.variant === "good"
                        ? "checkmark-circle-outline"
                        : it.variant === "warning"
                        ? "alert-circle-outline"
                        : "warning-outline"
                    }
                  >
                    {it.text}
                  </VariantChip>
                ))}
              </View>
            </View>

            {showAlternative && alternative ? (
              <View style={styles.alternativeCard}>
                <View style={styles.alternativeHeader}>
                  <Ionicons
                    name="leaf-outline"
                    size={20}
                    color={TOKENS.primary}
                  />
                  <Text style={styles.alternativeTitle}>
                    Daha Sağlıklı Bir Alternatif
                  </Text>
                </View>
                <Text style={styles.alternativeProduct}>{alternative.title}</Text>
                <Text style={styles.alternativeReason}>{alternative.reason}</Text>
                <Text style={styles.alternativeFoot}>
                  MVP: Aynı alt kategoride ve benzer fiyat segmentinde rafta arayın.
                </Text>
              </View>
            ) : null}

            <View style={{ paddingTop: 8 }}>
              <PrimaryButton label="Kapat" icon="close-outline" onPress={onClose} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function HomeScreen({
  onOpenCamera,
  recent,
  onOpenProduct,
  weeklySummary,
  onPickCategory,
}) {
  const maxBar = Math.max(
    weeklySummary.green,
    weeklySummary.yellow,
    weeklySummary.red,
    1
  );
  const barHeights = [
    { key: "g", count: weeklySummary.green, color: TOKENS.primary, label: "Yeşil" },
    {
      key: "y",
      count: weeklySummary.yellow,
      color: TOKENS.warning,
      label: "Sarı",
    },
    { key: "r", count: weeklySummary.red, color: TOKENS.danger, label: "Kırmızı" },
  ].map((b) => ({
    ...b,
    h: Math.round((b.count / maxBar) * 52) || (b.count > 0 ? 8 : 4),
  }));

  return (
    <ScrollView
      contentContainerStyle={styles.screenContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Hoş geldin, Sinem</Text>
        <Text style={styles.subtitle}>
          Bugün sağlığın için ne taramak istersin?
        </Text>
      </View>

      <View style={{ paddingTop: 24, paddingBottom: 28 }}>
        <PrimaryButton label="Yeni Ürün Tara" icon="barcode-outline" onPress={onOpenCamera} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Son Taramalar</Text>
        <Text style={styles.sectionHint}>Son taradıkların — detay için dokun</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {recent.map((item) => {
          const variant = getScoreVariant(item.score);
          const c = getVariantColors(variant);
          return (
            <TouchableOpacity
              key={item.id}
              accessibilityRole="button"
              activeOpacity={0.9}
              onPress={() => onOpenProduct(item)}
            >
              <PremiumCard style={styles.recentCard}>
                <View style={styles.recentTopRow}>
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
                <Text style={styles.cardMeta}>{item.date}</Text>
              </PremiumCard>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={{ paddingTop: 18 }}>
        <PremiumCard style={styles.homeWeeklyCard}>
          <View style={styles.homeWeeklyTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.homeWeeklyTitle}>Haftalık Sağlık Özeti</Text>
              <Text style={styles.homeWeeklySub}>
                Bu hafta {weeklySummary.total} ürün tarandı
              </Text>
            </View>
            <Ionicons
              name="stats-chart-outline"
              size={22}
              color={TOKENS.primary}
            />
          </View>

          <View style={styles.weeklyCountsRow}>
            <View style={styles.weeklyCountItem}>
              <View style={[styles.dot, { backgroundColor: TOKENS.primary }]} />
              <Text style={styles.weeklyCountLabel}>Yeşil</Text>
              <Text style={styles.weeklyCountValue}>{weeklySummary.green}</Text>
            </View>
            <View style={styles.weeklyCountItem}>
              <View style={[styles.dot, { backgroundColor: TOKENS.danger }]} />
              <Text style={styles.weeklyCountLabel}>Kırmızı</Text>
              <Text style={styles.weeklyCountValue}>{weeklySummary.red}</Text>
            </View>
            <View style={styles.weeklyCountItem}>
              <View style={[styles.dot, { backgroundColor: TOKENS.warning }]} />
              <Text style={styles.weeklyCountLabel}>Sarı</Text>
              <Text style={styles.weeklyCountValue}>{weeklySummary.yellow}</Text>
            </View>
          </View>

          <Text style={styles.miniBarCaption}>Dağılım (mini bar)</Text>
          <View style={styles.miniBarChart}>
            {barHeights.map((b) => (
              <View key={b.key} style={styles.miniBarCol}>
                <View style={styles.miniBarTrack}>
                  <View
                    style={[
                      styles.miniBarFillVertical,
                      { height: b.h, backgroundColor: b.color },
                    ]}
                  />
                </View>
                <Text style={styles.miniBarCount}>{b.count}</Text>
                <Text style={styles.miniBarLabel}>{b.label}</Text>
              </View>
            ))}
          </View>
        </PremiumCard>
      </View>

      <View style={{ paddingTop: 28 }}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kategorilere Göre Keşfet</Text>
          <Text style={styles.sectionHint}>İkonlu kısayollar</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.discoverRow}
        >
          {DISCOVER_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              accessibilityRole="button"
              activeOpacity={0.88}
              onPress={() => onPickCategory?.(cat)}
              style={styles.discoverChipOuter}
            >
              <PremiumCard style={styles.discoverChip}>
                <View style={styles.discoverIconWrap}>
                  <Ionicons name={cat.icon} size={22} color={TOKENS.primary} />
                </View>
                <Text style={styles.discoverChipLabel} numberOfLines={2}>
                  {cat.label}
                </Text>
              </PremiumCard>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

function HistoryScreen({ history, onOpenProduct }) {
  const weeklyScore = 78;
  const weeklyVariant = getScoreVariant(weeklyScore);
  const c = getVariantColors(weeklyVariant);

  return (
    <ScrollView
      contentContainerStyle={styles.screenContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Geçmiş</Text>
        <Text style={styles.subtitle}>Haftalık özet ve tarama geçmişin</Text>
      </View>

      <View style={{ paddingTop: 18, paddingBottom: 18 }}>
        <PremiumCard style={[styles.weeklyCard, { borderRadius: 24 }]}>
          <View style={styles.weeklyTop}>
            <View>
              <Text style={styles.weeklyLabel}>Haftalık Sağlık Puanın</Text>
              <Text style={styles.weeklyScore}>{weeklyScore}</Text>
            </View>
            <View style={[styles.scorePill, { backgroundColor: c.tint }]}>
              <Text style={[styles.scorePillText, { color: c.text }]}>
                {weeklyVariant === "good"
                  ? "İyi"
                  : weeklyVariant === "warning"
                  ? "Orta"
                  : "Risk"}
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${weeklyScore}%`, backgroundColor: c.text },
              ]}
            />
          </View>
          <Text style={styles.weeklyHint}>
            Skor; içerik riskleri, şeker/yağ dengesi ve katkı profiline göre
            simüle edilmiştir.
          </Text>
        </PremiumCard>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tarama Geçmişi</Text>
        <Text style={styles.sectionHint}>Tüm taramalar — detay için dokun</Text>
      </View>

      <View style={{ gap: 12 }}>
        {history.map((item) => {
          const variant = getScoreVariant(item.score);
          const vc = getVariantColors(variant);
          return (
            <TouchableOpacity
              key={item.id}
              accessibilityRole="button"
              activeOpacity={0.88}
              onPress={() => onOpenProduct(item)}
            >
              <PremiumCard style={styles.historyRow}>
                <View style={styles.historyIcon}>
                  <Ionicons
                    name="receipt-outline"
                    size={18}
                    color={TOKENS.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.historySub}>{item.date}</Text>
                </View>
                <View style={[styles.scorePill, { backgroundColor: vc.tint }]}>
                  <Text style={[styles.scorePillText, { color: vc.text }]}>
                    {item.score}
                  </Text>
                </View>
              </PremiumCard>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

function ProfileScreen({ userEmail, onLogout }) {
  return (
    <ScrollView
      contentContainerStyle={styles.screenContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
        <Text style={styles.subtitle}>Ayarların ve sağlık tercihlerin</Text>
      </View>

      <View style={{ paddingTop: 18, gap: 12 }}>
        <PremiumCard style={{ padding: 18, borderRadius: 24 }}>
          <Text style={styles.profileLabel}>Email</Text>
          <Text style={styles.profileValue}>{userEmail}</Text>
          <View style={{ height: 14 }} />
          <Text style={styles.profileLabel}>Durum</Text>
          <VariantChip variant="good" icon="shield-checkmark-outline">
            Premium Dashboard
          </VariantChip>
        </PremiumCard>

        <PrimaryButton label="Çıkış Yap" icon="log-out-outline" onPress={onLogout} />
      </View>
    </ScrollView>
  );
}

function TabBar({ activeTab, onChange }) {
  return (
    <View style={styles.tabBar}>
      {TAB_ITEMS.map((t) => {
        const isActive = activeTab === t.id;
        return (
          <TouchableOpacity
            key={t.id}
            accessibilityRole="button"
            activeOpacity={0.85}
            style={styles.tabItem}
            onPress={() => onChange(t.id)}
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
  );
}

export default function App() {
  const history = useMemo(
    () =>
      INITIAL_HISTORY.map((h) => ({
        ...h,
        variant: getScoreVariant(h.score),
      })),
    []
  );

  const weeklySummary = useMemo(() => {
    const green = history.filter((h) => getScoreVariant(h.score) === "good").length;
    const yellow = history.filter((h) => getScoreVariant(h.score) === "warning").length;
    const red = history.filter((h) => getScoreVariant(h.score) === "danger").length;
    const total = green + yellow + red;
    return {
      green,
      yellow,
      red,
      total,
    };
  }, [history]);

  const [session, setSession] = useState({ isAuthed: false, email: "" });
  const [activeTab, setActiveTab] = useState("home");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisProduct, setAnalysisProduct] = useState(null);
  const [productDetailOpen, setProductDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const openAnalysisFor = (product) => {
    setAnalysisProduct(product ?? { name: "Popkek" });
    setAnalysisOpen(true);
  };

  if (!session.isAuthed) {
    return (
      <LoginScreen
        onLogin={({ email }) => setSession({ isAuthed: true, email })}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.appShell}>
        <View style={styles.flex}>
          {activeTab === "home" ? (
            <HomeScreen
              recent={history.slice(0, 4)}
              onOpenCamera={() => setCameraOpen(true)}
              weeklySummary={weeklySummary}
              onPickCategory={() => setCameraOpen(true)}
              onOpenProduct={(p) => {
                setSelectedProduct(p);
                setProductDetailOpen(true);
              }}
            />
          ) : null}
          {activeTab === "history" ? (
            <HistoryScreen
              history={history}
              onOpenProduct={(p) => {
                setSelectedProduct(p);
                setProductDetailOpen(true);
              }}
            />
          ) : null}
          {activeTab === "profile" ? (
            <ProfileScreen
              userEmail={session.email}
              onLogout={() => setSession({ isAuthed: false, email: "" })}
            />
          ) : null}
        </View>

        <TabBar activeTab={activeTab} onChange={setActiveTab} />
      </View>

      <CameraScanModal
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onSimulateScan={() => {
          setCameraOpen(false);
          openAnalysisFor({ name: "Popkek" });
        }}
      />

      <AnalysisModal
        visible={analysisOpen}
        product={analysisProduct}
        onClose={() => setAnalysisOpen(false)}
      />

      <ProductDetailModal
        visible={productDetailOpen}
        product={selectedProduct}
        onClose={() => setProductDetailOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: {
    flex: 1,
    backgroundColor: TOKENS.background,
  },
  appShell: {
    flex: 1,
  },

  // Auth
  authContainer: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    gap: 18,
  },
  authHeader: {
    gap: 10,
  },
  authTitle: {
    color: TOKENS.textPrimary,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  authSubtitle: {
    color: TOKENS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  inputLabel: {
    color: TOKENS.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(100, 116, 139, 0.08)",
  },
  input: {
    flex: 1,
    color: TOKENS.textPrimary,
    fontSize: 15,
    paddingVertical: 0,
  },
  authFootnote: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    paddingTop: 2,
  },

  // Global header and spacing
  screenContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 118,
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

  // Cards & shadows (premium dashboard — DS elevation)
  cardBase: {
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // Buttons
  primaryButton: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: TOKENS.primary,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primaryButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  primaryButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: TOKENS.surface,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  // Home recent cards
  horizontalList: {
    paddingRight: 24,
    gap: 12,
  },
  recentCard: {
    width: 240,
    padding: 16,
  },
  recentTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
  },
  thumb: {
    width: 46,
    height: 46,
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
  cardMeta: {
    color: TOKENS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    paddingTop: 6,
  },
  scorePill: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  scorePillText: {
    fontSize: 13,
    fontWeight: "800",
  },

  homeWeeklyCard: {
    padding: 18,
    borderRadius: 24,
  },
  homeWeeklyTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    gap: 12,
  },
  homeWeeklyTitle: {
    color: TOKENS.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.1,
  },
  homeWeeklySub: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    paddingTop: 6,
  },
  weeklyCountsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingBottom: 14,
  },
  weeklyCountItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  weeklyCountLabel: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  weeklyCountValue: {
    color: TOKENS.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  miniBarCaption: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    paddingBottom: 10,
  },
  miniBarChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 4,
  },
  miniBarCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  miniBarTrack: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    backgroundColor: "rgba(100, 116, 139, 0.10)",
    justifyContent: "flex-end",
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingBottom: 6,
    paddingTop: 6,
  },
  miniBarFillVertical: {
    width: "100%",
    borderRadius: 8,
    minHeight: 4,
  },
  miniBarCount: {
    color: TOKENS.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  miniBarLabel: {
    color: TOKENS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  discoverRow: {
    paddingRight: 24,
    gap: 12,
    paddingBottom: 4,
  },
  discoverChipOuter: {
    maxWidth: 112,
  },
  discoverChip: {
    width: 104,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    gap: 10,
  },
  discoverIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(5, 150, 105, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  discoverChipLabel: {
    color: TOKENS.textPrimary,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 16,
  },

  // Tabs
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
        shadowColor: "#000000",
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 4,
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
    fontWeight: "700",
  },

  // History weekly card + list
  weeklyCard: {
    padding: 18,
  },
  weeklyTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
  },
  weeklyLabel: {
    color: TOKENS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  weeklyScore: {
    color: TOKENS.textPrimary,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.4,
    paddingTop: 4,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(100, 116, 139, 0.12)",
    overflow: "hidden",
  },
  progressFill: {
    height: 10,
    borderRadius: 999,
  },
  weeklyHint: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    paddingTop: 12,
  },
  historyRow: {
    padding: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(5, 150, 105, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  historyTitle: {
    color: TOKENS.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  historySub: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    paddingTop: 2,
  },

  // Chips
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "800",
  },

  // Bottom sheets & modals
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bottomSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
  },
  bottomSheet: {
    height: BOTTOM_SHEET_HEIGHT,
    width: "100%",
    backgroundColor: TOKENS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    paddingHorizontal: 18,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.1,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: -4 },
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bottomSheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(100, 116, 139, 0.22)",
    marginBottom: 10,
  },
  bottomSheetLoadingWrap: {
    flex: 1,
    justifyContent: "center",
    minHeight: 200,
  },
  bottomSheetScrollFlex: {
    flex: 1,
  },
  bottomSheetScroll: {
    paddingBottom: 24,
    gap: 16,
  },
  loadingBlock: {
    alignItems: "center",
    paddingVertical: 24,
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
    fontWeight: "800",
    letterSpacing: -0.1,
  },
  modalSub: {
    color: TOKENS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  modalSubLeft: {
    textAlign: "left",
  },
  modalSection: {
    gap: 10,
  },
  modalSectionTitle: {
    color: TOKENS.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  detailScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingTop: 8,
  },
  donutWrap: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  donutRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TOKENS.surface,
  },
  donutScore: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  donutLabel: {
    fontSize: 11,
    color: TOKENS.textSecondary,
    fontWeight: "700",
    marginTop: -2,
  },
  alternativeCard: {
    marginTop: 4,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(5, 150, 105, 0.08)",
    gap: 8,
  },
  alternativeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alternativeTitle: {
    color: TOKENS.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  alternativeProduct: {
    color: TOKENS.primary,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
  },
  alternativeReason: {
    color: TOKENS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  alternativeFoot: {
    color: TOKENS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    fontStyle: "italic",
    paddingTop: 4,
  },

  // Camera modal
  cameraTopBar: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    backgroundColor: TOKENS.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cameraTitle: {
    color: TOKENS.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  cameraClose: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: TOKENS.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cameraStage: {
    flex: 1,
    backgroundColor: "#000000",
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  scanFrame: {
    width: 260,
    height: 170,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.80)",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  scanHint: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 13,
    fontWeight: "700",
  },
  cameraBottom: {
    backgroundColor: TOKENS.background,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    gap: 10,
  },
  cameraBottomHint: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  cameraPermission: {
    flex: 1,
    backgroundColor: TOKENS.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  cameraPermissionTitle: {
    color: TOKENS.textPrimary,
    fontSize: 18,
    fontWeight: "800",
  },
  cameraPermissionSub: {
    color: TOKENS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    paddingTop: 10,
  },
});

