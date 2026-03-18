# Architecture & Configuration Guide

## Application Architecture

### Component Hierarchy

```
App (Router)
├── Login
│   └── Form → Zustand Store
└── Dashboard
    ├── Header (User Info, Logout)
    ├── Navigation
    └── Main Content
        ├── ExcelManager (Universal)
        ├── GitHubIntegration (Edit Only)
        └── RuleGenerator (Edit Only)
```

### Data Flow

```
User Input
    ↓
React Component State/Props
    ↓
Zustand Store (Global State)
    ↓
Services (GitHub, Gen AI, Excel Utils)
    ↓
External APIs / Local Processing
    ↓
Component Render
```

### State Management (Zustand)

```typescript
AppStore {
  // User
  user: User | null
  login(username, password, role)
  logout()

  // Excel
  excelData: { file1?, file2? }
  setExcelFile(fileNumber, data)
  clearExcelData()

  // GitHub
  githubConfig: GitHubConfig
  setGitHubConfig(config)
  clearGitHubConfig()

  // UI
  generatedCode: string | null
  loading: boolean
  error: string | null
  setGeneratedCode(code)
  setLoading(loading)
  setError(error)
}
```

---

## Component Details

### 1. Login Component

**File**: `src/components/Login.tsx`

**Props**: None

**State**: 
- username: string
- password: string
- role: 'read' | 'edit'

**Actions**:
- Validates input
- Calls `useAppStore.login()`
- Stores user in Zustand
- Redirects to dashboard

**Styling**: `src/styles/Login.css`

---

### 2. ExcelManager Component

**File**: `src/components/ExcelManager.tsx`

**Features**:
- File upload handling
- Excel parsing using XLSX
- Table rendering with edit capability
- Row/Column add/delete
- File save functionality

**Permissions**:
- **Read**: View only
- **Edit**: Full CRUD operations

**Excel Operations** (utils/excelUtils.ts):
- `readExcelFile()`: Parse Excel file
- `convertJsonToExcel()`: Save JSON as Excel
- `updateCellValue()`: Update single cell
- `addRow()`: Add new row
- `deleteRow()`: Delete row
- `addColumn()`: Add new column
- `deleteColumn()`: Delete column

**State Management**:
- Loading state for file uploads
- Excel data stored in Zustand

---

### 3. GitHubIntegration Component

**File**: `src/components/GitHubIntegration.tsx`

**Features**:
- Repository URL input
- Personal Access Token authentication
- Branch fetching and selection
- Helpers folder content loading
- Rule file search by ID

**Service**: `src/services/githubService.ts`

**Methods**:
- `getBranches()`: Fetch repository branches
- `getFileContent()`: Get single file content
- `listFilesInFolder()`: Fetch all files in folder
- `findFile()`: Search for file by name
- `commitAndPush()`: Create commit with new code
- `parseRepoUrl()`: Parse GitHub URL

**API**: GitHub REST API v3

---

### 4. RuleGenerator Component

**File**: `src/components/RuleGenerator.tsx`

**Workflow**:
1. Validate inputs (Excel files, LOB, API key)
2. Extract OIDs from Excel 1
3. Filter Excel 2 by OIDs + LOB + BOM + XOM
4. Generate code using Gen AI
5. Display generated code
6. Option to commit to GitHub

**Service**: `src/services/genAIService.ts`

**Methods**:
- `extractOIDsFromExcel()`: AI call to extract OIDs
- `generateRuleCode()`: AI call to generate code

**Handles**:
- Missing XOM detection
- Email popup for missing paths
- Code generation and display
- GitHub commit integration

---

## Services

### GitHubService

**Location**: `src/services/githubService.ts`

**Authentication**: Personal Access Token

**Base URL**: `https://api.github.com`

**Key Methods**:

```typescript
getBranches(owner, repo): GitHubBranch[]
getFileContent(owner, repo, path, branch): string
listFilesInFolder(owner, repo, folderPath, branch): GitHubFile[]
findFile(owner, repo, filename): string | null
commitAndPush(owner, repo, filePath, content, message, branch): boolean
parseRepoUrl(url): { owner, repo } | null
```

**Error Handling**: Try-catch with user-friendly messages

---

### GenAIService

**Location**: `src/services/genAIService.ts`

**Provider**: OpenAI (configurable)

**Base URL**: `https://api.openai.com/v1/chat/completions`

**Key Methods**:

```typescript
extractOIDsFromExcel(excelJson): OIDExtractResponse
generateRuleCode(excel1, excel2, oids, lob, helpers): AIResponse
callAI(prompt): string
```

**Response Format**:
```json
{
  "oids": ["OID1", "OID2"],
  "explanation": "text"
}
```

---

## Type Definitions

**Location**: `src/types/index.ts`

```typescript
// Authentication
type UserRole = 'read' | 'edit'
interface User {
  id, username, role, isAuthenticated
}

// Excel
interface ExcelData {
  name, data, headers
}

// GitHub
interface GitHubConfig {
  repoUrl, branch, token, helpers, ruleId, rulePath
}

// Code Generation
interface GenerateRuleRequest {
  excel1Json, excel2Json, oids, lob, helpersContent, ruleTemplate
}

interface GeneratedCode {
  code, language, path
}
```

---

## Styling System

### CSS Architecture

```
src/styles/
├── common.css              # Global styles, buttons, forms
├── App.css                 # Dashboard layout
├── Login.css               # Login page
├── ExcelManager.css        # Excel component
├── GitHubIntegration.css   # GitHub component
└── RuleGenerator.css       # Rule generator component
```

### Design Tokens (CSS Variables)

```css
--primary: #3b82f6
--primary-dark: #2563eb
--success: #10b981
--danger: #ef4444
--warning: #f59e0b
--gray-50 to --gray-900: Gray scale
```

### Responsive Design

- Breakpoint: 768px (tablet)
- Mobile-first approach
- Flexbox and Grid layouts
- Touch-friendly button sizes

---

## Configuration

### Environment Variables

Create `.env` file:

```env
# API Endpoints
VITE_API_ENDPOINT=https://api.example.com

# AI Configuration
VITE_AI_PROVIDER=openai
VITE_AI_MODEL=gpt-3.5-turbo
VITE_AI_TIMEOUT=30000

# GitHub
VITE_GITHUB_API_VERSION=v3
```

### Vite Configuration

**File**: `vite.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false
  },
  build: {
    target: 'ES2020',
    outDir: 'dist',
    sourcemap: false
  }
})
```

---

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Initial Setup

```bash
# Clone/navigate to project
cd d:\Playground\rule-generator

# Install dependencies
npm install

# Verify installation
npm run build

# Start dev server
npm run dev
```

### Development Workflow

1. **Make changes** in component files
2. **Hot Module Reload** happens automatically
3. **View changes** in browser
4. **Check console** for errors
5. **Test functionality**

### TypeScript Checking

```bash
# Type check without building
npx tsc --noEmit

# Full type check
npm run build
```

---

## API Integration Points

### GitHub API Endpoints

```
GET /repos/{owner}/{repo}/branches
GET /repos/{owner}/{repo}/contents/{path}
GET /search/code?q={query}
PUT /repos/{owner}/{repo}/contents/{path}
```

### Gen AI API Endpoints

```
POST /v1/chat/completions
  Headers: Authorization: Bearer {key}
  Body: { model, messages, temperature, max_tokens }
```

### Email Endpoint (Custom)

```
POST /api/email/send
  Body: { to, subject, body }
```

---

## Performance Optimization

### Current Optimizations

1. **React.memo** for component memoization
2. **Zustand** for efficient state management
3. **Lazy imports** for components (via React Router)
4. **CSS Grid/Flexbox** for layout efficiency
5. **XLSX library** for client-side Excel parsing

### Potential Improvements

1. Implement code-splitting with dynamic imports
2. Add virtual scrolling for large Excel tables
3. Cache API responses with React Query
4. Debounce user input in search/filter
5. Implement service workers for offline capability
6. Optimize bundle size with tree-shaking

---

## Security Considerations

### Current Implementation

- ✓ Role-based access control
- ✓ Client-side validation
- ✓ Error boundary handling
- ✓ Protected routes (React Router)

### Production Security Checklist

- [ ] Implement backend authentication
- [ ] Add CSRF token validation
- [ ] Enable HTTPS only
- [ ] Add CSP headers
- [ ] Implement rate limiting
- [ ] Sanitize user inputs
- [ ] Hash sensitive data
- [ ] Enable CORS restrictions
- [ ] Add audit logging
- [ ] Implement WAF rules
- [ ] Add two-factor authentication
- [ ] Implement session timeout
- [ ] Add encryption for data in transit
- [ ] Regular security audits

---

## Error Handling Strategy

### HTTP Errors

```typescript
try {
  // API call
} catch (error) {
  if (error.response?.status === 401) {
    // Handle auth error
  } else if (error.response?.status === 404) {
    // Handle not found
  } else {
    // Generic error
  }
}
```

### Component Error Boundaries

```typescript
<ErrorBoundary>
  <Component />
</ErrorBoundary>
```

### User Feedback

- Toast notifications
- Inline error messages
- Modal popups for critical errors
- Console logging for debugging

---

## Deployment Checklist

- [ ] Build test: `npm run build`
- [ ] No console errors
- [ ] All TypeScript types correct
- [ ] Environment variables set
- [ ] API endpoints configured
- [ ] Security headers configured
- [ ] CDN configured
- [ ] SSL certificate valid
- [ ] Error monitoring setup (Sentry)
- [ ] Analytics configured
- [ ] Performance monitoring setup
- [ ] Backup strategy in place

---

## Monitoring & Logging

### Client-Side Logging

```typescript
console.log('Action:', action)
console.error('Error:', error)
console.warn('Warning:', warning)
```

### Production Monitoring (Recommended)

- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for usage
- Datadog for performance
- PagerDuty for alerts

---

**This architecture ensures scalability, maintainability, and enterprise-grade quality.**
