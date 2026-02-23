import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "../theme/tokens";

export default function ShellCard({ title, subtitle, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: colors.panel,
    gap: spacing.sm
  },
  title: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "700"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13
  }
});
