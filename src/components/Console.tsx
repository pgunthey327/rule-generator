import { useEffect, useState, useRef } from 'react';
import { logService } from '../services/logService';
import type { LogEntry } from '../services/logService';
import '../styles/Console.css';

export const Console = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to log service
    const unsubscribe = logService.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });

    // Set initial logs
    setLogs(logService.getLogs());

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const getLogIconAndColor = (level: string) => {
    switch (level) {
      case 'info':
        return { icon: 'ℹ️', color: 'log-info' };
      case 'success':
        return { icon: '✓', color: 'log-success' };
      case 'warning':
        return { icon: '⚠', color: 'log-warning' };
      case 'error':
        return { icon: '✕', color: 'log-error' };
      case 'debug':
        return { icon: '🐛', color: 'log-debug' };
      default:
        return { icon: '•', color: 'log-info' };
    }
  };

  const handleClear = () => {
    logService.clearLogs();
    setLogs([]);
  };

  return (
    <div className="console-panel">
      <div className="console-header">
        <h3>System Console</h3>
        <div className="console-controls">
          <label className="auto-scroll-toggle">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            <span>Auto-scroll</span>
          </label>
          <button className="btn btn-clear" onClick={handleClear} title="Clear logs">
            Clear
          </button>
        </div>
      </div>

      <div className="console-content">
        {logs.length === 0 ? (
          <div className="console-empty">
            <p>Waiting for activity...</p>
          </div>
        ) : (
          logs.map((log) => {
            const { icon, color } = getLogIconAndColor(log.level);
            return (
              <div key={log.id} className={`log-entry ${color}`}>
                <span className="log-icon">{icon}</span>
                <span className="log-time">{log.timestamp}</span>
                <span className="log-level">{log.level.toUpperCase()}</span>
                <span className="log-message">{log.message}</span>
                {log.details && <span className="log-details">{log.details}</span>}
              </div>
            );
          })
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};
