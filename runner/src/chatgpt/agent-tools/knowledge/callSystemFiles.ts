import fs from "fs/promises";
import path from "path";

export type SystemFileResult = {
  file: string;
  content?: string;
  error?: string;
};

const KNOWLEDGE_ROOT = path.resolve(
  __dirname,
  "agent-knowledge",
);

function resolveKnowledgeFile(
  file: string,
): string {
  if (
    !file ||
    path.isAbsolute(file) ||
    file.includes("..")
  ) {
    throw new Error(
      `Invalid system file path: ${file}`,
    );
  }

  const resolved = path.resolve(
    KNOWLEDGE_ROOT,
    file,
  );

  /*
   * Extra protection against escaping agent-knowledge/
   * through unusual path forms.
   */
  const relative = path.relative(
    KNOWLEDGE_ROOT,
    resolved,
  );

  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    throw new Error(
      `System file path escapes agent-knowledge: ${file}`,
    );
  }

  return resolved;
}

export async function callSystemFiles(
  files: string[],
): Promise<SystemFileResult[]> {
  const uniqueFiles = [
    ...new Set(
      files.map((file) => file.trim()),
    ),
  ].filter(Boolean);

  const results: SystemFileResult[] = [];

  for (const file of uniqueFiles) {
    try {
      const filePath =
        resolveKnowledgeFile(file);

      const content =
        await fs.readFile(
          filePath,
          "utf8",
        );

      results.push({
        file,
        content,
      });
    } catch (error) {
      results.push({
        file,
        error:
          error instanceof Error
            ? error.message
            : "Failed to read system file",
      });
    }
  }

  return results;
}