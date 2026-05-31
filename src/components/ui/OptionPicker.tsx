import { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { useTheme } from "./ThemeContext.js";
import { Divider } from "./Divider.js";
import type { ClarifyOption } from "../../lib/types.js";
import type { Theme } from "./theme.js";

interface CategoryMeta {
  label: string;
  colorKey: keyof Theme;
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  theme:     { label: "design",    colorKey: "brand"   },
  style:     { label: "style",     colorKey: "brand"   },
  features:  { label: "features",  colorKey: "info"    },
  env:       { label: "config",    colorKey: "warn"    },
  technical: { label: "technical", colorKey: "fgMuted" },
};

function BlinkingCursor() {
  const theme = useTheme();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  return <Text color={theme.brand}>{visible ? "▋" : " "}</Text>;
}

interface Props {
  question: string;
  questionIndex: number;
  totalQuestions: number;
  category: string;
  options: ClarifyOption[];
  onSelect: (value: string) => void;
  onSkip: () => void;
  onSkipAll: () => void;
}

export function OptionPicker({
  question,
  questionIndex,
  totalQuestions,
  category,
  options,
  onSelect,
  onSkip,
  onSkipAll,
}: Props) {
  const theme = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState("");

  const meta: CategoryMeta = CATEGORY_META[category] ?? { label: category, colorKey: "fgMuted" };
  const catColor = theme[meta.colorKey] as string;
  const totalOptions = options.length + 1; // +1 for "Write your own..."
  const isOnCustom = selectedIndex === options.length;

  useInput((char, key) => {
    // Custom text entry mode
    if (customMode) {
      if (key.escape) {
        setCustomMode(false);
        setCustomText("");
        return;
      }
      if (key.return) {
        const trimmed = customText.trim();
        if (trimmed) onSelect(trimmed);
        return;
      }
      if (key.backspace || key.delete) {
        setCustomText((prev) => prev.slice(0, -1));
        return;
      }
      if (char && !key.ctrl && !key.meta) {
        setCustomText((prev) => prev + char);
      }
      return;
    }

    // Normal navigation mode
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(totalOptions - 1, i + 1));
      return;
    }
    if (key.return) {
      if (isOnCustom) { setCustomMode(true); return; }
      onSelect(options[selectedIndex].label);
      return;
    }
    if (key.ctrl && char === "s") {
      onSkipAll();
      return;
    }
    if (char === "s" || char === "S") {
      onSkip();
      return;
    }
    const digit = parseInt(char, 10);
    if (!isNaN(digit) && digit >= 1 && digit <= totalOptions) {
      const idx = digit - 1;
      setSelectedIndex(idx);
      if (idx === options.length) setCustomMode(true);
    }
  });

  return (
    <Box flexDirection="column" gap={1}>

      {/* Step dots + category + counter */}
      <Box paddingX={2} gap={2} alignItems="center">
        <Box gap={1}>
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <Text
              key={i}
              color={
                i < questionIndex - 1
                  ? theme.success
                  : i === questionIndex - 1
                  ? theme.brand
                  : theme.fgSubtle
              }
            >
              {i < questionIndex - 1 ? "✓" : i === questionIndex - 1 ? "●" : "○"}
            </Text>
          ))}
        </Box>
        <Text color={theme.fgSubtle}>{"·"}</Text>
        <Text color={catColor} bold>{meta.label}</Text>
        <Text color={theme.fgSubtle}>{"·"}</Text>
        <Text color={theme.fgSubtle}>{questionIndex}{" of "}{totalQuestions}</Text>
      </Box>

      {/* Question text */}
      <Box paddingX={3} marginTop={1}>
        <Text color={theme.fg} bold>{question}</Text>
      </Box>

      {/* Options list */}
      <Box flexDirection="column" paddingX={1} marginTop={1}>
        {options.map((opt, i) => {
          const isSelected = i === selectedIndex && !customMode;
          return (
            <Box key={i} gap={2}>
              <Text color={isSelected ? theme.brand : theme.fgSubtle}>
                {isSelected ? "❯" : " "}
              </Text>
              <Text color={isSelected ? theme.brandLight : theme.fgSubtle} bold={isSelected}>
                {String(i + 1)}
              </Text>
              <Box flexGrow={1} gap={0}>
                <Text color={isSelected ? theme.fg : theme.fgMuted} bold={isSelected}>
                  {opt.label}
                </Text>
                {opt.description && (
                  <Text color={isSelected ? theme.fgMuted : theme.fgSubtle}>
                    {"  ·  "}{opt.description}
                  </Text>
                )}
              </Box>
            </Box>
          );
        })}

        {/* Write your own row */}
        {!customMode && (
          <Box gap={2} marginTop={1}>
            <Text color={isOnCustom ? theme.brand : theme.fgSubtle}>
              {isOnCustom ? "❯" : " "}
            </Text>
            <Text color={isOnCustom ? theme.brandLight : theme.fgSubtle} bold={isOnCustom}>
              {String(options.length + 1)}
            </Text>
            <Text color={isOnCustom ? theme.fgMuted : theme.fgSubtle}>
              {"Write your own..."}
            </Text>
          </Box>
        )}

        {/* Custom input — full width, shown below options */}
        {customMode && (
          <Box flexDirection="column" gap={1} marginTop={1}>
            <Box
              borderStyle="round"
              borderColor={theme.borderActive}
              paddingX={2}
              paddingY={0}
              width={60}
            >
              <Text color={theme.fg}>{customText || " "}</Text>
              <BlinkingCursor />
            </Box>
            <Box paddingX={1}>
              <Text color={theme.fgSubtle}>{"enter to confirm  ·  esc to cancel"}</Text>
            </Box>
          </Box>
        )}
      </Box>

      {/* Footer */}
      {!customMode && (
        <>
          <Box marginTop={1}>
            <Divider />
          </Box>
          <Box paddingX={2}>
            <Text color={theme.fgSubtle}>
              {"↑↓ navigate  ·  enter select  ·  s skip  ·  ^S skip all"}
            </Text>
          </Box>
        </>
      )}

    </Box>
  );
}
