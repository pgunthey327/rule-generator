export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: string;
}

class LogService {
  private logs: LogEntry[] = [];
  private maxLogs = 200;
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  subscribe(callback: (logs: LogEntry[]) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener([...this.logs]));
  }

  log(level: LogLevel, message: string, details?: string) {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
      }),
      level,
      message,
      details,
    };

    this.logs.unshift(entry);

    // Keep only the last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    this.notifyListeners();

    // Also log to browser console
    const style = this.getConsoleStyle(level);
    console.log(`%c[${level.toUpperCase()}] ${message}`, style, details || '');
  }

  info(message: string, details?: string) {
    this.log('info', message, details);
  }

  success(message: string, details?: string) {
    this.log('success', message, details);
  }

  warning(message: string, details?: string) {
    this.log('warning', message, details);
  }

  error(message: string, details?: string) {
    this.log('error', message, details);
  }

  debug(message: string, details?: string) {
    this.log('debug', message, details);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    this.notifyListeners();
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      info: 'color: #2d2d2d; font-weight: bold;',
      success: 'color: #10b981; font-weight: bold;',
      warning: 'color: #f59e0b; font-weight: bold;',
      error: 'color: #d93c3c; font-weight: bold;',
      debug: 'color: #656565; font-weight: normal;',
    };
    return styles[level];
  }
}

export const logService = new LogService();
