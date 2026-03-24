import axios from 'axios';

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
  private serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

  constructor() {
    // No need to store token - server handles it
  }

  async getRuleRepos(): Promise<string[]> {
    try {
      const response = await axios.post(`${this.serverUrl}/api/github/rule-repos`);
      return response.data;
    } catch (error) {
      console.error('Error fetching rule repos:', error);
      throw new Error('Failed to fetch rule repos from GitHub');
    }
  }

    async getServiceRepos(): Promise<string[]> {
    try {
      const response = await axios.post(`${this.serverUrl}/api/github/service-repos`);
      return response.data;
    } catch (error) {
      console.error('Error fetching service repos:', error);
      throw new Error('Failed to fetch service repos from GitHub');
    }
  }

  async getBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
    try {
      const response = await axios.post(`${this.serverUrl}/api/github/branches`, {
        owner,
        repo,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw new Error('Failed to fetch branches from GitHub');
    }
  }

    async getServiceBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
    try {
      const response = await axios.post(`${this.serverUrl}/api/github/service-branches`, {
        owner,
        repo,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching service branches:', error);
      throw new Error('Failed to fetch service branches from GitHub');
    }
  }

  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    branch: string = 'main'
  ): Promise<string> {
    try {
      const response = await axios.post(`${this.serverUrl}/api/github/file-content`, {
        owner,
        repo,
        path,
        branch,
      });
      return response.data.content;
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
      const response = await axios.post(`${this.serverUrl}/api/github/list-files`, {
        owner,
        repo,
        folderPath,
        branch,
      });
      return response.data;
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
      const response = await axios.post(`${this.serverUrl}/api/github/find-file`, {
        owner,
        repo,
        filename,
      });
      return response.data.path || null;
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
      await axios.post(`${this.serverUrl}/api/github/commit-and-push`, {
        owner,
        repo,
        filePath,
        content,
        message,
        branch,
      });
      return true;
    } catch (error) {
      console.error('Error committing changes:', error);
      throw new Error('Failed to commit and push code');
    }
  }

  parseRuleRepoUrl(url: string): { owner: string; repo: string } | null {
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

  parseServiceRepoUrl(url: string): { owner: string; repo: string } | null {
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