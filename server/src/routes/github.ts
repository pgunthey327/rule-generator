import axios from 'axios';
import { Router, Request, Response } from 'express';
import { encode, decode } from 'js-base64';

interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
}

interface GitHubFile {
  name: string;
  path: string;
  content: string;
}

const router = Router();
const baseURL = 'https://api.github.com';

/**
 * Helper function to get GitHub headers
 */
function getHeaders() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GitHub token not configured on server');
  }
  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };
}

/**
 * POST /api/github/branches
 * Get branches from a GitHub repository
 */
router.post('/branches', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.body;

    if (!owner || !repo) {
      return res.status(400).json({ error: 'Missing owner or repo' });
    }

    const response = await axios.get(
      `${baseURL}/repos/${owner}/${repo}/branches`,
      { headers: getHeaders() }
    );

    return res.json(response.data as GitHubBranch[]);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return res.status(500).json({ error: 'Failed to fetch branches from GitHub' });
  }
});

/**
 * POST /api/github/file-content
 * Get file content from GitHub
 */
router.post('/file-content', async (req: Request, res: Response) => {
  try {
    const { owner, repo, path, branch = 'main' } = req.body;

    if (!owner || !repo || !path) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const response = await axios.get(
      `${baseURL}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      { headers: getHeaders() }
    );

    const content = response.data.content;
    const decodedContent = decode(content);

    return res.json({ content: decodedContent });
  } catch (error) {
    console.error('Error fetching file:', error);
    return res.status(500).json({ error: 'Failed to fetch file from GitHub' });
  }
});

/**
 * POST /api/github/list-files
 * List files in a folder from GitHub
 */
router.post('/list-files', async (req: Request, res: Response) => {
  try {
    const { owner, repo, folderPath, branch = 'main' } = req.body;

    if (!owner || !repo || !folderPath) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const response = await axios.get(
      `${baseURL}/repos/${owner}/${repo}/contents/${folderPath}?ref=${branch}`,
      { headers: getHeaders() }
    );

    const files: GitHubFile[] = [];
    
    for (const item of response.data) {
      if (item.type === 'file') {
        const fileResponse = await axios.get(
          `${baseURL}/repos/${owner}/${repo}/contents/${item.path}?ref=${branch}`,
          { headers: getHeaders() }
        );
        const fileContent = decode(fileResponse.data.content);
        files.push({
          name: item.name,
          path: item.path,
          content: fileContent,
        });
      }
    }

    return res.json(files);
  } catch (error) {
    console.error('Error listing files:', error);
    return res.status(500).json({ error: 'Failed to list files in folder' });
  }
});

/**
 * POST /api/github/find-file
 * Search for a file in a GitHub repository
 */
router.post('/find-file', async (req: Request, res: Response) => {
  try {
    const { owner, repo, filename } = req.body;

    if (!owner || !repo || !filename) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const query = `repo:${owner}/${repo} filename:${filename}`;
    const response = await axios.get(
      `${baseURL}/search/code?q=${encodeURIComponent(query)}`,
      { headers: getHeaders() }
    );

    if (response.data.items && response.data.items.length > 0) {
      return res.json({ path: response.data.items[0].path });
    }

    return res.json({ path: null });
  } catch (error) {
    console.error('Error finding file:', error);
    return res.json({ path: null });
  }
});

/**
 * POST /api/github/commit-and-push
 * Commit and push changes to GitHub
 */
router.post('/commit-and-push', async (req: Request, res: Response) => {
  try {
    const { owner, repo, filePath, content, message, branch = 'main' } = req.body;

    if (!owner || !repo || !filePath || !content || !message) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const currentFile = await axios.get(
      `${baseURL}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
      { headers: getHeaders() }
    );

    const sha = currentFile.data.sha;
    const encodedContent = encode(content);

    await axios.put(
      `${baseURL}/repos/${owner}/${repo}/contents/${filePath}`,
      {
        message,
        content: encodedContent,
        sha,
        branch,
      },
      { headers: getHeaders() }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('Error committing changes:', error);
    return res.status(500).json({ error: 'Failed to commit and push code' });
  }
});

/**
 * POST /api/github/parse-url
 * Parse a GitHub URL
 */
router.post('/parse-url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Missing URL' });
    }

    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/').filter(Boolean);
      
      if (parts.length >= 2) {
        return res.json({
          owner: parts[0],
          repo: parts[1].replace('.git', ''),
        });
      }
    } catch (error) {
      console.error('Invalid GitHub URL:', error);
    }

    return res.status(400).json({ error: 'Invalid GitHub URL format' });
  } catch (error) {
    console.error('Error parsing URL:', error);
    return res.status(500).json({ error: 'Failed to parse URL' });
  }
});

export default router;
