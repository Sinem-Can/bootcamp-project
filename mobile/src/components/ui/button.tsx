import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { colors, radii, spacing } from "../../theme/tokens";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "surface";
  style?: ViewStyle;
};

export function Button({ label, onPress, disabled, variant = "primary", style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.surface,
        (disabled || pressed) && { opacity: disabled ? 0.5 : 0.85 },
        style,
      ]}
    >
      <Text style={[styles.label, variant === "primary" ? styles.primaryLabel : styles.surfaceLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[16],
    borderRadius: radii.button,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.primary,
  },
  surface: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryLabel: {
    color: colors.surface,
  },
  surfaceLabel: {
    color: colors.textPrimary,
  },
});

