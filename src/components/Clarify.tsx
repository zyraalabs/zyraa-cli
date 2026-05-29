import { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { Header } from "./ui/Header.js";
import { Spinner } from "./ui/Spinner.js";
import { Divider } from "./ui/Divider.js";
import { ClarifyQuestion } from "./clarify/ClarifyQuestion.js";
import { useClarification } from "./clarify/useClarification.js";
import { useTheme } from "./ui/ThemeContext.js";
import type { QuestionAnswer } from "../lib/types.js";

interface Props {
  prompt: string;
  onDone: (enrichedPrompt: string) => void;
}

function buildEnrichedPrompt(original: string, answers: QuestionAnswer[]): string {
  const answered = answers.filter((a) => a.value !== null);
  if (answered.length === 0) return original;
  const prefs = answered.map((a) => `${a.question}: ${a.value}`).join(". ");
  return `${original}\n\n[User preferences: ${prefs}]`;
}

export function Clarify({ prompt, onDone }: Props) {
  const theme = useTheme();
  const { loading, questions, needsClarification, error } = useClarification(prompt);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!needsClarification || questions.length === 0 || error) {
      onDone(prompt);
    }
  }, [loading, needsClarification, error]);

  function handleAnswer(answer: QuestionAnswer) {
    const updated = [...answers, answer];
    setAnswers(updated);

    if (currentIndex + 1 >= questions.length) {
      onDone(buildEnrichedPrompt(prompt, updated));
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function handleSkipAll() {
    onDone(buildEnrichedPrompt(prompt, answers));
  }

  if (loading) {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Header prompt={prompt} />
        <Box flexDirection="column" paddingX={1} gap={1}>
          <Divider />
          <Box paddingX={1}>
            <Spinner label="Refining your vision..." />
          </Box>
          <Box paddingX={2} marginTop={1}>
            <Text color={theme.fgSubtle}>
              {"Checking if we need a few quick answers before we build"}
            </Text>
          </Box>
        </Box>
      </Box>
    );
  }

  if (!needsClarification || questions.length === 0) {
    return null;
  }

  const current = questions[currentIndex];
  const answeredCount = answers.filter((a) => a.value !== null).length;

  return (
    <Box flexDirection="column" paddingY={1}>
      <Header prompt={prompt} />

      <Box flexDirection="column" paddingX={1} gap={1}>
        {/* Answered questions summary */}
        {answeredCount > 0 && (
          <Box paddingX={2} gap={2}>
            <Text color={theme.success}>{"✓"}</Text>
            <Text color={theme.fgMuted}>
              {answeredCount}{" preference"}{answeredCount !== 1 ? "s" : ""}{" set"}
            </Text>
          </Box>
        )}

        <Divider />

        <Box paddingX={1} paddingY={0}>
          <ClarifyQuestion
            question={current}
            questionIndex={currentIndex + 1}
            totalQuestions={questions.length}
            onAnswer={handleAnswer}
            onSkipAll={handleSkipAll}
          />
        </Box>
      </Box>
    </Box>
  );
}
