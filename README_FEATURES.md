# Rule Generator - Enterprise Grade React Application

An enterprise-grade business rules generation engine built with React, Vite, TypeScript, and AI integration.

## Features

### 1. **User Authentication & Role-Based Access Control**
- Two access levels: **Read Only** and **Edit Access**
- Login system with role selection
- Different UI experiences based on user role

### 2. **Excel File Management (Component 1)**
- Upload two Excel files (File 1 and File 2)
- Real-time display in interactive tables
- Editable cells (Edit access only)
- Add/Delete rows and columns
- Save modified files back as Excel
- Read-only view for Read access users

### 3. **GitHub Integration (Component 2 - Edit Access Only)**
- Connect to GitHub repositories via personal access tokens
- Fetch and select repository branches
- Automatically load and concatenate helpers folder content
- Locate and retrieve rule ID file paths
- Search for specific rule files in the repository

### 4. **Business Rule Code Generation**
- LOB (Line of Business) field selection
- Multi-step rule generation process:
  1. Extract OIDs from Excel 1 using Gen AI
  2. Filter Excel 2 data by OIDs, LOB, and BOM/XOM pathTypes
  3. Generate business rule code using Gen AI
- Email notification system for missing XOM paths
- Display and save generated code

### 5. **Role-Based Features**
- **Read Access**:
  - Upload and view Excel files
  - Cannot modify Excel data
  - Cannot access GitHub Integration
  - Cannot generate rules

- **Edit Access**:
  - Full Excel file management
  - GitHub repository integration
  - Rule code generation
  - Commit and push code to GitHub

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Excel Handling**: XLSX
- **API Integration**: Axios
- **GitHub API**: Octokit
- **Encoding**: js-base64
- **Routing**: React Router DOM

## Installation

1. Navigate to the project directory:
   ```bash
   cd d:\Playground\rule-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Configuration

### Environment Variables
Create a `.env` file in the root directory (optional):
```env
VITE_API_ENDPOINT=your_api_endpoint
VITE_DEFAULT_AI_MODEL=gpt-3.5-turbo
```

### Required for Full Functionality

1. **GitHub Personal Access Token**
   - Generate from: GitHub → Settings → Developer settings → Personal access tokens
   - Required scopes: `repo`, `read:user`

2. **Gen AI API Key**
   - OpenAI API key or similar service
   - Required for OID extraction and code generation

## Project Structure

```
src/
├── components/          # React components
│   ├── Login.tsx       # Authentication component
│   ├── ExcelManager.tsx # Excel file handling
│   ├── GitHubIntegration.tsx # GitHub integration
│   └── RuleGenerator.tsx # Code generation
├── services/           # External service integrations
│   ├── githubService.ts # GitHub API wrapper
│   └── genAIService.ts  # AI API wrapper
├── store/             # State management
│   └── appStore.ts    # Zustand store
├── types/             # TypeScript types
│   └── index.ts       # Type definitions
├── utils/             # Utility functions
│   └── excelUtils.ts  # Excel operations
├── styles/            # CSS files
│   ├── common.css
│   ├── App.css
│   ├── Login.css
│   ├── ExcelManager.css
│   ├── GitHubIntegration.css
│   └── RuleGenerator.css
└── App.tsx           # Main App component
```

## Usage Guide

### 1. Login
- Enter any username and password (minimum 1 character for password)
- Select access level (Read or Edit)
- Click "Sign In"

### 2. Excel File Management
- Click on file input to select Excel files
- Files are automatically parsed and displayed
- **Edit Access**: Modify cells, add/delete rows/columns, save changes
- **Read Access**: View data only (no editing)

### 3. GitHub Integration (Edit Access Only)
- Enter GitHub repository URL (e.g., `https://github.com/owner/repo`)
- Provide GitHub Personal Access Token
- Click "Fetch Branches" to load available branches
- Select a branch and click "Load Helpers Folder" to fetch helper files
- Enter Rule ID to locate rule files in the repository

### 4. Rule Code Generation (Edit Access Only)
- Ensure both Excel files are uploaded
- Select a LOB field from dropdown
- Provide Gen AI API key
- Click "Generate Rule Code"
- Generated code will be displayed with options to commit and push

### 5. Error Handling
- If XOM is not found during rule generation, an email popup appears
- Customize and send email requests for missing paths
- All errors are displayed with clear messages

## API Integration

### GitHub Service
- Uses GitHub REST API v3
- Supports branch listing, file operations, and repository search

### Gen AI Service
- Integration ready for OpenAI GPT-3.5-turbo
- Can be adapted for other AI services
- Handles OID extraction and code generation

## Error Handling

The application includes comprehensive error handling:
- File upload validation
- GitHub API error handling
- AI service timeout and error management
- User input validation
- Role-based access enforcement

## Performance Considerations

- Lazy component loading
- Efficient Excel parsing and rendering
- Optimized state management with Zustand
- Minimal re-renders with proper React hooks
- CSS Grid and Flexbox for responsive layouts

## Security Notes

- GitHub tokens are handled client-side (for demo purposes)
- In production, use backend API to handle sensitive tokens
- Implement CSRF protection
- Use HTTPS for all external API calls
- Sanitize user inputs

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Development

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lint TypeScript
```bash
npm run lint
```

## Future Enhancements

1. Backend API for secure token management
2. Database integration for persistent storage
3. Role-based API endpoints
4. Advanced filtering and search in Excel
5. Batch rule generation
6. Rule versioning and history
7. Audit logging
8. Multi-language support
9. Dark mode
10. Mobile app version

## License

Enterprise Grade - Internal Use Only

## Support

For issues or questions, please contact the development team.

## Demo Credentials

**Read Access:**
- Username: `user_read`
- Password: `password123`
- Role: Read Only

**Edit Access:**
- Username: `user_edit`
- Password: `password123`
- Role: Edit Access

## Notes

- This is a frontend application. Backend endpoints should be configured for production use.
- GitHub integration requires valid Personal Access Token.
- AI integration requires valid API key for the chosen service.
- Excel files must be in .xlsx or .xls format.
