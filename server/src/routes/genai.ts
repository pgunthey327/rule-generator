import { Router, Request, Response } from 'express';
import { simpleGit } from "simple-git";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from 'url';


const OLLAMA_URL = "http://localhost:11434/api/generate";

interface OIDExtractResponse {
  oids: string[];
  explanation: string;
}

interface AIResponse {
  code: string;
  explanation: string;
}

const router = Router();

/**
 * POST /api/genai/extract-oids
 * Extract OIDs from Excel data using Gen AI
 */
router.post('/extract-oids-ugc', async (req: Request, res: Response) => {
  try {
    // return res.json({ oids: ['X58231'], ugc: '10000016' });
    const { spydrRule } = req.body;

    if (!spydrRule) {
      return res.status(400).json({ error: 'Missing spydrRule' });
    }

    const prompt = `
      Analyze the following Excel data and extract ugc (UnderWriting Group Code) and all unique OID (Object Identifier) values.
      Return them as a JSON array with "ugc" and "oids" keys.
      
      Data:
      ${JSON.stringify(spydrRule, null, 2)}
      
      Response format:
      {
        "oids": ["OID1", "OID2", ...],
        "ugc": "ugc1"
      }
    `;

    const response = await callAI(prompt);
    console.log('Raw AI response:', response);
    const result = JSON.parse(response) as OIDExtractResponse;
    
    return res.json(result);
  } catch (error) {
    console.error('Error extracting OIDs:', error);
    return res.status(500).json({ error: 'Failed to extract OIDs from Excel' });
  }
});

/**
 * POST /api/genai/generate-code
 * Generate code based on template and rules
 */
router.post('/generate-code', async (req: Request, res: Response) => {
  try {
    const { context } = req.body;
    const {helperFiles, repoFiles} = await fetchRepoFiles(context);
    const chunkSize: number  = 20;

    const newRepoFiles = [];
    const AttributeNamesPath = context.filteredOsari.map((item: any) => {
      return item.path;
    });

    for (let i: number = 0; i < repoFiles.length; i += chunkSize) {
      const chunk = repoFiles.slice(i, i + chunkSize);
      console.log(`Processing chunk ${i / chunkSize + 1}...`);

      const inputContext = {
          'FilesWithPath': JSON.stringify(chunk, null, 2),
          'HelpersWithPath': JSON.stringify(helperFiles, null, 2),
          'FunctionDefinition': JSON.stringify(context?.spydrRule, null, 2),
          'AttributeNamePath': JSON.stringify(AttributeNamesPath, null, 2),
          'FunctionFileName': JSON.stringify(context?.ugc, null, 2)
      }

      const prompt = `
        You are a code assistant. Using the context provided below, perform the following tasks:
          1) Read the function definition from FunctionDefinition.
          2) Locate the file named in FunctionFileName and update the function’s implementation in FileswithPath based on the logic defined in FunctionDefinition.
          3) Use helper functions if available in HelpersWithPath to simplify or optimize the function.
          4) Manage attributes:
          5) Use existing attributes from Paths listed in AttributeNamesPath.
          6) Create any new attributes required by the function if they do not already exist.
          7) Ensure new attribute names are meaningful and follow the existing naming conventions.
          8) Ensure the function logic aligns with the context provided in FunctionDefinition.
          9) Maintain coding style consistent with the file content.
          10)Return the updated FilesWithPath, in the same format it is present in context.

          CONTEXT:
          ${JSON.stringify(inputContext, null, 2)}
    `;

    console.log('Prompt sent to AI:', prompt);
      const updatedChunk = await callAI(prompt);

      // Add updated chunk to newRepoFiles
      newRepoFiles.push(updatedChunk);

      console.log('Updated chunk:', updatedChunk);
      console.log('-------------------------');
    }
    return res.json(newRepoFiles);
  } catch (error) {
    console.error('Error generating code:', error);
    return res.status(500).json({ error: 'Failed to generate code' });
  }
});

/**
 * Internal method to call AI API
 */
async function callAI(prompt: string): Promise<string> {
    const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen3:0.6b",
      prompt: prompt,
      stream: false
    })
  });

  const raw: any = await response.json();
  const resp = raw.response.replace(/^```json\s*/, '').replace(/```$/, '');
  return resp;
}

/**
 * Internal method to fetch all files from a GitHub repository using simpleGit
 */
async function fetchRepoFiles(
  context: any
): Promise<{ repoFiles: Array<{ path: string; content: string }>; helperFiles: Array<{ path: string; content: string }> }> {
  const { ruleOwner, ruleBranch, ruleRepoUrl } = context;
  const githubToken = process.env.GITHUB_TOKEN;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const TEMP_DIR = path.join(__dirname, "repo");
  const NEW_DIR = path.join(__dirname, "new-repo");
  const repoUrl = githubToken
    ? ruleRepoUrl.replace('https://github.com/', `https://${githubToken}@github.com/`)
    : ruleRepoUrl;
  
  const tempDir = path.join('/tmp', `repo-${ruleOwner}-${ruleRepoUrl}-${Date.now()}`);

  try {
  const git = simpleGit();

  await fs.remove(TEMP_DIR);
  await fs.remove(NEW_DIR);

  console.log("Cloning...");
  await git.clone(repoUrl, TEMP_DIR);

  const repoGit = simpleGit(TEMP_DIR);

  // ✅ Get all tracked files (NO recursion)
  const filesRaw = await repoGit.raw(["ls-files"]);
  const files = filesRaw.split("\n").filter(Boolean);

  console.log(`Found ${files.length} files`);

  // ✅ Build object
  const repoObject: any = [];
  const helpers: any = [];

  for (const file of files) {
    const content = await fs.readFile(path.join(TEMP_DIR, file), "utf-8");
    if(file.includes("helpers")){
      helpers.push({ path: file, content });
    }
    repoObject.push({ path: file, content });
  } 
  return { repoFiles: repoObject, helperFiles: helpers };
} catch (error) {
    // Cleanup on error
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    console.error('Error fetching repository files:', error);
    throw error;
  }
}

export default router;
