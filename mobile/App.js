import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {step === "loading" ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator size="large" color={TOKENS.primary} />
              <Text style={styles.modalTitle}>Ürün Analiz Ediliyor...</Text>
              <Text style={styles.modalSub}>
                İçerikler sağlık standartlarına göre değerlendiriliyor
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
                  <Text style={styles.modalTitle}>{product?.name ?? "Popkek"}</Text>
                  <Text style={styles.modalSub}>Örnek içerik analizi</Text>
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
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
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
              <Text style={styles.modalSub}>Detaylı sağlık özeti</Text>
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

          <View style={{ paddingTop: 14, gap: 10 }}>
            <Text style={styles.modalSectionTitle}>Sağlık Skoru</Text>
            <View style={[styles.scorePill, { backgroundColor: vc.tint }]}>
              <Text style={[styles.scorePillText, { color: vc.text }]}>
                {score}/100
              </Text>
            </View>
          </View>

          <View style={{ paddingTop: 16, gap: 10 }}>
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

          <View style={{ paddingTop: 18 }}>
            <PrimaryButton label="Kapat" icon="close-outline" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function HomeScreen({ onOpenCamera, recent, onOpenProduct, weeklySummary }) {
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
        <Text style={styles.sectionTitle}>Geçmiş Taramalar</Text>
        <Text style={styles.sectionHint}>Son taradıkların</Text>
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
              <Text style={styles.homeWeeklyTitle}>Haftalık Sağlık Analizin</Text>
              <Text style={styles.homeWeeklySub}>
                Bu hafta {weeklySummary.total} ürün tarandı
              </Text>
            </View>
            <Ionicons
              name="bar-chart-outline"
              size={20}
              color={TOKENS.textSecondary}
            />
          </View>

          <View style={styles.homeWeeklyStats}>
            <View style={styles.homeWeeklyStatItem}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: TOKENS.primary },
                ]}
              />
              <Text style={styles.homeWeeklyStatLabel}>Temiz</Text>
              <Text style={styles.homeWeeklyStatValue}>
                {weeklySummary.clean}
              </Text>
            </View>
            <View style={styles.homeWeeklyStatItem}>
              <View style={[styles.dot, { backgroundColor: TOKENS.danger }]} />
              <Text style={styles.homeWeeklyStatLabel}>Riskli</Text>
              <Text style={styles.homeWeeklyStatValue}>
                {weeklySummary.risky}
              </Text>
            </View>
          </View>

          <View style={styles.segmentTrack}>
            <View
              style={[
                styles.segmentFill,
                { flex: weeklySummary.cleanRatio, backgroundColor: TOKENS.primary },
              ]}
            />
            <View
              style={[
                styles.segmentFill,
                {
                  flex: 1 - weeklySummary.cleanRatio,
                  backgroundColor: TOKENS.danger,
                },
              ]}
            />
          </View>
        </PremiumCard>
      </View>
    </ScrollView>
  );
}

function HistoryScreen({ history }) {
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
        <Text style={styles.sectionHint}>Tüm taramalar</Text>
      </View>

      <View style={{ gap: 12 }}>
        {history.map((item) => {
          const variant = getScoreVariant(item.score);
          const vc = getVariantColors(variant);
          return (
            <PremiumCard key={item.id} style={styles.historyRow}>
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
    const clean = history.filter((h) => getScoreVariant(h.score) === "good").length;
    const risky = history.filter((h) => getScoreVariant(h.score) !== "good").length;
    const total = Math.max(1, clean + risky);
    return {
      clean,
      risky,
      total: clean + risky,
      cleanRatio: clean / total,
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
              onOpenProduct={(p) => {
                setSelectedProduct(p);
                setProductDetailOpen(true);
              }}
            />
          ) : null}
          {activeTab === "history" ? <HistoryScreen history={history} /> : null}
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

  // Cards & shadows (premium dashboard)
  cardBase: {
    backgroundColor: TOKENS.surface,
    borderRadius: 16,
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
        shadowColor: "rgba(0, 0, 0, 0.04)",
        shadowOpacity: 1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 7,
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
    ...Platform.select({
      android: {
        elevation: 3,
      },
    }),
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
  homeWeeklyStats: {
    flexDirection: "row",
    gap: 16,
    paddingBottom: 12,
  },
  homeWeeklyStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  homeWeeklyStatLabel: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  homeWeeklyStatValue: {
    color: TOKENS.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  segmentTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: "rgba(100, 116, 139, 0.12)",
  },
  segmentFill: {
    height: 10,
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
        shadowColor: "rgba(0, 0, 0, 0.04)",
        shadowOpacity: 1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 10,
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

  // Analysis modal
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
        elevation: 12,
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
    fontWeight: "800",
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
    fontWeight: "800",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
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

