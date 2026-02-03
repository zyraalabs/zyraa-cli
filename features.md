User Input
↓
┌──────────────────────────────────────────────┐
│ "zyraa 'Build a todo app'" │
└──────────────────────────────────────────────┘
↓
┌──────────────────────────────────────────────┐
│ detectFramework() → "nextjs" │
└──────────────────────────────────────────────┘
↓
┌──────────────────────────────────────────────┐
│ generateCode() │
│ → API call to backend │
│ → Backend uses Claude AI │
└──────────────────────────────────────────────┘
↓
┌──────────────────────────────────────────────┐
│ Backend Response (XML format): │
│ <file path="...">content</file> │
│ <file path="...">content</file> │
│ <explanation>...</explanation> │
└──────────────────────────────────────────────┘
↓
┌──────────────────────────────────────────────┐
│ parseGenerateResponse() │
│ → Regex extract all <file> tags │
│ → Extract explanation │
│ → Return array of {path, content} │
└──────────────────────────────────────────────┘
↓
┌──────────────────────────────────────────────┐
│ writeFiles() │
│ → For each file: │
│ ✓ Check path security │
│ ✓ Create directories │
│ ✓ Write content to disk │
└──────────────────────────────────────────────┘
↓
┌──────────────────────────────────────────────┐
│ Display Results │
│ ✓ src/app/page.tsx │
│ ✓ src/components/TodoList.tsx │
│ → Show explanation │
└──────────────────────────────────────────────┘
