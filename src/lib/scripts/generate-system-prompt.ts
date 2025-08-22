import { writeFile } from "node:fs/promises";
import path from "node:path";
import fs from "node:fs";

// Use native fetch in Node 18+; otherwise, fall back to node-fetch if needed
// Remove 'import fetch from "node-fetch";' if running in Node 18+

type NpmVersionResponse = { version?: string };

async function fetchLatestVersion(pkgName: string): Promise<string> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${pkgName}/latest`);
    const data = (await res.json()) as NpmVersionResponse;
    if (data && typeof data.version === "string") {
      return data.version;
    }
    return "unknown";
  } catch (error) {
    console.error(`Failed to fetch version for ${pkgName}:`, error);
    return "unknown";
  }
}

async function generateSystemPrompt(): Promise<void> {
  const today = new Date();
  const currentYear = today.getFullYear();

  const [reactVersion, nextVersion] = await Promise.all([
    fetchLatestVersion("react"),
    fetchLatestVersion("next"),
  ]);

  const basePath = path.join(process.cwd(), "lib", "documents", "prompts");

  const systemPromptBase = fs.readFileSync(
    path.join(basePath, "system-prompt-base.txt"),
    "utf8"
  );

  const systemPromptFinal = systemPromptBase
    .replace(/{{YEAR}}/g, `${currentYear}`)
    .replace(/{{REACT_VERSION}}/g, `${reactVersion}`)
    .replace(/{{NEXT_VERSION}}/g, `${nextVersion}`);

  const outputPath = path.join(basePath, "system-prompt.txt");

  await writeFile(outputPath, systemPromptFinal.trim(), "utf8");

      // console.log(`✅ System prompt generated successfully at ${outputPath}`);
}

generateSystemPrompt().catch((err) => {
  console.error("Failed to generate system prompt:", err);
  process.exit(1);
});
