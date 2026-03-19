import { useState, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { readExcelFile, convertJsonToExcel, updateCellValue, addRow, deleteRow, addColumn, deleteColumn } from '../utils/excelUtils';
import { GitHubService, type GitHubBranch } from '../services/githubService';
import { logService } from '../services/logService';
import type { ExcelData } from '../types';
import '../styles/ExcelManager.css';

export const ExcelManager = () => {
  const [loading, setLoading] = useState(false);
  const [activeExcelTab, setActiveExcelTab] = useState<1 | 2>(1);
  const file1Ref = useRef<HTMLInputElement>(null);
  const file2Ref = useRef<HTMLInputElement>(null);

  // GitHub integration state
  const [repoUrl, setRepoUrl] = useState('');
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedRule, setSelectedRule] = useState('');
  const [gitHubLoading, setGitHubLoading] = useState(false);

  const excelData = useAppStore((state) => state.excelData);
  const setExcelFile = useAppStore((state) => state.setExcelFile);
  const setGitHubConfig = useAppStore((state) => state.setGitHubConfig);
  const user = useAppStore((state) => state.user);

  // Get tokens from environment variables
  const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || '';

  // GitHub integration handlers
  const handleFetchBranches = async () => {
    if (!repoUrl || !GITHUB_TOKEN) {
      logService.warning('GitHub configuration incomplete', 'Missing repo URL or token in env');
      return;
    }

    setGitHubLoading(true);
    try {
      const service = new GitHubService(GITHUB_TOKEN);
      const parsed = service.parseRepoUrl(repoUrl);

      if (!parsed) {
        throw new Error('Invalid GitHub URL format');
      }

      const fetchedBranches = await service.getBranches(parsed.owner, parsed.repo);
      logService.success('GitHub branches fetched', `Found ${fetchedBranches.length} branches`);
      setBranches(fetchedBranches);
    } catch (err) {
      logService.error('GitHub fetch failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setGitHubLoading(false);
    }
  };

  const handleBranchSelect = async (branchName: string) => {
    setSelectedBranch(branchName);
    setSelectedRule('');

    if (!repoUrl || !GITHUB_TOKEN) return;

    setGitHubLoading(true);
    try {
      const service = new GitHubService(GITHUB_TOKEN);
      const parsed = service.parseRepoUrl(repoUrl);

      if (!parsed) throw new Error('Invalid GitHub URL format');

      // Fetch helpers content and store in config
      const files = await service.listFilesInFolder(parsed.owner, parsed.repo, 'helpers', branchName);
      const concatenatedContent = files
        .map((file) => `// File: ${file.path}\n${file.content}`)
        .join('\n\n');

      setGitHubConfig({
        branch: branchName,
        helpers: files.map((f) => f.path),
      });

      // Store helpers content in a store method or use it when needed
      (window as any).__helpersContent = concatenatedContent;

      // Fetch available rules

    } catch (err) {
      logService.error('Failed to fetch branch content', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setGitHubLoading(false);
    }
  };

  const handleRuleSelect = (ruleId: string) => {
    setSelectedRule(ruleId);
    setGitHubConfig({
      ruleId,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileNumber: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;

    logService.info(`Excel file upload started`, `File: ${file.name}, Size: ${(file.size / 1024).toFixed(2)}KB`);
    setLoading(true);
    try {
      const data = await readExcelFile(file);
      const excelDataObj: ExcelData = {
        name: file.name,
        data: data.data,
        headers: data.headers,
      };
      setExcelFile(fileNumber, excelDataObj);
      logService.success(`Excel file uploaded successfully`, `File ${fileNumber}: ${data.data.length} rows, ${data.headers.length} columns`);
      alert(`File ${fileNumber} loaded successfully`);
    } catch (error) {
      logService.error(`Excel file upload failed`, `Error: ${error}`);
      alert(`Error loading file: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const file1 = excelData.file1;
  const file2 = excelData.file2;

  const handleCellChange = (fileNumber: 1 | 2, rowIndex: number, columnName: string, value: any) => {
    const currentFile = fileNumber === 1 ? file1 : file2;
    if (!currentFile) return;

    const updatedData = updateCellValue(currentFile.data, rowIndex, columnName, value);
    setExcelFile(fileNumber, {
      ...currentFile,
      data: updatedData,
    });
  };

  const handleAddRow = (fileNumber: 1 | 2) => {
    const currentFile = fileNumber === 1 ? file1 : file2;
    if (!currentFile) return;

    logService.debug(`Adding row to file ${fileNumber}`);
    const newData = addRow(currentFile.data, currentFile.headers);
    setExcelFile(fileNumber, {
      ...currentFile,
      data: newData,
    });
    logService.success(`Row added`, `File ${fileNumber} now has ${newData.length} rows`);
  };

  const handleDeleteRow = (fileNumber: 1 | 2, rowIndex: number) => {
    const currentFile = fileNumber === 1 ? file1 : file2;
    if (!currentFile) return;

    logService.debug(`Deleting row ${rowIndex} from file ${fileNumber}`);
    const newData = deleteRow(currentFile.data, rowIndex);
    setExcelFile(fileNumber, {
      ...currentFile,
      data: newData,
    });
    logService.success(`Row deleted`, `File ${fileNumber} now has ${newData.length} rows`);
  };

  const handleAddColumn = (fileNumber: 1 | 2) => {
    const currentFile = fileNumber === 1 ? file1 : file2;
    if (!currentFile) return;

    logService.debug(`Adding column to file ${fileNumber}`);
    const columnName = prompt('Enter column name:');
    if (!columnName) return;

    const newData = addColumn(currentFile.data, columnName);
    const newHeaders = [...currentFile.headers, columnName];
    setExcelFile(fileNumber, {
      ...currentFile,
      data: newData,
      headers: newHeaders,
    });
  };

  const handleDeleteColumn = (fileNumber: 1 | 2, columnName: string) => {
    const currentFile = fileNumber === 1 ? file1 : file2;
    if (!currentFile) return;

    const newData = deleteColumn(currentFile.data, columnName);
    const newHeaders = currentFile.headers.filter((h) => h !== columnName);
    setExcelFile(fileNumber, {
      ...currentFile,
      data: newData,
      headers: newHeaders,
    });
  };

  const handleSaveFile = (fileNumber: 1 | 2) => {
    const currentFile = fileNumber === 1 ? file1 : file2;
    if (!currentFile) return;

    convertJsonToExcel(currentFile.data, `${currentFile.name.split('.')[0]}_updated.xlsx`);
  };

  const renderTable = (fileNumber: 1 | 2) => {
    const currentFile = fileNumber === 1 ? file1 : file2;
    if (!currentFile) return null;

    const isReadOnly = user?.role === 'read';

    return (
      <div className="table-container">
        <div className="table-controls">
          <h3>{currentFile.name}</h3>
          {!isReadOnly && (
            <>
              <button onClick={() => handleAddRow(fileNumber)} className="btn btn-secondary">
                + Add Row
              </button>
              <button onClick={() => handleAddColumn(fileNumber)} className="btn btn-secondary">
                + Add Column
              </button>
              <button onClick={() => handleSaveFile(fileNumber)} className="btn btn-primary">
                Save File
              </button>
            </>
          )}
        </div>

        <table className="excel-table">
          <thead>
            <tr>
              <th>Action</th>
              {currentFile.headers.map((header) => (
                <th key={header}>
                  <div className="header-cell">
                    <span>{header}</span>
                    {!isReadOnly && (
                      <button
                        onClick={() => handleDeleteColumn(fileNumber, header)}
                        className="btn-delete-header"
                        title="Delete column"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentFile.data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td>
                  {!isReadOnly && (
                    <button
                      onClick={() => handleDeleteRow(fileNumber, rowIndex)}
                      className="btn-delete-row"
                      title="Delete row"
                    >
                      ×
                    </button>
                  )}
                </td>
                {currentFile.headers.map((header) => (
                  <td key={`${rowIndex}-${header}`}>
                    {isReadOnly ? (
                      <span>{row[header] || ''}</span>
                    ) : (
                      <input
                        type="text"
                        value={row[header] || ''}
                        onChange={(e) => handleCellChange(fileNumber, rowIndex, header, e.target.value)}
                        className="cell-input"
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="excel-manager">
      <h2>Excel File Manager</h2>

      {/* GitHub Integration Section */}
      <div className="github-inputs-section">
        <div className="github-inputs-row">
          <div className="github-input-group">
            <label htmlFor="repo-url">Repository URL</label>
            <input
              id="repo-url"
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              disabled={gitHubLoading}
              className="github-input"
            />
          </div>

          <div className="github-input-group">
            <label htmlFor="branch-select">Branch</label>
            <div className="branch-select-wrapper">
              <select
                id="branch-select"
                value={selectedBranch}
                onChange={(e) => handleBranchSelect(e.target.value)}
                disabled={gitHubLoading || branches.length === 0}
                className="github-select"
              >
                <option value="">
                  {branches.length === 0 ? 'Fetch branches first' : 'Select branch...'}
                </option>
                {branches.map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleFetchBranches}
                disabled={!repoUrl || gitHubLoading}
                className="btn btn-secondary"
              >
                {gitHubLoading ? 'Loading...' : 'Fetch Branches'}
              </button>
            </div>
          </div>

          <div className="github-input-group">
            <label htmlFor="rule-input">Rule ID</label>
            <input
              id="rule-input"
              type="text"
              value={selectedRule}
              onChange={(e) => handleRuleSelect(e.target.value)}
              placeholder="Enter rule ID (e.g., 1000023)"
              disabled={gitHubLoading}
              className="github-input"
            />
          </div>
        </div>
      </div>

      {/* Excel Upload Section */}
      <div className="file-upload-section">
        <div className="file-upload-box">
          <label htmlFor="file1-input">Excel File 1</label>
          <input
            id="file1-input"
            ref={file1Ref}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => handleFileUpload(e, 1)}
            disabled={loading}
            className="file-input"
          />
          {file1 && <span className="file-loaded">✓ {file1.name}</span>}
        </div>

        <div className="file-upload-box">
          <label htmlFor="file2-input">Excel File 2</label>
          <input
            id="file2-input"
            ref={file2Ref}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => handleFileUpload(e, 2)}
            disabled={loading}
            className="file-input"
          />
          {file2 && <span className="file-loaded">✓ {file2.name}</span>}
        </div>
      </div>

      {/* Excel Tabs Section */}
      {(file1 || file2) && (
        <div className="excel-tabs-section">
          <div className="excel-tabs">
            {file1 && (
              <button
                className={`excel-tab ${activeExcelTab === 1 ? 'active' : ''}`}
                onClick={() => setActiveExcelTab(1)}
              >
                📄 {file1.name}
              </button>
            )}
            {file2 && (
              <button
                className={`excel-tab ${activeExcelTab === 2 ? 'active' : ''}`}
                onClick={() => setActiveExcelTab(2)}
              >
                📄 {file2.name}
              </button>
            )}
          </div>

          <div className="excel-content">
            {activeExcelTab === 1 && file1 && renderTable(1)}
            {activeExcelTab === 2 && file2 && renderTable(2)}
          </div>
        </div>
      )}

      {!file1 && !file2 && (
        <div className="empty-state">
          <p>Upload Excel files to get started</p>
        </div>
      )}
    </div>
  );
};
