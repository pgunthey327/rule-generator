# Visual Workflow Guide

## User Journey Map

### Login Flow
```
┌─────────────────────────────────────────────────┐
│         RULE GENERATOR LOGIN PAGE               │
│                                                 │
│  Username: [________________]                   │
│  Password: [________________]                   │
│  Role:     [Read Only  ▼]                       │
│                                                 │
│           [SIGN IN BUTTON]                      │
└─────────────────────────────────────────────────┘
          ↓ (Valid Credentials)
┌─────────────────────────────────────────────────┐
│    DASHBOARD (Role-Based Navigation)            │
└─────────────────────────────────────────────────┘
```

---

## Component Visibility by Role

### Read-Only Users
```
┌────────────────────────────────────────┐
│ SIDEBAR                  │ MAIN CONTENT │
├────────────────────────────────────────┤
│ 📊 Excel Manager  ✅     │ Excel Files  │
│                         │ (View Only)  │
│                         │              │
└────────────────────────────────────────┘
```

### Edit Access Users
```
┌────────────────────────────────────────┐
│ SIDEBAR                  │ MAIN CONTENT │
├────────────────────────────────────────┤
│ 📊 Excel Manager  ✅     │ Excel Files  │
│ 🔗 GitHub Integ.  ✅     │ (Editable)   │
│ ⚙️ Rule Generator ✅     │              │
│                         │              │
└────────────────────────────────────────┘
```

---

## Excel Manager Workflow

### Read-Only User - Excel View
```
┌──────────────────────────────────────────┐
│ EXCEL FILE MANAGER                       │
├──────────────────────────────────────────┤
│                                          │
│ ┌─────────────┐  ┌─────────────┐        │
│ │ File 1 ✓    │  │ File 2 ✓    │        │
│ └─────────────┘  └─────────────┘        │
│                                          │
│ ┌────────────────────────────────────┐   │
│ │ TABLE (READ-ONLY)                  │   │
│ ├─────────┬──────────┬──────────┐    │   │
│ │ Col1    │ Col2     │ Col3     │    │   │
│ ├─────────┼──────────┼──────────┤    │   │
│ │ Value1  │ Value2   │ Value3   │    │   │
│ │ Value4  │ Value5   │ Value6   │    │   │
│ └────────────────────────────────────┘   │
│                                          │
└──────────────────────────────────────────┘
```

### Edit User - Excel Editing
```
┌────────────────────────────────────────────┐
│ EXCEL FILE MANAGER                         │
├────────────────────────────────────────────┤
│ [+ Add Row] [+ Add Column] [Save File]     │
│                                            │
│ ┌─────────┬──────────┬──────────┬──────┐  │
│ │ Col1    │ Col2     │ Col3     │ ×    │  │
│ ├─────────┼──────────┼──────────┼──────┤  │
│ │[edit]   │[edit]    │[edit]    │      │  │
│ ├─────────┼──────────┼──────────┤ ×    │  │
│ │[edit]   │[edit]    │[edit]    │      │  │
│ └─────────┴──────────┴──────────┴──────┘  │
│                                            │
│ × = Delete Row/Column button               │
│ [edit] = Editable input field              │
└────────────────────────────────────────────┘
```

---

## GitHub Integration Workflow

### Step 1: Connect Repository
```
┌────────────────────────────────────────┐
│ GITHUB INTEGRATION                     │
│                                        │
│ Repository Configuration:              │
│                                        │
│ Repository URL:                        │
│ [https://github.com/owner/repo]        │
│                                        │
│ GitHub Personal Access Token:          │
│ [••••••••••••••••••••]                 │
│                                        │
│ [Fetch Branches]                       │
└────────────────────────────────────────┘
         ↓ Success
┌────────────────────────────────────────┐
│ ✓ Branches Loaded                      │
└────────────────────────────────────────┘
```

### Step 2: Select Branch & Load Helpers
```
┌────────────────────────────────────────┐
│ Select Branch:                         │
│ [main ▼]  ← Dropdown                   │
│                                        │
│ [Load Helpers Folder]                  │
└────────────────────────────────────────┘
         ↓ Success
┌────────────────────────────────────────┐
│ Helpers Content:                       │
│ ┌────────────────────────────────────┐ │
│ │ // File: helpers/util.js           │ │
│ │ export const helper = () => {}     │ │
│ │ ...                                │ │
│ │ (500+ characters loaded)           │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### Step 3: Locate Rule File
```
┌────────────────────────────────────────┐
│ Locate Rule ID:                        │
│                                        │
│ Rule ID:                               │
│ [RULE_001]                             │
│                                        │
│ [Locate Rule]                          │
└────────────────────────────────────────┘
         ↓ Search
┌────────────────────────────────────────┐
│ Rule File Path:                        │
│ [rules/RULE_001.js]   ← Found!        │
│                                        │
│ Or: [NA]              ← Not found      │
└────────────────────────────────────────┘
```

---

## Rule Generation Workflow

### Step 1: Select Options
```
┌────────────────────────────────────────┐
│ RULE CODE GENERATOR                    │
│                                        │
│ LOB Field:                             │
│ [LOB1 ▼]                               │
│                                        │
│ Gen AI API Key:                        │
│ [•••••••••••••••••]                    │
│                                        │
│ [Generate Rule Code]                   │
└────────────────────────────────────────┘
```

### Step 2: Processing
```
         ↓ Click Generate
┌────────────────────────────────────────┐
│ PROCESSING...                          │
│                                        │
│ 1. Extracting OIDs from Excel 1        │
│ 2. Filtering Excel 2 by OIDs+LOB+BOM   │
│ 3. Generating code with AI             │
│                                        │
│ (Generating...)                        │
└────────────────────────────────────────┘
```

### Step 3: XOM Check
```
         ↓ If XOM not found
┌────────────────────────────────────────┐
│ ⚠️ REQUEST XOM PATH                    │
├────────────────────────────────────────┤
│                                        │
│ XOM not found. Send email request?     │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ Request XOM path for:              │ │
│ │ OID: OID_001                       │ │
│ │ LOB: LOB1                          │ │
│ │ BOM: Found                         │ │
│ └────────────────────────────────────┘ │
│                                        │
│ [Send Email]  [Cancel]                │
└────────────────────────────────────────┘
```

### Step 4: Display Generated Code
```
         ↓ Success (or after skip XOM)
┌────────────────────────────────────────┐
│ GENERATED CODE                         │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ // Business Rule Implementation    │ │
│ │ function executeRule(context) {    │ │
│ │   const oid = context.oid;         │ │
│ │   if (oid === 'OID_001') {         │ │
│ │     return applyLogic_001(context);│ │
│ │   }                                │ │
│ │ }                                  │ │
│ └────────────────────────────────────┘ │
│                                        │
│ [Commit & Push] [Clear]                │
└────────────────────────────────────────┘
```

---

## Data Processing Pipeline

### Excel to Rule Generation
```
┌─────────────────────────────────────────────────────────────┐
│                    USER WORKFLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Excel 1          Excel 2                                  │
│  [Upload]         [Upload]                                 │
│     ↓               ↓                                       │
│  ┌─────────┐    ┌──────────┐                              │
│  │ Parse   │    │ Parse    │                              │
│  │ JSON    │    │ JSON     │                              │
│  └────┬────┘    └────┬─────┘                              │
│       ↓              ↓                                      │
│  ┌─────────────────────────────┐                          │
│  │ Gen AI: Extract OIDs        │                          │
│  │ Response: ["OID_001", ...]  │                          │
│  └────┬────────────────────────┘                          │
│       ↓                                                     │
│  ┌─────────────────────────────┐                          │
│  │ Filter Excel 2:             │                          │
│  │ - Match OIDs ✓              │                          │
│  │ - Match LOB ✓               │                          │
│  │ - Has BOM ✓                 │                          │
│  │ - Has XOM ✓                 │                          │
│  │ Result: [filtered rows]     │                          │
│  └────┬────────────────────────┘                          │
│       ↓                                                     │
│  ┌─────────────────────────────┐                          │
│  │ + GitHub Helpers Content    │                          │
│  │ + Rule Template             │                          │
│  └────┬────────────────────────┘                          │
│       ↓                                                     │
│  ┌─────────────────────────────┐                          │
│  │ Gen AI: Generate Code       │                          │
│  │ Response: { code, explain } │                          │
│  └────┬────────────────────────┘                          │
│       ↓                                                     │
│  ┌─────────────────────────────┐                          │
│  │ Display Code Preview        │                          │
│  │ [Commit & Push] [Clear]     │                          │
│  └─────────────────────────────┘                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Permission Matrix

```
┌──────────────────────────┬───────────┬──────────┐
│ Feature                  │ Read Only │ Edit     │
├──────────────────────────┼───────────┼──────────┤
│ View Excel Files         │     ✅    │    ✅    │
│ Edit Excel Cells         │     ❌    │    ✅    │
│ Add/Delete Rows          │     ❌    │    ✅    │
│ Add/Delete Columns       │     ❌    │    ✅    │
│ Save Excel Files         │     ❌    │    ✅    │
│ Access GitHub Section    │     ❌    │    ✅    │
│ Connect Repositories     │     ❌    │    ✅    │
│ Fetch Branches           │     ❌    │    ✅    │
│ Load Helpers             │     ❌    │    ✅    │
│ Access Rule Generator    │     ❌    │    ✅    │
│ Generate Code            │     ❌    │    ✅    │
│ Commit & Push            │     ❌    │    ✅    │
└──────────────────────────┴───────────┴──────────┘
```

---

## Error Scenarios

### Scenario 1: Invalid GitHub Token
```
┌──────────────────────────────────────┐
│ ❌ Error                             │
│                                      │
│ Failed to fetch branches from GitHub │
│ Please verify your GitHub token and  │
│ network connection.                  │
│                                      │
│ [OK]                                 │
└──────────────────────────────────────┘
```

### Scenario 2: Missing Excel Files
```
┌──────────────────────────────────────┐
│ ❌ Error                             │
│                                      │
│ Please upload both Excel files first │
│                                      │
│ [OK]                                 │
└──────────────────────────────────────┘
```

### Scenario 3: Rule Not Found
```
┌──────────────────────────────────────┐
│ Rule File Path                       │
│ [NA]                                 │
│                                      │
│ ℹ️ Rule ID not found in repository   │
│    Please verify the Rule ID         │
└──────────────────────────────────────┘
```

---

## File Upload Indicators

```
┌─────────────────────────────────┐
│ UPLOAD STATUS INDICATORS        │
├─────────────────────────────────┤
│                                 │
│ ❌ File not uploaded            │
│                                 │
│ ✓ File uploaded                 │
│ [rules.xlsx]                    │
│                                 │
│ ⏳ Uploading...                  │
│ [rules.xlsx] (45%)              │
│                                 │
│ ❌ Upload failed                │
│ [Retry]                         │
│                                 │
└─────────────────────────────────┘
```

---

## Responsive Layout

### Desktop (≥1024px)
```
┌────────────────────────────────────────────┐
│ Header                                     │
├──────────────┬────────────────────────────┤
│  Navigation  │     Main Content           │
│              │                            │
│ - Excel      │ ┌──────────────────────┐  │
│ - GitHub     │ │ Excel Tables / GitHub│  │
│ - Generator  │ │ Integration / Code   │  │
│              │ │ Generation           │  │
│              │ └──────────────────────┘  │
└──────────────┴────────────────────────────┘
```

### Tablet (768px - 1023px)
```
┌────────────────────────────────┐
│ Header                         │
├────────────────────────────────┤
│ [Menu] Main Content            │
│        ┌──────────────────────┐│
│        │ Excel/GitHub/Code    ││
│        │ Content              ││
│        └──────────────────────┘│
└────────────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────────────┐
│ Header               │
├──────────────────────┤
│ [☰] Section Menu     │
├──────────────────────┤
│                      │
│ Full Width Content   │
│                      │
└──────────────────────┘
```

---

This visual guide helps users understand the complete workflow and user experience of the Rule Generator application.
