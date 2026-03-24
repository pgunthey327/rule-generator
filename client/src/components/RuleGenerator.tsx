import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import '../styles/RuleGenerator.css';

export const RuleGenerator = () => {
  const [lob, setLob] = useState('');
  const [emailPopupOpen, setEmailPopupOpen] = useState(false);
  const [emailText, setEmailText] = useState('');

  const generatedCode = useAppStore((state) => state.generatedCode);
  const setGeneratedCode = useAppStore((state) => state.setGeneratedCode);
  const user = useAppStore((state) => state.user);

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

        <button
          disabled={user?.role !== 'edit'}
          className="btn btn-success"
        >
          Generate Rule Code
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
