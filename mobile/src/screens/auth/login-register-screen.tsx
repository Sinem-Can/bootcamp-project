import { useMutation } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/ui/button";
import { TextField } from "../../components/ui/text-field";
import { login, register } from "../../features/auth/auth.api";
import { useAuthStore } from "../../stores/auth.store";
import { colors, spacing } from "../../theme/tokens";

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value);
}

export function LoginRegisterScreen() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setInitialRoute = useAuthStore((s) => s.setInitialRoute);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!isValidEmail(email)) throw new Error("Geçerli bir e-posta girin.");
      if (password.length < 8) throw new Error("Şifre en az 8 karakter olmalı.");
      return mode === "login" ? login(email, password) : register(email, password);
    },
    onMutate: () => setClientError(null),
    onSuccess: async (data) => {
      setInitialRoute(mode === "register" ? "ProfileMatrix" : "Home");
      await setAccessToken(data.access_token);
    },
    onError: (err) => {
      if (err instanceof Error) setClientError(err.message);
      else setClientError("Bir hata oluştu.");
    },
  });

  const title = useMemo(() => (mode === "login" ? "Giriş" : "Kayıt Ol"), [mode]);

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <View style={{ gap: spacing[16] }}>
          <TextField
            label="E-posta"
            value={email}
            onChangeText={setEmail}
            placeholder="ornek@mail.com"
            keyboardType="email-address"
            error={email.length > 0 && !isValidEmail(email) ? "E-posta formatı hatalı." : null}
          />
          <TextField
            label="Şifre"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            error={password.length > 0 && password.length < 8 ? "Şifre en az 8 karakter olmalı." : null}
          />
          {!!clientError && <Text style={styles.error}>{clientError}</Text>}
          <Button
            label={mutation.isPending ? "Gönderiliyor..." : title}
            onPress={() => mutation.mutate()}
            disabled={mutation.isPending}
          />
          <Button
            variant="surface"
            label={mode === "login" ? "Hesabın yok mu? Kayıt Ol" : "Zaten hesabın var mı? Giriş"}
            onPress={() => setMode((m) => (m === "login" ? "register" : "login"))}
            disabled={mutation.isPending}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing[16],
    justifyContent: "center",
  },
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
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing[16],
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
});

