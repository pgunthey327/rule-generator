import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { GenAIService } from '../services/genAIService';
import { logService } from '../services/logService';
import '../styles/RuleGenerator.css';

export const RuleGenerator = () => {
  const [lob, setLob] = useState('');
  const [aiApiKey, setAiApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailPopupOpen, setEmailPopupOpen] = useState(false);
  const [emailText, setEmailText] = useState('');

  const excelData = useAppStore((state) => state.excelData);
  const githubConfig = useAppStore((state) => state.githubConfig);
  const generatedCode = useAppStore((state) => state.generatedCode);
  const setGeneratedCode = useAppStore((state) => state.setGeneratedCode);
  const user = useAppStore((state) => state.user);

  const validateInputs = (): boolean => {
    if (!excelData.file1 || !excelData.file2) {
      logService.warning(`Rule generation validation failed`, `Missing Excel files`);
      setError('Please upload both Excel files first');
      return false;
    }
    if (!lob.trim()) {
      logService.warning(`Rule generation validation failed`, `Missing LOB selection`);
      setError('Please select a LOB field');
      return false;
    }
    if (!githubConfig.helpers.length) {
      logService.warning(`Rule generation validation failed`, `Missing GitHub helpers`);
      setError('Please load helpers from GitHub first');
      return false;
    }
    if (!aiApiKey.trim()) {
      logService.warning(`Rule generation validation failed`, `Missing Gen AI API key`);
      setError('Please enter Gen AI API key');
      return false;
    }
    logService.debug(`Rule generation validation passed`);
    return true;
  };

  const generateRule = async () => {
    if (!validateInputs()) return;

    logService.info(`Rule generation started`, `LOB: ${lob}`);
    setLoading(true);
    setError('');

    try {
      const aiService = new GenAIService(aiApiKey);

      // Step 1: Extract OIDs from Excel 1
      logService.debug(`Extracting OIDs from Excel file 1`);
      const oidResponse = await aiService.extractOIDsFromExcel(excelData.file1!.data);
      const oids = oidResponse.oids;

      if (!oids.length) {
        logService.warning(`OID extraction failed`, `No OIDs found in Excel 1`);
        setError('No OIDs found in Excel 1');
        setLoading(false);
        return;
      }

      logService.success(`OIDs extracted`, `Found ${oids.length} OIDs`);

      // Step 2: Filter Excel 2 data based on OIDs, LOB, and BOM/XOM pathTypes
      logService.debug(`Filtering Excel data`, `LOB: ${lob}, OIDs: ${oids.length}`);
      const filteredData = excelData.file2!.data.filter((row) => {
        const matchesOID = oids.some((oid) =>
          Object.values(row).some((val) => String(val).includes(oid))
        );
        const matchesLOB = row.LOB === lob || row.lob === lob;
        const hasBOM = Object.values(row).some((val) => String(val).includes('BOM'));
        const hasXOM = Object.values(row).some((val) => String(val).includes('XOM'));

        if (matchesOID && matchesLOB && hasBOM && !hasXOM) {
          // XOM not found - trigger email popup
          setEmailPopupOpen(true);
          setEmailText(
            `Request XOM path for:\nOID: ${oids.join(', ')}\nLOB: ${lob}\nBOM: Found`
          );
          return false;
        }

        return matchesOID && matchesLOB && hasBOM && hasXOM;
      });

      if (!filteredData.length) {
        setError('No matching records found with OID, LOB, BOM, and XOM');
        setLoading(false);
        return;
      }

      // Step 3: Generate code using Gen AI
      const codeResponse = await aiService.generateRuleCode(
        excelData.file1!.data,
        filteredData,
        oids,
        lob,
        githubConfig.helpers.join('\n')
      );

      setGeneratedCode(codeResponse.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate rule');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      // In a real application, this would call a backend API
      // For demo purposes, we'll just log it
      console.log('Email sent with:', emailText);
      alert('Email request sent successfully');
      setEmailPopupOpen(false);
      setEmailText('');
    } catch (err) {
      alert('Failed to send email');
    }
  };

  const lobs = ['LOB1', 'LOB2', 'LOB3', 'LOB4', 'LOB5'];

  return (
    <div className="rule-generator">
      <h2>Rule Code Generator</h2>

      <div className="generator-section">
        <div className="form-group">
          <label htmlFor="lob-select">LOB Field</label>
          <select
            id="lob-select"
            value={lob}
            onChange={(e) => setLob(e.target.value)}
            className="form-input"
          >
            <option value="">-- Select LOB --</option>
            {lobs.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="ai-key">Gen AI API Key</label>
          <input
            id="ai-key"
            type="password"
            value={aiApiKey}
            onChange={(e) => setAiApiKey(e.target.value)}
            placeholder="Enter your AI API key (OpenAI, etc.)"
            className="form-input"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          onClick={generateRule}
          disabled={loading || user?.role !== 'edit'}
          className="btn btn-success"
        >
          {loading ? 'Generating...' : 'Generate Rule Code'}
        </button>

        {user?.role === 'read' && (
          <p className="text-muted">This feature requires edit access</p>
        )}
      </div>

      {generatedCode && (
        <div className="generator-section">
          <h3>Generated Code</h3>
          <div className="code-preview">
            <pre>{generatedCode}</pre>
          </div>
          <div className="code-actions">
            <button className="btn btn-primary">Commit & Push to GitHub</button>
            <button
              className="btn btn-secondary"
              onClick={() => setGeneratedCode(null)}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {emailPopupOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Request XOM Path</h3>
            <p>XOM not found. Send email request?</p>
            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              className="form-input"
              rows={6}
            />
            <div className="modal-actions">
              <button onClick={handleSendEmail} className="btn btn-primary">
                Send Email
              </button>
              <button
                onClick={() => setEmailPopupOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
