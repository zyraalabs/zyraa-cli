import { useState, useEffect } from "react";
import { callClarify } from "../../api/endpoints/clarify.js";
import type { ClarifyQuestion } from "../../lib/types.js";

interface UseClarificationResult {
  loading: boolean;
  questions: ClarifyQuestion[];
  needsClarification: boolean;
  error: boolean;
}

export function useClarification(prompt: string): UseClarificationResult {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<ClarifyQuestion[]>([]);
  const [needsClarification, setNeedsClarification] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    callClarify(prompt)
      .then((data) => {
        setNeedsClarification(data.needsClarification);
        setQuestions(data.questions);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { loading, questions, needsClarification, error };
}
