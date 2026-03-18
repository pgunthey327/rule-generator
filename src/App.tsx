import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/appStore';
import { Login } from './components/Login';
import { ExcelManager } from './components/ExcelManager';
import { GitHubIntegration } from './components/GitHubIntegration';
import { RuleGenerator } from './components/RuleGenerator';
import { Console } from './components/Console';
import { logService } from './services/logService';
import './styles/App.css';

type TabType = 'github' | 'excel' | 'generator';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('github');
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);

  const isEditUser = user?.role === 'edit';

  useEffect(() => {
    logService.info('Dashboard loaded', `User: ${user?.username} (${user?.role})`);
  }, [user?.username, user?.role]);

  const tabs: { id: TabType; label: string; icon: string; component: React.ReactNode }[] = [
    {
      id: 'github',
      label: 'GitHub Integration',
      icon: '🔗',
      component: <GitHubIntegration />,
    },
    {
      id: 'excel',
      label: 'Excel Manager',
      icon: '📊',
      component: <ExcelManager />,
    },
    {
      id: 'generator',
      label: 'Rule Generator',
      icon: '⚙️',
      component: <RuleGenerator />,
    },
  ];

  const handleTabChange = (tabId: TabType) => {
    logService.debug(`Tab switched to: ${tabId}`);
    setActiveTab(tabId);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Rule Generator - Enterprise Edition</h1>
        <div className="header-info">
          <span>User: {user?.username}</span>
          <span>Role: {user?.role === 'edit' ? 'Edit Access' : 'Read Only'}</span>
          <button onClick={logout} className="btn btn-logout">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-container">
        <aside className="dashboard-nav">
          <div className="nav-title">Sections</div>
          <nav className="tab-menu">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${
                  tab.id !== 'excel' && !isEditUser ? 'disabled' : ''
                }`}
                disabled={tab.id !== 'excel' && !isEditUser}
                title={tab.id !== 'excel' && !isEditUser ? 'Requires Edit Access' : ''}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </nav>

          {!isEditUser && (
            <div className="read-only-badge">
              <p>⚠️ Read-Only Access</p>
              <p>GitHub & Generator unavailable</p>
            </div>
          )}
        </aside>

        <main className="dashboard-main">
          <div className="tab-content">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`tab-panel ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.component}
              </div>
            ))}
          </div>
        </main>

        <aside className="dashboard-console">
          <Console />
        </aside>
      </div>
    </div>
  );
};

export default function App() {
  const user = useAppStore((state) => state.user);

  useEffect(() => {
    // Check if user is already logged in (could restore from localStorage)
    // For now, we start fresh each session
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={user?.isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/" element={user?.isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
