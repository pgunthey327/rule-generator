import axios from 'axios';
import { encode, decode } from 'js-base64';

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
}

export interface GitHubFile {
  name: string;
  path: string;
  content: string;
}

export class GitHubService {
  private token: string;
  private baseURL = 'https://api.github.com';

  constructor(token: string) {
    this.token = token;
  }

  private getHeaders() {
    return {
      Authorization: `token ${this.token}`,
      Accept: 'application/vnd.github.v3+json',
    };
  }

  async getBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
    try {
      const response = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}/branches`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw new Error('Failed to fetch branches from GitHub');
    }
  }

  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    branch: string = 'main'
  ): Promise<string> {
    try {
      const response = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
        { headers: this.getHeaders() }
      );
      const content = response.data.content;
      return decode(content);
    } catch (error) {
      console.error('Error fetching file:', error);
      throw new Error(`Failed to fetch file: ${path}`);
    }
  }

  async listFilesInFolder(
    owner: string,
    repo: string,
    folderPath: string,
    branch: string = 'main'
  ): Promise<GitHubFile[]> {
    try {
      const response = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}/contents/${folderPath}?ref=${branch}`,
        { headers: this.getHeaders() }
      );

      const files: GitHubFile[] = [];
      for (const item of response.data) {
        if (item.type === 'file') {
          const content = await this.getFileContent(owner, repo, item.path, branch);
          files.push({
            name: item.name,
            path: item.path,
            content,
          });
        }
      }
      return files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('Failed to list files in folder');
    }
  }

  async findFile(
    owner: string,
    repo: string,
    filename: string
  ): Promise<string | null> {
    try {
      const query = `repo:${owner}/${repo} filename:${filename}`;
      const response = await axios.get(
        `${this.baseURL}/search/code?q=${encodeURIComponent(query)}`,
        { headers: this.getHeaders() }
      );

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].path;
      }
      return null;
    } catch (error) {
      console.error('Error finding file:', error);
      return null;
    }
  }

  async commitAndPush(
    owner: string,
    repo: string,
    filePath: string,
    content: string,
    message: string,
    branch: string = 'main'
  ): Promise<boolean> {
    try {
      const currentFile = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
        { headers: this.getHeaders() }
      );

      const sha = currentFile.data.sha;
      const encodedContent = encode(content);

      await axios.put(
        `${this.baseURL}/repos/${owner}/${repo}/contents/${filePath}`,
        {
          message,
          content: encodedContent,
          sha,
          branch,
        },
        { headers: this.getHeaders() }
      );

      return true;
    } catch (error) {
      console.error('Error committing changes:', error);
      throw new Error('Failed to commit and push code');
    }
  }

  parseRepoUrl(url: string): { owner: string; repo: string } | null {
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return {
          owner: parts[0],
          repo: parts[1].replace('.git', ''),
        };
      }
    } catch (error) {
      console.error('Invalid GitHub URL:', error);
    }
    return null;
  }
}
