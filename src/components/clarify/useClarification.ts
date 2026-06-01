import { useState, useEffect } from "react";
import { callClarify } from "../../api/endpoints/clarify.js";
import { readZyraaMd } from "../../lib/fileReader.js";
import type { ClarifyQuestion } from "../../lib/types.js";

interface UseClarificationOptions {
  isReprompt?: boolean;
  framework?: string;
}

interface UseClarificationResult {
  loading: boolean;
  questions: ClarifyQuestion[];
  needsClarification: boolean;
  error: boolean;
}

export function useClarification(prompt: string, options: UseClarificationOptions = {}): UseClarificationResult {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<ClarifyQuestion[]>([]);
  const [needsClarification, setNeedsClarification] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const zyraaMdContent = readZyraaMd(process.cwd()) ?? undefined;
    callClarify(prompt, {
      mode: options.isReprompt ? "reprompt" : "generate",
      framework: options.framework,
      zyraaMdContent,
    })
      .then((data) => {
        setNeedsClarification(data.needsClarification);
        setQuestions(data.questions);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { loading, questions, needsClarification, error };
}
