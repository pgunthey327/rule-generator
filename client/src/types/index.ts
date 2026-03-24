export type UserRole = 'read' | 'edit';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  isAuthenticated: boolean;
}

export interface ExcelData {
  name: string;
  data: Record<string, any>[];
  headers: string[];
}

export interface ExcelFile {
  file1?: ExcelData;
  file2?: ExcelData;
}

export interface Rule {
  id: string;
  name: string;
  path: string;
  content?: string;
}

export interface GitHubConfig {
  ruleRepoUrl: string;
  branch: string;
  ruleRepos?: string[]; // List of available repos for dropdown
  serviceRepos?: string[]; // List of available service repos for dropdown
  serviceBranch?: string; // Selected service branch
  serviceRepoUrl?: string; // Selected service repo URL
}

export interface GenerateRuleRequest {
  excel1Json: Record<string, any>[];
  excel2Json: Record<string, any>[];
  oids: string[];
  lob: string;
  ruleTemplate: Record<string, any>;
}

export interface GeneratedCode {
  code: string;
  language: string;
  path: string;
}
