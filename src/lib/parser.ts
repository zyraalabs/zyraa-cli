export interface ParsedFile {
  path: string;
  content: string;
}

export interface ParseResult {
  files: ParsedFile[];
  explanation: string | null;
}
/** 
 What the generated response looks like after parser processes it:
{
  files: [
    {
      path: "src/app/page.tsx",
      content: "export default function Home() {\n  return <div>Todo App</div>;\n}"
    },
    {
      path: "src/components/TodoList.tsx", 
      content: "export function TodoList() {\n  return <ul>...</ul>;\n}"
    }
  ],
  explanation: "Run 'pnpm install' to install dependencies..."
}
*/

export function parseGenerateResponse(raw: string): ParseResult {
  const fileRegex = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g;
  const files: ParsedFile[] = Array.from(raw.matchAll(fileRegex), (match) => ({
    path: match[1].trim(),
    content: match[2].replace(/^\n|\n$/g, ""),
  }));

  const explanationMatch = raw.match(/<explanation>([\s\S]*?)<\/explanation>/);
  const explanation = explanationMatch?.[1].trim() ?? null;

  return { files, explanation };
}
