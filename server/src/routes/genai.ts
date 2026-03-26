import { Router, Request, Response } from 'express';
import { simpleGit } from "simple-git";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from 'url';

const router = Router();

interface OIDExtractResponse {
  oids: string[];
  ugc: string;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * POST /api/genai/extract-oids-ugc
 * Extract UGC and OIDs from spydrRule data using Gen AI
 */
router.post('/extract-oids-ugc', async (req: Request, res: Response) => {
  const { spydrRule } = req.body;

  if (!spydrRule) {
    return res.status(400).json({ error: 'Missing spydrRule' });
  }

  try {
    const prompt = `Extract the ugc (UnderWriting Group Code) and all unique OID (Object Identifier) values from the data below.

DATA:
${JSON.stringify(spydrRule)}

REQUIRED OUTPUT (raw JSON only, no explanation):
{"oids":["OID1","OID2"],"ugc":"ugc1"}`;

    const raw = await callAI(prompt);
    const result = parseJSON<OIDExtractResponse>(raw);
    return res.json(result);
  } catch (error) {
    console.error('Error extracting OIDs:', error);
    return res.status(500).json({ error: 'Failed to extract OIDs' });
  }
});

/**
 * POST /api/genai/generate-code
 * Generate / update code based on template and rules, then push to a new branch.
 */
router.post('/generate-code', async (req: Request, res: Response) => {
  try {
    const { context } = req.body;
    const { helperFiles, repoFiles, tempDir } = await fetchRepoFiles(context);
    const CHUNK_SIZE = 20;

    const attributeNamePaths: string[] = context.filteredOsari.map((item: any) => item.path);
    const UpdatedFilesWithPath: Array<Record<string, string>> = [];

    for (let i = 0; i < repoFiles.length; i += CHUNK_SIZE) {
      const chunk = repoFiles.slice(i, i + CHUNK_SIZE);
      console.log(`Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1} of ${Math.ceil(repoFiles.length / CHUNK_SIZE)}...`);

      const prompt = `You are a code generation engine. Update the files in FilesWithPath according to the instructions below.

INSTRUCTIONS:
1. Read FunctionDefinition and implement its logic in the file named by FunctionFileName inside FilesWithPath.
2. Use helper functions from HelpersWithPath where applicable.
3. Reuse attributes listed in AttributeNamePath; create new ones only when necessary, following existing naming conventions.
4. Keep the coding style consistent with the existing file content.
5. Return ALL files from FilesWithPath — modified or not — in the exact response format below.

CONTEXT:
FilesWithPath: ${JSON.stringify(chunk)}
HelpersWithPath: ${JSON.stringify(helperFiles)}
FunctionDefinition: ${JSON.stringify(context?.spydrRule)}
AttributeNamePath: ${JSON.stringify(attributeNamePaths)}
FunctionFileName: ${JSON.stringify(context?.ugc)}

REQUIRED OUTPUT (raw JSON only, no explanation, no markdown):
[{"<path1>":"<filecontent1>"},{"<path2>":"<filecontent2>"}]`;

      const UpdatedChunk = await callAI(prompt);
      UpdatedFilesWithPath.push(...parseJSON<Array<Record<string, string>>>(UpdatedChunk));
      console.log(`Chunk ${Math.floor(i / CHUNK_SIZE) + 1} done.`);
    }

    console.log('All chunks processed. Reconstructing repo and pushing to new branch...');
    const newBranch = await reconstructAndPushRepo(UpdatedFilesWithPath, context, tempDir);
    console.log(`Successfully pushed to branch: ${newBranch}`);

    return res.json({ files: UpdatedFilesWithPath, branch: newBranch });
  } catch (error) {
    console.error('Error generating code:', error);
    return res.status(500).json({ error: 'Failed to generate code' });
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Call the Anthropic Claude API and return the raw text response.
 */
async function callAI(prompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 8192,
      temperature: 0,
      system:
        'You are a strict JSON API. Always respond with ONLY valid raw JSON — no markdown, no code fences, no explanation, no comments.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI API error ${response.status}: ${err}`);
  }

  const raw: any = await response.json();
  const text: string = raw?.content?.[0]?.text ?? '';

  // Strip accidental markdown fences as a safety net
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

/**
 * Safely parse JSON with a meaningful error.
 */
function parseJSON<T = any>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    console.error('Failed to parse AI response as JSON:', text);
    throw new Error('AI returned non-JSON response');
  }
}

/**
 * Clone a GitHub repository and return its files split into repo files and helper files,
 * along with the path to the local clone so callers can write back changes.
 */
async function fetchRepoFiles(context: any): Promise<{
  repoFiles: Array<{ path: string; content: string }>;
  helperFiles: Array<{ path: string; content: string }>;
  tempDir: string;
}> {
  const { ruleBranch, ruleRepoUrl } = context;
  const githubToken = process.env.GITHUB_TOKEN;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const TEMP_DIR = path.join(__dirname, 'repo');

  const repoUrl = githubToken
    ? ruleRepoUrl.replace('https://github.com/', `https://${githubToken}@github.com/`)
    : ruleRepoUrl;

  try {
    const git = simpleGit();
    await fs.remove(TEMP_DIR);

    console.log('Cloning repository...');
    await git.clone(repoUrl, TEMP_DIR, ['--branch', ruleBranch ?? 'main', '--depth', '1']);

    const repoGit = simpleGit(TEMP_DIR);
    const filesRaw = await repoGit.raw(['ls-files']);
    const files = filesRaw.split('\n').filter(Boolean);

    console.log(`Found ${files.length} files`);

    const repoFiles: Array<{ path: string; content: string }> = [];
    const helperFiles: Array<{ path: string; content: string }> = [];

    for (const file of files) {
      const content = await fs.readFile(path.join(TEMP_DIR, file), 'utf-8');
      const entry = { path: file, content };
      repoFiles.push(entry);
      if (file.includes('helpers')) {
        helperFiles.push(entry);
      }
    }

    return { repoFiles, helperFiles, tempDir: TEMP_DIR };
  } catch (error) {
    await fs.remove(TEMP_DIR).catch(() => {});
    console.error('Error fetching repository files:', error);
    throw error;
  }
}

/**
 * Write the AI-updated files back into the cloned repo, create a new branch,
 * commit all changes, and push to the remote.
 *
 * @param updatedFiles - Array of `{ "<filePath>": "<fileContent>" }` objects from the AI.
 * @param context      - Original request context (used for repo URL and branch naming).
 * @param tempDir      - Path to the local clone produced by fetchRepoFiles.
 * @returns The name of the newly created remote branch.
 */
async function reconstructAndPushRepo(
  updatedFiles: Array<Record<string, string>>,
  context: any,
  tempDir: string,
): Promise<string> {
  const { ruleRepoUrl, ugc } = context;
  const githubToken = process.env.GITHUB_TOKEN;

  const newBranch = `generated/${ugc ?? 'code'}-${Date.now()}`;

  // 1. Write every updated file back into the working tree.
  for (const fileObj of updatedFiles) {
    for (const [filePath, content] of Object.entries(fileObj)) {
      const fullPath = path.join(tempDir, filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content, 'utf-8');
    }
  }

  // 2. Checkout a new branch, stage everything, and commit.
  const repoGit = simpleGit(tempDir);
  await repoGit.checkoutLocalBranch(newBranch);
  await repoGit.add('.');
  await repoGit.commit(`chore: generated code for ${ugc ?? 'rule'}`);

  // 3. Push the new branch to the remote (inject token when available).
  const pushUrl = githubToken
    ? ruleRepoUrl.replace('https://github.com/', `https://${githubToken}@github.com/`)
    : ruleRepoUrl;

  await repoGit.push(pushUrl, newBranch);

  // 4. Clean up the local clone now that the push succeeded.
  await fs.remove(tempDir).catch(() => {});

  return newBranch;
}

export default router;
