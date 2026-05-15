import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
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

const SWITCH_TRACK_OFF = "rgba(100, 116, 139, 0.28)";
const SWITCH_TRACK_ON = "rgba(5, 150, 105, 0.45)";

// Android emülatöründe makine localhost'u 10.0.2.2 üzerinden erişilir.
const API_BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:8000"
    : "http://127.0.0.1:8000";

async function parseApiError(response) {
  try {
    const data = await response.json();
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((entry) => entry?.msg || JSON.stringify(entry))
        .join("\n");
    }
  } catch (_) {
    // ignore JSON parse errors
  }
  return null;
}

function mapAuthErrorMessage(detail, status) {
  const normalized = (detail || "").toLowerCase();
  if (status === 409 || normalized.includes("already registered")) {
    return "Bu e-posta adresi zaten kayıtlı.";
  }
  if (status === 401 || normalized.includes("invalid credentials")) {
    return "E-posta veya şifre hatalı.";
  }
  if (normalized.includes("at least 8")) {
    return "Şifre en az 8 karakter olmalıdır.";
  }
  if (detail) return detail;
  return "İşlem tamamlanamadı. Lütfen tekrar deneyin.";
}

async function registerUser({ email, password, fullName }) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: email.trim(),
      password,
      full_name: fullName.trim(),
    }),
  });
  if (!response.ok) {
    const detail = await parseApiError(response);
    throw new Error(mapAuthErrorMessage(detail, response.status));
  }
  return response.json();
}

async function loginUser({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: email.trim(),
      password,
    }),
  });
  if (!response.ok) {
    const detail = await parseApiError(response);
    throw new Error(mapAuthErrorMessage(detail, response.status));
  }
  return response.json();
}

const TAB_ITEMS = [
  { id: "home", label: "Home", icon: "home-outline" },
  { id: "history", label: "History", icon: "time-outline" },
  { id: "profile", label: "Profile", icon: "person-outline" },
];

const INITIAL_HISTORY = [
  {
    id: "h1",
    name: "Tam Yağlı Süt",
    score: 86,
    date: "Bugün",
    category: "Süt Ürünleri",
  },
  {
    id: "h2",
    name: "Fıstık Ezmesi",
    score: 62,
    date: "Dün",
    category: "Atıştırmalık",
  },
  {
    id: "h3",
    name: "Çikolata",
    score: 28,
    date: "2 gün önce",
    category: "Tatlı",
  },
  {
    id: "h4",
    name: "Yulaf Bar",
    score: 74,
    date: "Geçen hafta",
    category: "Atıştırmalık",
  },
];

/** Barkod tarama simülasyonu: sırayla dönen örnek ürünler (kategori + skor tutarlı) */
const SCAN_DEMO_PRODUCTS = [
  { name: "Asitli Kolalı İçecek", score: 28, category: "İçecek" },
  { name: "Sütlü Çikolata", score: 32, category: "Tatlı" },
  { name: "Baharatlı Patates Cipsi", score: 36, category: "Atıştırmalık" },
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

/**
 * PRD: Alternatif aynı alt kategoride olmalı. Önce `category`, yoksa isimden tahmin.
 * Öneri metinleri yalnızca ilgili kategori içinde üretilir.
 */
function inferCategoryFromName(name) {
  const raw = (name ?? "").toLowerCase();
  if (
    raw.includes("kola") ||
    raw.includes("gazoz") ||
    raw.includes("içecek") ||
    raw.includes("asitli") ||
    raw.includes("maden") ||
    raw.includes("nektar") ||
    raw.includes("smoothie")
  ) {
    return "İçecek";
  }
  if (
    raw.includes("çikolata") ||
    raw.includes("gofret") ||
    raw.includes("tatlı") ||
    raw.includes("kek") ||
    raw.includes("dondurma")
  ) {
    return "Tatlı";
  }
  if (
    raw.includes("süt") ||
    raw.includes("yoğurt") ||
    raw.includes("kefir") ||
    raw.includes("ayran")
  ) {
    return "Süt Ürünleri";
  }
  if (
    raw.includes("ekmek") ||
    raw.includes("börek") ||
    raw.includes("poğaça")
  ) {
    return "Fırın";
  }
  if (
    raw.includes("cips") ||
    raw.includes("kraker") ||
    raw.includes("bar") ||
    raw.includes("kuruyemiş") ||
    raw.includes("fıstık") ||
    raw.includes("yulaf")
  ) {
    return "Atıştırmalık";
  }
  if (
    raw.includes("müsli") ||
    raw.includes("gevrek") ||
    raw.includes("reçel") ||
    raw.includes("zeytin")
  ) {
    return "Kahvaltılık";
  }
  if (raw.includes("dondurulmuş") || raw.includes("donuk")) {
    return "Donuk";
  }
  return "Atıştırmalık";
}

function getHealthierAlternative(product) {
  const raw = (product?.name ?? "").toLowerCase();
  const category =
    (product?.category && String(product.category).trim()) ||
    inferCategoryFromName(product?.name);

  const byCategory = {
    Tatlı: {
      default: {
        title: "%70 ve üzeri kakao bitter çikolata",
        reason:
          "Aynı tatlı reyonunda ek şekeri ve katkı yoğunluğunu düşüren, kakao oranı yüksek seçeneklere yönelin.",
      },
      refinements: [
        {
          keys: ["çikolata"],
          title: "%70 Kakao Bitter Çikolata",
          reason:
            "Çikolata ihtiyacınızı aynı kategoride karşılarken şeker yükünü belirgin biçimde azaltır.",
        },
        {
          keys: ["gofret", "kek"],
          title: "Düşük şekerli tahıl barı veya bitter kaplı gofret",
          reason:
            "Aynı tatlı grubunda daha kısa içerik listesi ve daha düşük şeker profili arayın.",
        },
      ],
    },
    İçecek: {
      default: {
        title: "Doğal maden suyu (sade veya maden + limon)",
        reason:
          "Aynı içecek ihtiyacında ek şeker ve asit yükü olmadan serinleten seçenekleri tercih edin.",
      },
      refinements: [
        {
          keys: ["kola", "gazoz", "asitli", "enerji"],
          title: "Doğal maden suyu",
          reason:
            "Asitli ve şekerli içecekler yerine aynı reyonda bulunan sade maden suyu ile susuzluğunuzu giderin.",
        },
      ],
    },
    Atıştırmalık: {
      default: {
        title: "Fırınlanmış nohut veya tam tahıllı kraker",
        reason:
          "Aynı atıştırmalık grubunda daha yüksek lif ve daha sade yağ profili sunan ürünlere bakın.",
      },
      refinements: [
        {
          keys: ["cips", "patates", "baharat"],
          title: "Fırınlanmış nohut atıştırmalığı",
          reason:
            "Tuzlu cips yerine aynı kategoride fırınlanmış bakliye tabanlı, trans yağ riski daha düşük alternatifler seçin.",
        },
        {
          keys: ["fıstık", "ezme"],
          title: "İlave şekersiz %100 fıstık ezmesi",
          reason:
            "Aynı atıştırmalık grubunda kısa içerik listesi ve düşük işlenmiş şeker profili hedefleyin.",
        },
        {
          keys: ["yulaf", "bar"],
          matchAll: true,
          title: "Düşük şekerli protein veya yulaf barı",
          reason:
            "Aynı bar reyonunda şeker ve katkı oranı daha düşük, lif oranı yüksek etiketleri karşılaştırın.",
        },
        {
          keys: ["kraker"],
          title: "Tam tahıllı veya ekşi mayalı kraker",
          reason:
            "Aynı kraker kategorisinde raf ömrü katkıları daha sınırlı, tahıl kaynağı net ürünleri tercih edin.",
        },
      ],
    },
    "Süt Ürünleri": {
      default: {
        title: "Yağı hafifletilmiş veya laktozsuz günlük süt",
        reason:
          "Aynı süt ürünleri reyonunda yağ dengesi ve laktoz ihtiyacınıza uygun etiketleri seçin.",
      },
      refinements: [
        {
          keys: ["tam yağlı", "yağlı"],
          title: "Yarı yağlı veya laktozsuz süt",
          reason:
            "Aynı kategoride doygunluk korunurken yağ ve laktoz yükünü dengeleyen seçeneklere yönelin.",
        },
      ],
    },
    Kahvaltılık: {
      default: {
        title: "Ek şekersiz granola veya tam tahıllı gevrek",
        reason:
          "Aynı kahvaltılık grubunda posa ve protein oranı daha yüksek, ek şeker daha düşük ürünleri arayın.",
      },
      refinements: [],
    },
    Fırın: {
      default: {
        title: "Tam tahıllı veya çavdarlı ekmek",
        reason:
          "Aynı fırın ürünleri grubunda glisemik yükü yumuşatan lif kaynaklarını önceliklendirin.",
      },
      refinements: [
        {
          keys: ["beyaz", "sandviç"],
          title: "Tam tahıllı dilim ekmek",
          reason:
            "Aynı ekmek kategorisinde raf ömrü ve katkı listesi daha sade ürünleri tercih edin.",
        },
      ],
    },
    Donuk: {
      default: {
        title: "Sebzeli veya bakliyeli donuk ana yemek",
        reason:
          "Aynı donuk gıda grubunda tuz ve doyurucu lif dengesi daha iyi olan seçeneklere bakın.",
      },
      refinements: [],
    },
  };

  const block = byCategory[category] ?? byCategory.Atıştırmalık;
  if (block.refinements?.length) {
    for (const r of block.refinements) {
      const hit = r.matchAll
        ? r.keys.every((k) => raw.includes(k))
        : r.keys.some((k) => raw.includes(k));
      if (hit) {
        return { title: r.title, reason: r.reason, category };
      }
    }
  }
  return { ...block.default, category };
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

function ScansEmptyState({ onPressCamera }) {
  return (
    <View style={styles.emptyStateBox}>
      <View style={styles.emptyStateIconWrap}>
        <Ionicons name="scan-circle-outline" size={48} color={TOKENS.textSecondary} />
      </View>
      <Text style={styles.emptyStateBody}>
        Henüz tarama yapmadınız. İlk ürününüzü incelemek için kameraya tıklayın.
      </Text>
      <TouchableOpacity
        style={styles.emptyStateCta}
        onPress={onPressCamera}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel="Kamerayı aç"
      >
        <Ionicons name="camera-outline" size={20} color={TOKENS.primary} />
        <Text style={styles.emptyStateCtaText}>Kamerayı aç</Text>
      </TouchableOpacity>
    </View>
  );
}

function PrimaryButton({ label, icon, onPress, style, disabled }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      accessibilityRole="button"
      style={[styles.primaryButton, style, disabled ? { opacity: 0.6 } : null]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
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

function LoginScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmitLogin =
    email.trim().length > 2 && password.trim().length >= 8;
  const canSubmitRegister =
    canSubmitLogin && fullName.trim().length > 1;
  const canSubmit = mode === "login" ? canSubmitLogin : canSubmitRegister;

  const isLogin = mode === "login";

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;

    setLoading(true);
    try {
      if (isLogin) {
        await loginUser({ email, password });
        onAuthSuccess({ email, displayName: "" });
      } else {
        await registerUser({ email, password, fullName });
        onAuthSuccess({
          email,
          displayName: fullName.trim(),
        });
      }
    } catch (error) {
      const message =
        error?.message === "Network request failed"
          ? "Sunucuya bağlanılamadı. Backend'in çalıştığından emin olun (http://127.0.0.1:8000)."
          : error?.message || "Beklenmeyen bir hata oluştu.";
      Alert.alert(isLogin ? "Giriş başarısız" : "Kayıt başarısız", message);
    } finally {
      setLoading(false);
    }
  };

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
              {isLogin
                ? "Hesabınla içerik analizine ve haftalık özetine devam et."
                : "Dakikalar içinde hesap oluştur; taramaların ve özetin seninle kalsın."}
            </Text>
          </View>

          <PremiumCard style={{ padding: 18, borderRadius: 24 }}>
            <Text style={styles.authCardTitle}>
              {isLogin ? "Giriş Yap" : "Kayıt Ol"}
            </Text>

            {!isLogin ? (
              <>
                <Text style={styles.inputLabel}>Ad Soyad</Text>
                <View style={styles.inputWrap}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={TOKENS.textSecondary}
                  />
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Adınız Soyadınız"
                    placeholderTextColor={TOKENS.textSecondary}
                    autoCapitalize="words"
                    style={styles.input}
                  />
                </View>
              </>
            ) : null}

            <Text
              style={[
                styles.inputLabel,
                !isLogin ? { marginTop: 14 } : { marginTop: 0 },
              ]}
            >
              E-posta
            </Text>
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
              label={
                loading
                  ? isLogin
                    ? "Giriş yapılıyor…"
                    : "Kayıt olunuyor…"
                  : isLogin
                    ? "Giriş Yap"
                    : "Kayıt Ol"
              }
              icon={isLogin ? "log-in-outline" : "person-add-outline"}
              style={{ marginTop: 18 }}
              disabled={!canSubmit || loading}
              onPress={handleSubmit}
            />
          </PremiumCard>

          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.85}
            style={styles.authModeSwitch}
            onPress={() => {
              setMode(isLogin ? "register" : "login");
            }}
          >
            <Text style={styles.authModeSwitchText}>
              {isLogin ? (
                <>
                  <Text style={styles.authModeSwitchMuted}>Hesabın yok mu? </Text>
                  <Text style={styles.authModeSwitchAccent}>Kayıt Ol</Text>
                </>
              ) : (
                <>
                  <Text style={styles.authModeSwitchMuted}>Zaten üye misin? </Text>
                  <Text style={styles.authModeSwitchAccent}>Giriş Yap</Text>
                </>
              )}
            </Text>
          </TouchableOpacity>

          <Text style={styles.authFootnote}>
            Oturum bilgileriniz cihazınızda güvenli şekilde saklanır; hesabınıza yalnızca siz
            erişebilirsiniz.
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
            Barkodu okuttuğunuzda analiz birkaç saniye içinde hazır olur; gerekirse ışığı açıp tekrar
            deneyebilirsiniz.
          </Text>
        </View>
      </SafeAreaView>
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
                  color={TOKENS.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{product?.name ?? "Ürün"}</Text>
                <Text style={[styles.modalSub, styles.modalSubLeft]}>
                  İçerik analizi ve kişiselleştirilmiş özet
                </Text>
                {product?.category ? (
                  <Text style={styles.modalCategory}>
                    Kategori · {product.category}
                  </Text>
                ) : null}
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
                  Ürün içeriği, sağlık profilinize göre analiz edilmiştir.
                </Text>
                {variant === "good" ? (
                  <Text style={[styles.modalSub, styles.modalSubLeft, styles.modalSubTight]}>
                    Bu ürün, seçtiğiniz diyet ve kısıtlamalara tam uyum sağlar.
                  </Text>
                ) : (
                  <Text style={[styles.modalSub, styles.modalSubLeft, styles.modalSubTight]}>
                    Skor; şeker, yağ, tuz ve katkı profili ile profilinizdeki tercihler birlikte
                    değerlendirilerek hesaplanır.
                  </Text>
                )}
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
                  Bu öneri, taradığınız ürünle aynı ürün grubunda ({alternative.category}) yer alan, profilinize
                  uygun yeşil skorlu bir seçenek hedefler. Satın almadan önce güncel içerik etiketini kontrol
                  etmenizi öneririz.
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
  userName,
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
        <Text style={styles.title}>Hoş geldin, {userName}</Text>
        <Text style={styles.subtitle}>
          Bugün sağlığın için ne taramak istersin?
        </Text>
      </View>

      <View style={{ paddingTop: 24, paddingBottom: 28 }}>
        <PrimaryButton label="Yeni Ürün Tara" icon="barcode-outline" onPress={onOpenCamera} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Son Taramalar</Text>
        <Text style={styles.sectionHint}>
          {recent.length === 0
            ? "Tarama ekledikçe burada görünür"
            : "Son taradıkların — detay için dokun"}
        </Text>
      </View>

      {recent.length === 0 ? (
        <ScansEmptyState onPressCamera={onOpenCamera} />
      ) : (
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
                        color={TOKENS.primary}
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
      )}

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

          <Text style={styles.miniBarCaption}>Haftalık skor dağılımı</Text>
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
          <Text style={styles.sectionHint}>Kategoriye göre hızlı erişim</Text>
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

function HistoryScreen({ history, onOpenProduct, weeklySummary, onOpenCamera }) {
  const n = history.length;

  if (n === 0) {
    return (
      <ScrollView
        contentContainerStyle={[styles.screenContainer, styles.historyEmptyScroll]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Geçmiş</Text>
          <Text style={styles.subtitle}>Haftalık özet ve tarama geçmişin</Text>
        </View>
        <ScansEmptyState onPressCamera={onOpenCamera} />
      </ScrollView>
    );
  }

  const weeklyScore = weeklySummary.averageScore;
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
            Bu puan, geçmişteki {weeklySummary.total} taramanızın ortalama sağlık skorundan türetilir;
            yeni tarama ekledikçe güncellenir.
          </Text>
          <View style={styles.weeklyMiniRow}>
            <View style={styles.weeklyMiniItem}>
              <View style={[styles.dot, { backgroundColor: TOKENS.primary }]} />
              <Text style={styles.weeklyMiniLabel}>Yeşil</Text>
              <Text style={styles.weeklyMiniValue}>{weeklySummary.green}</Text>
            </View>
            <View style={styles.weeklyMiniItem}>
              <View style={[styles.dot, { backgroundColor: TOKENS.warning }]} />
              <Text style={styles.weeklyMiniLabel}>Sarı</Text>
              <Text style={styles.weeklyMiniValue}>{weeklySummary.yellow}</Text>
            </View>
            <View style={styles.weeklyMiniItem}>
              <View style={[styles.dot, { backgroundColor: TOKENS.danger }]} />
              <Text style={styles.weeklyMiniLabel}>Kırmızı</Text>
              <Text style={styles.weeklyMiniValue}>{weeklySummary.red}</Text>
            </View>
          </View>
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
                    color={TOKENS.primary}
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

function ProfileScreen({ userEmail, userName, onLogout }) {
  const [prefs, setPrefs] = useState({
    glutenFree: false,
    vegan: false,
    noAddedSugar: false,
    lactoseFree: false,
  });

  const setPref = (key, value) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  };

  const switchProps = {
    trackColor: { false: SWITCH_TRACK_OFF, true: SWITCH_TRACK_ON },
    ios_backgroundColor: SWITCH_TRACK_OFF,
    thumbColor: Platform.OS === "android" ? TOKENS.surface : undefined,
  };

  return (
    <ScrollView
      contentContainerStyle={styles.screenContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
        <Text style={styles.subtitle}>Ayarların ve sağlık tercihlerin</Text>
      </View>

      <View style={{ paddingTop: 18, gap: 16 }}>
        <PremiumCard style={styles.profileHeroCard}>
          <Text style={styles.profileHeroName}>{userName}</Text>
          <Text style={styles.profileLabel}>E-posta</Text>
          <Text style={styles.profileValue}>{userEmail}</Text>
          <View style={{ height: 14 }} />
          <Text style={styles.profileLabel}>Durum</Text>
          <VariantChip variant="good" icon="shield-checkmark-outline">
            Hesap aktif
          </VariantChip>
        </PremiumCard>

        <PremiumCard style={styles.profilePrefsCard}>
          <Text style={styles.profileSectionTitle}>Sağlık & Diyet Tercihlerim</Text>
          <Text style={styles.profileSectionHint}>
            Tercihler analiz özetinde dikkate alınır; istediğiniz zaman güncelleyebilirsiniz.
          </Text>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceTextCol}>
              <Text style={styles.preferenceLabel}>Glutensiz</Text>
              <Text style={styles.preferenceSub}>Gluten içeren içerikleri işaretle</Text>
            </View>
            <Switch
              value={prefs.glutenFree}
              onValueChange={(v) => setPref("glutenFree", v)}
              {...switchProps}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceTextCol}>
              <Text style={styles.preferenceLabel}>Vegan</Text>
              <Text style={styles.preferenceSub}>Hayvansal kaynaklı içerikleri dikkate al</Text>
            </View>
            <Switch
              value={prefs.vegan}
              onValueChange={(v) => setPref("vegan", v)}
              {...switchProps}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceTextCol}>
              <Text style={styles.preferenceLabel}>İlave Şeker Yok</Text>
              <Text style={styles.preferenceSub}>Eklenmiş şekerleri vurgula</Text>
            </View>
            <Switch
              value={prefs.noAddedSugar}
              onValueChange={(v) => setPref("noAddedSugar", v)}
              {...switchProps}
            />
          </View>

          <View style={[styles.preferenceRow, styles.preferenceRowLast]}>
            <View style={styles.preferenceTextCol}>
              <Text style={styles.preferenceLabel}>Laktozsuz</Text>
              <Text style={styles.preferenceSub}>Süt şekeri (laktoz) hassasiyeti</Text>
            </View>
            <Switch
              value={prefs.lactoseFree}
              onValueChange={(v) => setPref("lactoseFree", v)}
              {...switchProps}
            />
          </View>
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
  const [historyList, setHistoryList] = useState(() =>
    INITIAL_HISTORY.map((h) => ({
      ...h,
      variant: getScoreVariant(h.score),
    }))
  );
  const scanDemoIndexRef = useRef(0);

  const weeklySummary = useMemo(() => {
    const green = historyList.filter((h) => getScoreVariant(h.score) === "good").length;
    const yellow = historyList.filter((h) => getScoreVariant(h.score) === "warning").length;
    const red = historyList.filter((h) => getScoreVariant(h.score) === "danger").length;
    const total = green + yellow + red;
    const sumScores = historyList.reduce((acc, h) => acc + (h.score ?? 0), 0);
    const averageScore =
      total > 0 ? Math.min(100, Math.max(0, Math.round(sumScores / total))) : 0;
    return {
      green,
      yellow,
      red,
      total,
      averageScore,
    };
  }, [historyList]);

  const [session, setSession] = useState({
    isAuthed: false,
    email: "",
    displayName: "",
  });
  const [activeTab, setActiveTab] = useState("home");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [productDetailOpen, setProductDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const completeScanDemo = () => {
    const i = scanDemoIndexRef.current % SCAN_DEMO_PRODUCTS.length;
    scanDemoIndexRef.current += 1;
    const tpl = SCAN_DEMO_PRODUCTS[i];
    const scanned = {
      id: `scan-${Date.now()}`,
      name: tpl.name,
      score: tpl.score,
      category: tpl.category,
      date: "Şimdi",
      variant: getScoreVariant(tpl.score),
    };
    setHistoryList((prev) => [scanned, ...prev]);
    setSelectedProduct(scanned);
    setProductDetailOpen(true);
  };

  const greetingName =
    session.displayName?.trim() ||
    (session.email && session.email.includes("@")
      ? session.email.split("@")[0]
      : "Sen");

  if (!session.isAuthed) {
    return (
      <LoginScreen
        onAuthSuccess={({ email, displayName }) =>
          setSession({
            isAuthed: true,
            email: email.trim(),
            displayName: (displayName || "").trim(),
          })
        }
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.appShell}>
        <View style={styles.flex}>
          {activeTab === "home" ? (
            <HomeScreen
              recent={historyList.slice(0, 4)}
              onOpenCamera={() => setCameraOpen(true)}
              weeklySummary={weeklySummary}
              userName={greetingName}
              onPickCategory={() => setCameraOpen(true)}
              onOpenProduct={(p) => {
                setSelectedProduct(p);
                setProductDetailOpen(true);
              }}
            />
          ) : null}
          {activeTab === "history" ? (
            <HistoryScreen
              history={historyList}
              weeklySummary={weeklySummary}
              onOpenCamera={() => setCameraOpen(true)}
              onOpenProduct={(p) => {
                setSelectedProduct(p);
                setProductDetailOpen(true);
              }}
            />
          ) : null}
          {activeTab === "profile" ? (
            <ProfileScreen
              userEmail={session.email}
              userName={greetingName}
              onLogout={() =>
                setSession({ isAuthed: false, email: "", displayName: "" })
              }
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
          completeScanDemo();
        }}
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
  authCardTitle: {
    color: TOKENS.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.2,
    marginBottom: 14,
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
  authModeSwitch: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  authModeSwitchText: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  authModeSwitchMuted: {
    color: TOKENS.textSecondary,
    fontWeight: "600",
  },
  authModeSwitchAccent: {
    color: TOKENS.primary,
    fontWeight: "800",
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

  emptyStateBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  emptyStateIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(100, 116, 139, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyStateBody: {
    color: TOKENS.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    fontWeight: "600",
    maxWidth: 320,
  },
  emptyStateCta: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "rgba(5, 150, 105, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.22)",
  },
  emptyStateCtaText: {
    color: TOKENS.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  historyEmptyScroll: {
    flexGrow: 1,
    paddingBottom: 118,
  },

  profileHeroCard: {
    padding: 20,
    borderRadius: 24,
  },
  profileHeroName: {
    color: TOKENS.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  profilePrefsCard: {
    padding: 20,
    borderRadius: 24,
  },
  profileSectionTitle: {
    color: TOKENS.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.1,
    marginBottom: 8,
  },
  profileSectionHint: {
    color: TOKENS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  profileLabel: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  profileValue: {
    color: TOKENS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(100, 116, 139, 0.18)",
  },
  preferenceRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  preferenceTextCol: {
    flex: 1,
    paddingRight: 8,
    gap: 4,
  },
  preferenceLabel: {
    color: TOKENS.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  preferenceSub: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
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
    width: 248,
    padding: 20,
    borderRadius: 16,
  },
  recentTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(5, 150, 105, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.22)",
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
    padding: 20,
    borderRadius: 20,
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
  weeklyMiniRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingTop: 14,
  },
  weeklyMiniItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  weeklyMiniLabel: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  weeklyMiniValue: {
    color: TOKENS.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  historyRow: {
    padding: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(5, 150, 105, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.22)",
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
    overflow: "hidden",
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
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
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(100, 116, 139, 0.35)",
    marginBottom: 14,
  },
  bottomSheetScrollFlex: {
    flex: 1,
  },
  bottomSheetScroll: {
    paddingBottom: 24,
    gap: 16,
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
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(5, 150, 105, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.22)",
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
  modalSubTight: {
    marginTop: 4,
  },
  modalCategory: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: TOKENS.primary,
    letterSpacing: 0.2,
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
    padding: 18,
    borderRadius: 16,
    backgroundColor: "rgba(5, 150, 105, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.14)",
    gap: 10,
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
    fontSize: 12,
    lineHeight: 18,
    paddingTop: 6,
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

