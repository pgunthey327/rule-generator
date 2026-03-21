# Quick Start Guide

## Installation & Running

### Step 1: Install Dependencies
```bash
cd d:\Playground\rule-generator
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

The application will start at `http://localhost:5173`

### Step 3: Access the Application
1. Open your browser
2. Navigate to `http://localhost:5173`
3. You'll be redirected to the login page

## First Time Login

### Option 1: Read-Only Access
- **Username**: `demo_user`
- **Password**: `password` (or any non-empty password)
- **Select**: Read Only
- **Click**: Sign In

### Option 2: Edit Access
- **Username**: `demo_admin`
- **Password**: `password` (or any non-empty password)
- **Select**: Edit Access
- **Click**: Sign In

> Note: For demo purposes, any username with a non-empty password will authenticate. In production, implement proper backend authentication.

## Features Overview

### 1. Excel File Management (Available to Both Roles)

#### Upload Files:
1. Click on "Excel File 1" or "Excel File 2" upload boxes
2. Select `.xlsx` or `.xls` files
3. Files will be automatically parsed and displayed in tables

#### Edit & Modify (Edit Access Only):
- Click any cell to edit
- Click "＋ Add Row" to add new rows
- Click "＋ Add Column" to add new columns
- Click "×" on rows/headers to delete
- Click "Save File" to download modified Excel file

#### View Only (Read Access):
- View all data in read-only tables
- Cannot edit, add, or delete

---

### 2. GitHub Integration (Edit Access Only)

#### Step 1: Connect Repository
1. Enter GitHub Repository URL
   - Example: `https://github.com/torvalds/linux`
   - Or: `git@github.com:torvalds/linux.git`
2. Enter GitHub Personal Access Token
   - Generate at: https://github.com/settings/tokens
   - Requires: `repo` and `read:user` scopes
3. Click "Fetch Branches"

#### Step 2: Load Helper Functions
1. Select a Branch from the dropdown
2. Click "Load Helpers Folder"
3. The system will fetch all files from the `helpers` folder
4. Content will be displayed in the preview

#### Step 3: Locate Rule File
1. Enter Rule ID (e.g., `RULE_001`, `MY_RULE`)
2. Click "Locate Rule"
3. Path will appear in the "Rule File Path" field
   - If found: Shows the file path
   - If not found: Shows "NA"

---

### 3. Rule Code Generation (Edit Access Only)

#### Prerequisites:
- ✓ Both Excel files uploaded
- ✓ GitHub helpers loaded
- ✓ Rule ID located
- ✓ Gen AI API Key available

#### Step 1: Select LOB
1. Click LOB dropdown in Rule Generator section
2. Select a Line of Business (LOB1, LOB2, etc.)

#### Step 2: Enter AI API Key
1. Enter your OpenAI API key or similar service key
2. Keep it secure - never commit to git

#### Step 3: Generate Rule Code
1. Click "Generate Rule Code" button
2. The system will:
   - Extract OIDs from Excel 1 using Gen AI
   - Filter Excel 2 data by OIDs, LOB, BOM, and XOM pathTypes
   - Generate business rule code
   - Display generated code in preview

#### Step 4: Handle Missing XOM
- If XOM not found: Email popup appears
- Customize the message if needed
- Click "Send Email" to request the path
- Click "Cancel" to continue

#### Step 5: Deploy Code
1. Review generated code
2. Click "Commit & Push to GitHub"
3. Code will be committed to the rule path
4. Click "Clear" to reset for next rule

---

## API Key Setup

### GitHub Personal Access Token
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Select scopes:
   - ✓ repo (full control of private repositories)
   - ✓ read:user (Read user profile data)
4. Click "Generate token"
5. Copy and save securely

### Gen AI API Key (OpenAI Example)
1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy and save securely
4. Paste in the application when needed

> **Security Note**: Never commit API keys to version control!

---

## File Format Requirements

### Excel Files
- Format: `.xlsx` or `.xls`
- First row: Headers (optional but recommended)
- Data: Rows starting from row 1 or 2
- Example columns:
  - Excel 1: OID, TYPE, DESCRIPTION, VALUE
  - Excel 2: OID, LOB, BOM, XOM, PATH_TYPE

---

## Troubleshooting

### Issue: Login not working
- **Solution**: Ensure password is at least 1 character
- Check browser console for errors

### Issue: Excel file not uploading
- **Solution**: Verify file format is `.xlsx` or `.xls`
- File size should be reasonable (< 10MB)
- Check for special characters in filename

### Issue: GitHub branches not loading
- **Solution**: Verify repository URL format
- Check GitHub token has correct permissions
- Ensure token hasn't expired
- Check internet connection

### Issue: Helpers folder not found
- **Solution**: Verify repository has a `helpers` folder
- Check folder name spelling (case-sensitive in Linux repos)
- Verify token has repo read permissions

### Issue: Generated code not appearing
- **Solution**: Check Gen AI API key is valid
- Verify Excel files are in correct format
- Check that OIDs were found in Excel 1
- Check that matching records exist in Excel 2

---

## Production Deployment

### Building for Production
```bash
npm run build
```

Output will be in `dist/` folder

### Hosting Options
- Vercel (recommended for Vite)
- Netlify
- GitHub Pages
- AWS Amplify
- Docker container

### Important Changes for Production

1. **Environment Variables**
   ```bash
   # Create .env.production
   VITE_API_ENDPOINT=https://api.yourcompany.com
   VITE_AI_MODEL=gpt-4
   ```

2. **Backend Integration**
   - Move API calls to backend
   - Never expose API keys in frontend
   - Implement proper authentication
   - Add CORS protection

3. **Security**
   - Enable HTTPS only
   - Implement CSP headers
   - Add rate limiting
   - Sanitize all inputs
   - Add audit logging

4. **Performance**
   - Enable gzip compression
   - Implement code splitting
   - Cache static assets
   - Use CDN for distribution

---

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint TypeScript
npm run lint
```

---

## File Structure Reference

```
rule-generator/
├── src/
│   ├── components/          # React components
│   ├── services/            # API integrations
│   ├── store/              # State management (Zustand)
│   ├── types/              # TypeScript types
│   ├── utils/              # Helper functions
│   ├── styles/             # CSS styles
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── dist/                    # Production build (after npm run build)
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite config
└── README_FEATURES.md      # Full feature documentation
```

---

## Testing the Application

### Test Scenario 1: Read-Only User
1. Login with Read access
2. Upload Excel files
3. Verify you cannot edit cells
4. Verify GitHub/Rule sections are hidden
5. Logout

### Test Scenario 2: Full Workflow (Edit User)
1. Login with Edit access
2. Upload Excel File 1 and 2
3. Connect to GitHub repository
4. Load helpers folder
5. Locate rule file
6. Generate rule code
7. Review and deploy

---

## Support & Documentation

- Full Feature Docs: [README_FEATURES.md](./README_FEATURES.md)
- GitHub Docs: https://docs.github.com/
- OpenAI Docs: https://platform.openai.com/docs
- React Docs: https://react.dev
- Vite Docs: https://vitejs.dev

---

## License

Enterprise Grade - Internal Use Only

---

**Ready to use!** Start the dev server and explore all features.
