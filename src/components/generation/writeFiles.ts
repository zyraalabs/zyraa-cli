import ora from "ora";
import { terminal } from "../../lib/terminal.js";
import { parseGenerateResponse } from "../../lib/parser.js";
import { writeFiles } from "../../lib/fileWriter.js";

export function writeGeneratedFiles(
  output: string,
  targetDir: string,
  wasScaffolded: boolean
): void {
  const parsed = parseGenerateResponse(output);

  if (parsed.files.length === 0) {
    terminal.warn("No files found in the generated output");
    terminal.newLine();
    terminal.dim("The AI response did not contain any file blocks");
    terminal.newLine();
    process.exit(1);
  }

  const spinner = ora(`Writing ${parsed.files.length} files...`).start();
  const result = writeFiles(parsed.files, targetDir);

  spinner.succeed(
    `${wasScaffolded ? "Updated/created" : "Created"} ${result.created.length} files`
  );
  terminal.newLine();

  terminal.section(wasScaffolded ? "Files created/updated" : "Files created");
  result.created.forEach((filePath) => terminal.success(filePath));

  if (result.failed.length > 0) {
    terminal.newLine();
    terminal.section("Failed to create");
    result.failed.forEach((fail) =>
      terminal.error(`${fail.path}: ${fail.error}`)
    );
  }

  terminal.newLine();

  if (parsed.explanation) {
    terminal.separator();
    terminal.newLine();
    terminal.dim(parsed.explanation);
    terminal.newLine();
  }
}
