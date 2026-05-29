import { Box } from "ink";
import { OptionPicker } from "../ui/OptionPicker.js";
import type { ClarifyQuestion as ClarifyQuestionType, QuestionAnswer } from "../../lib/types.js";

interface Props {
  question: ClarifyQuestionType;
  questionIndex: number;
  totalQuestions: number;
  onAnswer: (answer: QuestionAnswer) => void;
  onSkipAll: () => void;
}

export function ClarifyQuestion({
  question,
  questionIndex,
  totalQuestions,
  onAnswer,
  onSkipAll,
}: Props) {
  function handleSelect(value: string) {
    onAnswer({
      questionId: question.id,
      question: question.question,
      value,
    });
  }

  function handleSkip() {
    onAnswer({
      questionId: question.id,
      question: question.question,
      value: null,
    });
  }

  return (
    <Box flexDirection="column">
      <OptionPicker
        question={question.question}
        questionIndex={questionIndex}
        totalQuestions={totalQuestions}
        category={question.category}
        options={question.options}
        onSelect={handleSelect}
        onSkip={handleSkip}
        onSkipAll={onSkipAll}
      />
    </Box>
  );
}
