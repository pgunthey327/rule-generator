import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { GitHubService, type GitHubBranch } from '../services/githubService';
import { logService } from '../services/logService';
import '../styles/GitHubIntegration.css';

export const GitHubIntegration = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [token, setToken] = useState('');
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [helpersContent, setHelpersContent] = useState('');
  const [ruleId, setRuleId] = useState('');
  const [rulePath, setRulePath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setGitHubConfig = useAppStore((state) => state.setGitHubConfig);

  const handleFetchBranches = async () => {
    if (!repoUrl || !token) {
      logService.warning(`GitHub configuration incomplete`, `Missing repo URL or token`);
      setError('Please enter both repository URL and token');
      return;
    }

    logService.debug(`Fetching GitHub branches`, `Repo: ${repoUrl}`);
    setLoading(true);
    setError('');

    try {
      const service = new GitHubService(token);
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
        token,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch branches';
      logService.error(`GitHub fetch failed`, errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchHelpers = async () => {
    if (!selectedBranch || !repoUrl || !token) {
      logService.warning(`GitHub helpers fetch incomplete`, `Missing branch or credentials`);
      setError('Please select a branch first');
      return;
    }

    logService.debug(`Fetching helpers file`, `Branch: ${selectedBranch}`);
    setLoading(true);
    setError('');

    try {
      const service = new GitHubService(token);
      const parsed = service.parseRepoUrl(repoUrl);

      if (!parsed) {
        throw new Error('Invalid GitHub URL format');
      }

      const files = await service.listFilesInFolder(
        parsed.owner,
        parsed.repo,
        'helpers',
        selectedBranch
      );

      const concatenatedContent = files
        .map((file) => `// File: ${file.path}\n${file.content}`)
        .join('\n\n');

      setHelpersContent(concatenatedContent);
      setGitHubConfig({
        branch: selectedBranch,
        helpers: files.map((f) => f.path),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch helpers folder');
    } finally {
      setLoading(false);
    }
  };

  const handleLocateRuleId = async () => {
    if (!ruleId || !repoUrl || !token || !selectedBranch) {
      setError('Please fill in rule ID and select a branch');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const service = new GitHubService(token);
      const parsed = service.parseRepoUrl(repoUrl);

      if (!parsed) {
        throw new Error('Invalid GitHub URL format');
      }

      const path = await service.findFile(parsed.owner, parsed.repo, `${ruleId}.js`);

      if (path) {
        setRulePath(path);
        setGitHubConfig({
          ruleId,
          rulePath: path,
        });
      } else {
        setRulePath('NA');
        setGitHubConfig({
          ruleId,
          rulePath: 'NA',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to locate rule file');
      setRulePath('NA');
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

        <div className="form-group">
          <label htmlFor="token">GitHub Personal Access Token</label>
          <input
            id="token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter your GitHub token"
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

          <button onClick={handleFetchHelpers} disabled={loading || !selectedBranch} className="btn btn-primary">
            {loading ? 'Loading...' : 'Load Helpers Folder'}
          </button>
        </div>
      )}

      {helpersContent && (
        <div className="github-section">
          <h3>Helpers Content</h3>
          <div className="content-preview">
            <pre>{helpersContent.substring(0, 500)}...</pre>
          </div>
          <p className="text-muted">{helpersContent.length} characters loaded</p>
        </div>
      )}

      {selectedBranch && (
        <div className="github-section">
          <h3>Locate Rule ID</h3>
          <div className="form-group">
            <label htmlFor="rule-id">Rule ID</label>
            <input
              id="rule-id"
              type="text"
              value={ruleId}
              onChange={(e) => setRuleId(e.target.value)}
              placeholder="Enter rule ID (e.g., RULE_001)"
              className="form-input"
            />
          </div>

          <button onClick={handleLocateRuleId} disabled={loading || !ruleId} className="btn btn-primary">
            {loading ? 'Searching...' : 'Locate Rule'}
          </button>
        </div>
      )}

      {rulePath && (
        <div className="github-section">
          <h3>Rule File Path</h3>
          <div className="form-group">
            <label htmlFor="rule-path">Path</label>
            <input
              id="rule-path"
              type="text"
              value={rulePath}
              readOnly
              className="form-input"
            />
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};
