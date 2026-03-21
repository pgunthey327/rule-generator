import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserRole } from '../types';
import { useAppStore } from '../store/appStore';
import { logService } from '../services/logService';
import '../styles/Login.css';

export const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('read');
  const login = useAppStore((state) => state.login);
  const error = useAppStore((state) => state.error);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      logService.warning(`Login validation failed`, `Missing username or password`);
      alert('Please fill in all fields');
      return;
    }
    logService.info(`User login attempt`, `Username: ${username}, Role: ${role}`);
    login(username, password, role);
    logService.success(`Login successful`, `User: ${username} (${role})`);
    // Navigate to dashboard after login
    setTimeout(() => navigate('/dashboard'), 100);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Rule Generator</h1>
        <p className="subtitle">Enterprise Business Rules Engine</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Access Level</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="form-input"
            >
              <option value="read">Read Only</option>
              <option value="edit">Edit Access</option>
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>

        <div className="demo-info">
          <p>Demo Credentials:</p>
          <p>Any username with non-empty password</p>
        </div>
      </div>
    </div>
  );
};
