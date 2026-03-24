import { create } from 'zustand';
import type { User, UserRole, ExcelFile, GitHubConfig } from '../types';

interface AppStore {
  user: User | null;
  excelData: ExcelFile;
  githubConfig: GitHubConfig;
  generatedCode: string | null;
  loading: boolean;
  error: string | null;

  // Auth actions
  login: (username: string, password: string, role: UserRole) => void;
  logout: () => void;

  // Excel actions
  setExcelFile: (fileNumber: 1 | 2, data: any) => void;
  clearExcelData: () => void;

  // GitHub actions
  setGitHubConfig: (config: Partial<GitHubConfig>) => void;
  clearGitHubConfig: () => void;

  // Code generation
  setGeneratedCode: (code: string | null) => void;

  // UI state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  excelData: {},
  githubConfig: {
    repoUrl: '',
    branch: '',
  },
  generatedCode: null,
  loading: false,
  error: null,

  login: (username, password, role) => {
    // Simple authentication - in production, this should call a backend API
    if (password.length > 0) {
      set({
        user: {
          id: Date.now().toString(),
          username,
          role,
          isAuthenticated: true,
        },
      });
    } else {
      set({ error: 'Invalid credentials' });
    }
  },

  logout: () => {
    set({
      user: null,
      excelData: {},
      githubConfig: {
        repoUrl: '',
        branch: ''
      },
      generatedCode: null,
    });
  },

  setExcelFile: (fileNumber, data) => {
    set((state) => ({
      excelData: {
        ...state.excelData,
        [`file${fileNumber}`]: data,
      },
    }));
  },

  clearExcelData: () => {
    set({ excelData: {} });
  },

  setGitHubConfig: (config) => {
    set((state) => ({
      githubConfig: {
        ...state.githubConfig,
        ...config,
      },
    }));
  },

  clearGitHubConfig: () => {
    set({
      githubConfig: {
        repoUrl: '',
        branch: ''
      },
    });
  },

  setGeneratedCode: (code) => {
    set({ generatedCode: code });
  },

  setLoading: (loading) => {
    set({ loading });
  },

  setError: (error) => {
    set({ error });
  },
}));
