export interface TokenPayload {
  userId: string;
  email: string;
  apiEndpoint: string;
  permissions: string[];
  exp: number;
}

export interface ClarifyOption {
  label: string;
  description?: string;
}

export interface ClarifyQuestion {
  id: string;
  question: string;
  category: "theme" | "features" | "env" | "style" | "technical";
  options: ClarifyOption[];
}

export interface QuestionAnswer {
  questionId: string;
  question: string;
  value: string | null;
}
