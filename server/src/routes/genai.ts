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

      const prompt = `You are a deterministic code generation engine. Process the inputs below and return ALL files in the required output format.

━━━ RULES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULE 1 — TARGET FILE RESOLUTION
  a. Search FilesWithPath for a file whose name matches FunctionFileName.
  b. IF a match is found  → implement FunctionDefinition inside that file; do NOT create or modify any other file.
  c. IF no match is found → create a new file named exactly FunctionFileName:
       • Implement FunctionDefinition in this new file only.
       • Find the existing file in FilesWithPath most similar in name or functionality.
       • Place the new file in that file's directory and construct its full path accordingly.
       • File content must contain only the implemented function — no prose or extra comments.
       • Leave every existing file unchanged.

RULE 2 — HELPERS
  • Reuse functions from HelpersWithPath wherever applicable.
  • Do NOT duplicate helper logic inline.

RULE 3 — ATTRIBUTES
  • Prefer attribute paths listed in AttributeNamePath.
  • Create new attributes only when strictly required, following existing naming conventions.

RULE 4 — CODING STYLE
  • Match the indentation, formatting, and code style of each file exactly.

RULE 5 — OUTPUT COMPLETENESS
  • Return EVERY file from FilesWithPath — modified, newly created, or unchanged.
  • Do NOT omit any file.

━━━ INPUT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FilesWithPath:      ${JSON.stringify(chunk)}
HelpersWithPath:    ${JSON.stringify(helperFiles)}
FunctionDefinition: ${JSON.stringify(context?.spydrRule)}
AttributeNamePath:  ${JSON.stringify(attributeNamePaths)}
FunctionFileName:   ${JSON.stringify(context?.ugc)}

━━━ REQUIRED OUTPUT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Raw JSON array only — no markdown, no code fences, no explanation.
Each element is a single-key object: { "<filePath>": "<fullFileContent>" }.
Every file in FilesWithPath must appear as its own element.

[{"<path1>":"<filecontent1>"},{"<path2>":"<filecontent2>"}]`;

      const UpdatedChunk = await callAI(prompt);
      UpdatedFilesWithPath.push(...parseJSON<Array<Record<string, string>>>(UpdatedChunk));
      console.log(`Chunk ${Math.floor(i / CHUNK_SIZE) + 1} done.`);
    }

    console.log('All chunks processed. Reconstructing repo and pushing to new branch...');
    const { branch: newBranch, prUrl } = await reconstructAndPushRepo(UpdatedFilesWithPath, context, tempDir);
    console.log(`Successfully pushed to branch: ${newBranch}`);
    console.log(`Pull request raised: ${prUrl}`);

    return res.json({ files: UpdatedFilesWithPath, branch: newBranch, prUrl });
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
 * commit all changes, push to the remote, and open a pull request targeting
 * `context.ruleRepoBranch`.
 *
 * @param updatedFiles - Array of `{ "<filePath>": "<fileContent>" }` objects from the AI.
 * @param context      - Original request context (used for repo URL, branch naming, and PR base).
 * @param tempDir      - Path to the local clone produced by fetchRepoFiles.
 * @returns An object containing the new branch name and the URL of the created PR.
 */
async function reconstructAndPushRepo(
  updatedFiles: Array<Record<string, string>>,
  context: any,
  tempDir: string,
): Promise<{ branch: string; prUrl: string }> {
  const { ruleRepoUrl, ruleRepoBranch, ugc } = context;
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

  // 5. Raise a pull request from the new branch to ruleRepoBranch via the GitHub API.
  const prUrl = await createPullRequest({
    repoUrl: ruleRepoUrl,
    headBranch: newBranch,
    baseBranch: ruleRepoBranch ?? 'main',
    title: `chore: generated code for ${ugc ?? 'rule'}`,
    body: `Auto-generated PR for UGC \`${ugc ?? 'rule'}\`.\n\nSource branch: \`${newBranch}\``,
    githubToken,
  });

  return { branch: newBranch, prUrl };
}

/**
 * Create a GitHub pull request using the REST API.
 *
 * @returns The HTML URL of the created pull request.
 */
async function createPullRequest(options: {
  repoUrl: string;
  headBranch: string;
  baseBranch: string;
  title: string;
  body: string;
  githubToken: string | undefined;
}): Promise<string> {
  const { repoUrl, headBranch, baseBranch, title, body, githubToken } = options;

  // Derive "{owner}/{repo}" from the GitHub URL (strips optional .git suffix).
  const match = repoUrl.match(/github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?$/);
  if (!match) {
    throw new Error(`Cannot parse GitHub owner/repo from URL: ${repoUrl}`);
  }
  const ownerRepo = match[1];

  const apiUrl = `https://api.github.com/repos/${ownerRepo}/pulls`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
      ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
    },
    body: JSON.stringify({ title, body, head: headBranch, base: baseBranch }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GitHub PR creation failed (${response.status}): ${err}`);
  }

  const pr: any = await response.json();
  console.log(`Pull request created: ${pr.html_url}`);
  return pr.html_url as string;
}

export default router;
