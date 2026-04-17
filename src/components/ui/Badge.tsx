import { Text } from "ink";

type BadgeType = "success" | "error" | "warn";

const config: Record<BadgeType, { icon: string; color: string }> = {
  success: { icon: "✓", color: "#059669" },
  error:   { icon: "✗", color: "#DC2626" },
  warn:    { icon: "⚠", color: "#D97706" },
};

export function Badge({ type, label }: { type: BadgeType; label: string }) {
  const { icon, color } = config[type];
  return (
    <Text>
      <Text bold color={color}>{icon} </Text>
      <Text color={color}>{label}</Text>
    </Text>
  );
}
