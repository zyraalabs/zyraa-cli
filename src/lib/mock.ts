import type { GenerateResult } from "../api/endpoints/generate.js";
import type { DetectionResult } from "../components/generation/detectFramework.js";

export const IS_MOCK = process.env.ZYRA_MOCK === "true";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const MOCK_DETECTION: DetectionResult = {
  framework: "nextjs",
  reasoning: "Full-stack React framework",
  needsScaffold: false,
  scaffoldCommand: "",
};

const MOCK_OUTPUT = `<file path="package.json">
{
  "name": "generated-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.4.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^19",
    "tailwindcss": "^4"
  }
}
</file>
<file path="src/app/layout.tsx">
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Generated App" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
</file>
<file path="src/app/page.tsx">
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold tracking-tight">Hello from Zyraa</h1>
      <p className="mt-4 text-lg text-gray-500">Your app was generated successfully.</p>
    </main>
  );
}
</file>
<file path="src/app/globals.css">
@import "tailwindcss";
</file>
<file path="tsconfig.json">
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
</file>`;

export async function streamMockOutput(onChunk: (text: string) => void): Promise<GenerateResult> {
  await sleep(400);

  for (let i = 0; i < MOCK_OUTPUT.length; i += 8) {
    onChunk(MOCK_OUTPUT.slice(i, i + 8));
    await sleep(12);
  }

  return {
    output: MOCK_OUTPUT,
    usage: { inputTokens: 1024, outputTokens: 4096 },
    generationId: "mock-generation-id",
  };
}
