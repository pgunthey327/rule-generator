import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { readExcelFile, convertJsonToExcel, updateCellValue, addRow, deleteRow, addColumn, deleteColumn } from '../utils/excelUtils';
import { GitHubService, type GitHubBranch } from '../services/githubService';
import { logService } from '../services/logService';
import type { ExcelData } from '../types';
import '../styles/ExcelManager.css';
import JsonView from '@uiw/react-json-view';
import { GenAIService } from '../services/genAIService';

type ToastType = 'success' | 'error';
interface ToastItem { id: number; message: string; type: ToastType; }

export const ExcelManager = () => {
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  const [activeExcelTab, setActiveExcelTab] = useState<1 | 2>(1);
  const [showDataModal, setShowDataModal] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const file1Ref = useRef<HTMLInputElement>(null);
  const file2Ref = useRef<HTMLInputElement>(null);

  // GitHub integration state
  const [ruleRepoUrl, setRuleRepoUrl] = useState('');
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [serviceRepoUrl, setServiceRepoUrl] = useState('');
  const [serviceBranches, setServiceBranches] = useState<GitHubBranch[]>([]);
  const [selectedServiceBranch, setSelectedServiceBranch] = useState('');
  const [lob, setLob] = useState('');
  const [gitHubLoading, setGitHubLoading] = useState(false);

  const excelData = useAppStore((state) => state.excelData);
  const setExcelFile = useAppStore((state) => state.setExcelFile);
  const setGitHubConfig = useAppStore((state) => state.setGitHubConfig);
  const githubConfig = useAppStore((state) => state.githubConfig);
  const user = useAppStore((state) => state.user);
  const ruleRepos = useAppStore((state) => state.githubConfig.ruleRepos);
  const serviceRepos = useAppStore((state) => state.githubConfig.serviceRepos);

  useEffect(() => {
    // Auto-fetch branches when repo URL changes
    const service = new GitHubService();

    const fetchRepos = async () => {
      setGitHubLoading(true);
      const ruleReposResp = await service.getRuleRepos();
      const serviceReposResp = await service.getServiceRepos();
      setGitHubConfig({...githubConfig,  ruleRepos: ruleReposResp, serviceRepos: serviceReposResp });
      setGitHubLoading(false);
    }
    fetchRepos();
  }, []);

  // Auto-fetch branches when repo URL changes
  useEffect(() => {
    if (!ruleRepoUrl) {
      setBranches([]);
      return;
    }

    const fetchBranches = async () => {
      setGitHubLoading(true);
      try {
        const service = new GitHubService();
        const parsed = service.parseRuleRepoUrl(ruleRepoUrl);

        if (!parsed) {
          logService.warning('Invalid GitHub URL', `Cannot parse: ${ruleRepoUrl}`);
          setBranches([]);
          return;
        }

        const fetchedBranches = await service.getBranches(parsed.owner, parsed.repo);
        logService.success('GitHub branches fetched', `Found ${fetchedBranches.length} branches`);
        setBranches(fetchedBranches);
      } catch (err) {
        logService.error('GitHub fetch failed', err instanceof Error ? err.message : 'Unknown error');
        setBranches([]);
      } finally {
        setGitHubLoading(false);
      }
    };
    const timer = setTimeout(fetchBranches, 500); // Debounce to avoid too many requests
    return () => clearTimeout(timer);
  }, [ruleRepoUrl]);

  useEffect(() => {
    if (!serviceRepoUrl) {
      setServiceBranches([]);
      return;
    }

    const fetchServiceBranches = async () => {
      setGitHubLoading(true);
      try {
        const service = new GitHubService();
        const parsed = service.parseServiceRepoUrl(serviceRepoUrl);

        if (!parsed) {
          logService.warning('Invalid GitHub URL', `Cannot parse: ${serviceRepoUrl}`);
          setServiceBranches([]);
          return;
        }

        const fetchedBranches = await service.getServiceBranches(parsed.owner, parsed.repo);
        logService.success('GitHub branches fetched', `Found ${fetchedBranches.length} branches`);
        setServiceBranches(fetchedBranches);
      } catch (err) {
        logService.error('GitHub fetch failed', err instanceof Error ? err.message : 'Unknown error');
        setServiceBranches([]);
      } finally {
        setGitHubLoading(false);
      }
    };

    const timer = setTimeout(fetchServiceBranches, 500); // Debounce to avoid too many requests
    return () => clearTimeout(timer);
  }, [serviceRepoUrl]);

  const handleBranchSelect = async (branchName: string) => {
      setSelectedBranch(branchName);
      setGitHubConfig({
        ...githubConfig,
        branch: branchName,
      });
  };
   const handleServiceBranchSelect = async (branchName: string) => {
      setSelectedServiceBranch(branchName);
      setGitHubConfig({
        ...githubConfig,
         serviceBranch: branchName,
      });
  };

  const executeRuleGeneration = async () => {
    setLoading(true);
     const restData: any = await getRestData();
    const refinedFile2 = Object.values(excelData.file2?.data || {}).filter(row => {
            console.log(row[lob] === 'Y' , restData.oids.includes(row["Object Id"]) , row["Path Type"]);
            return row[lob] === 'Y' && restData.oids.includes(row["Object Id"]) && (row["Path Type"] === 'SCBP BOM' || row["Path Type"] === 'SCBP XOM');
        });
    if(refinedFile2.length < 2){
        
    }
    else{
        const service = new GitHubService();
        const ruleParsed = service.parseRuleRepoUrl(ruleRepoUrl);
        const serviceParsed = service.parseServiceRepoUrl(serviceRepoUrl);
        const context = {
            lob,
            ruleOwner: ruleParsed?.owner,
            ruleRepoUrl,
            serviceRepoUrl,
            ruleBranch: selectedBranch,
            serviceBranch: selectedServiceBranch,
            spydrRule: excelData?.file1?.data[0],
            filteredOsari: refinedFile2,
            ...restData,
        };
        const genAIservice = new GenAIService();
        genAIservice.generateRuleCode(ruleParsed, serviceParsed,context);
        setLoading(false);
        logService.info('Data viewer opened', `Total data size: ${JSON.stringify(context).length} characters`);
    }
      showToast(`Rule generation started`, 'success');
  };

  const handleLogExcelData = async () => {
    const restData: any = await getRestData();
    const refinedFile2 = Object.values(excelData.file2?.data || {}).filter(row => {
            console.log(row[lob] === 'Y' , restData.oids.includes(row["Object Id"]) , row["Path Type"]);
            return row[lob] === 'Y' && restData.oids.includes(row["Object Id"]) && (row["Path Type"] === 'SCBP BOM' || row["Path Type"] === 'SCBP XOM');
        });
    if(refinedFile2.length < 2){
        
    }
    else{
        const dataToLog = {
            lob,
            ruleRepoUrl,
            serviceRepoUrl,
            ruleBranch: selectedBranch,
            serviceBranch: selectedServiceBranch,
            spydrRule: excelData?.file1?.data[0],
            filteredOsari: refinedFile2,
            ...restData,
        };
        setModalData(dataToLog);
        setShowDataModal(true);
        logService.info('Data viewer opened', `Total data size: ${JSON.stringify(dataToLog).length} characters`);
    }
  };

  const getRestData = async () => {
    const genAIservice = new GenAIService();
    const response =await genAIservice.getOIDAndRuleId(excelData.file1);
    return response;
  }

  const closeModal = () => {
    setShowDataModal(false);
    setModalData(null);
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
      showToast(`File ${fileNumber} loaded successfully`, 'success');
    } catch (error) {
      logService.error(`Excel file upload failed`, `Error: ${error}`);
      showToast(`Error loading file: ${error}`, 'error');
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
      <h2>Data Manager</h2>

      {/* GitHub Integration Grid Section */}
      <div className="github-inputs-section">
        <div className="github-inputs-grid">
          {/* Top Left - Repo URL */}
          <div className="github-grid-item">
            <label htmlFor="repo-url">Rule Repository URL</label>
            <select
              id="rule-repo-url-select"
              value={ruleRepoUrl}
              onChange={(e) => setRuleRepoUrl(e.target.value)}
              className="github-input"
            >
              <option value="">
                {ruleRepos?.length === 0 ? 'Fetching...' : 'Select Rule Repo...'}
              </option>
               {ruleRepos?.map((repo: string) => (
                <option key={repo} value={repo}>
                  {repo}
                </option>
              ))}
            </select>
          </div>

          {/* Top Right - Branch */}
          <div className="github-grid-item">
            <label htmlFor="branch-select">Rule Repo Branch</label>
            <select
              id="branch-select"
              value={selectedBranch}
              onChange={(e) => handleBranchSelect(e.target.value)}
              disabled={gitHubLoading || branches.length === 0}
              className="github-select"
            >
              <option value="">
                {branches.length === 0 ? 'Fetching...' : 'Select branch...'}
              </option>
              {branches.map((branch) => (
                <option key={branch.name} value={branch.name}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div className="github-grid-item">
            <label htmlFor="repo-url">Service Repository URL</label>
            <select
              id="service-repo-url-select"
              value={serviceRepoUrl}
              onChange={(e) => setServiceRepoUrl(e.target.value)}
              className="github-input"
            >
              <option value="">
                {serviceRepos?.length === 0 ? 'Fetching...' : 'Select Service Repo...'}
              </option>
               {serviceRepos?.map((repo: string) => (
                <option key={repo} value={repo}>
                  {repo}
                </option>
              ))}
            </select>
          </div>

          {/* Top Right - Branch */}
          <div className="github-grid-item">
            <label htmlFor="branch-select">Service Repo Branch</label>
            <select
              id="branch-select"
              value={selectedServiceBranch}
              onChange={(e) => handleServiceBranchSelect(e.target.value)}
              disabled={gitHubLoading || serviceBranches.length === 0}
              className="github-select"
            >
              <option value="">
                {serviceBranches.length === 0 ? 'Fetching...' : 'Select branch...'}
              </option>
              {serviceBranches?.map((branch: any) => (
                <option key={branch.name} value={branch.name}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

                {/* Excel Upload Section */}
      <div className="github-grid-item">
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
</div>

<div className="github-grid-item">
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


          {/* Bottom Left - LOB Dropdown */}
          <div className="github-grid-item">
            <label htmlFor="lob-select">Line of Business (LOB)</label>
            <select
              id="lob-select"
              value={lob}
              onChange={(e) => setLob(e.target.value)}
              disabled={gitHubLoading}
              className="github-select"
            >
              <option value="">Select LOB...</option>
              <option value="WC">WC</option>
              <option value="Auto">Auto</option>
              <option value="Cross Product">Cross Product</option>
            </select>
          </div>

          {/* Bottom Right - Log Data Button */}
          <div className="github-grid-item">
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <button 
                    onClick={handleLogExcelData} 
                    className="btn btn-primary log-data-btn-grid"
                    style={{ alignSelf: 'flex-end', width: '100%', marginTop: '38px' }}
                    >
                    📋 View Context
                </button>
                <button 
                    onClick={executeRuleGeneration} 
                    className="btn btn-primary log-data-btn-grid"
                    style={{ alignSelf: 'flex-end', width: '100%', marginTop: '38px' , marginLeft: '20px'}}
                    >
                    📋 Generate Rule
                </button>
            </div>
   
          </div>
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

      {/* JSON Data Viewer Modal */}
      {showDataModal && modalData && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="json-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📊 Data Viewer</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-content-json">
                
              <div className="json-viewer">
                <JsonView value={modalData} />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(modalData, null, 2));
                  logService.success('Copied', 'Data copied to clipboard');
                }}
                className="btn btn-secondary"
              >
                📋 Copy JSON
              </button>
              <button 
                onClick={closeModal}
                className="btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">{t.type === 'success' ? '✅' : '❌'}</span>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};
