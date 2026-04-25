import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radii, spacing } from "../../theme/tokens";

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string | null;
  keyboardType?: "default" | "email-address" | "number-pad";
};

export function TextField({ label, value, onChangeText, placeholder, secureTextEntry, error, keyboardType }: Props) {
  return (
    <View style={{ gap: spacing[8] }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={[styles.input, !!error && styles.inputError]}
        placeholderTextColor={colors.textSecondary}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[16],
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
  },
});

