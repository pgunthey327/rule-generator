import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { GitHubService, type GitHubBranch } from '../services/githubService';
import { logService } from '../services/logService';
import '../styles/GitHubIntegration.css';

export const GitHubIntegration = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setGitHubConfig = useAppStore((state) => state.setGitHubConfig);

  const handleFetchBranches = async () => {
    if (!repoUrl) {
      logService.warning(`GitHub configuration incomplete`, `Missing repo URL`);
      setError('Please enter repository URL');
      return;
    }

    logService.debug(`Fetching GitHub branches`, `Repo: ${repoUrl}`);
    setLoading(true);
    setError('');

    try {
      const service = new GitHubService();
      const parsed = service.parseRepoUrl(repoUrl);

      if (!parsed) {
        logService.error(`Invalid GitHub URL`, `Cannot parse: ${repoUrl}`);
        throw new Error('Invalid GitHub URL format');
      }

      const fetchedBranches = await service.getBranches(parsed.owner, parsed.repo);
      logService.success(`GitHub branches fetched`, `Found ${fetchedBranches.length} branches`);
      setBranches(fetchedBranches);
      setGitHubConfig({
        repoUrl,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch branches';
      logService.error(`GitHub fetch failed`, errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="github-integration">
      <h2>GitHub Repository Integration</h2>

      <div className="github-section">
        <h3>Repository Configuration</h3>
        <div className="form-group">
          <label htmlFor="repo-url">Repository URL</label>
          <input
            id="repo-url"
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="form-input"
          />
        </div>

        <button onClick={handleFetchBranches} disabled={loading} className="btn btn-primary">
          {loading ? 'Loading...' : 'Fetch Branches'}
        </button>
      </div>

      {branches.length > 0 && (
        <div className="github-section">
          <h3>Select Branch</h3>
          <div className="form-group">
            <label htmlFor="branch-select">Branch</label>
            <select
              id="branch-select"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="form-input"
            >
              <option value="">-- Select Branch --</option>
              {branches.map((branch) => (
                <option key={branch.name} value={branch.name}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};
