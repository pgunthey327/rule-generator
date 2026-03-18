import { useState, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { readExcelFile, convertJsonToExcel, updateCellValue, addRow, deleteRow, addColumn, deleteColumn } from '../utils/excelUtils';
import { logService } from '../services/logService';
import type { ExcelData } from '../types';
import '../styles/ExcelManager.css';

export const ExcelManager = () => {
  const [loading, setLoading] = useState(false);
  const file1Ref = useRef<HTMLInputElement>(null);
  const file2Ref = useRef<HTMLInputElement>(null);

  const excelData = useAppStore((state) => state.excelData);
  const setExcelFile = useAppStore((state) => state.setExcelFile);
  const user = useAppStore((state) => state.user);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileNumber: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;

    logService.info(`Excel file upload started`, `File: ${file.name}, Size: ${(file.size / 1024).toFixed(2)}KB`);
    setLoading(true);
    try {
      const data = await readExcelFile(file);
      const excelDataObj: ExcelData = {
        name: file.name,
        data: data.data,
        headers: data.headers,
      };
      setExcelFile(fileNumber, excelDataObj);
      logService.success(`Excel file uploaded successfully`, `File ${fileNumber}: ${data.data.length} rows, ${data.headers.length} columns`);
      alert(`File ${fileNumber} loaded successfully`);
    } catch (error) {
      logService.error(`Excel file upload failed`, `Error: ${error}`);
      alert(`Error loading file: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const file1 = excelData.file1;
  const file2 = excelData.file2;

  const handleCellChange = (fileNumber: 1 | 2, rowIndex: number, columnName: string, value: any) => {
    const currentFile = fileNumber === 1 ? file1 : file2;
    if (!currentFile) return;

    const updatedData = updateCellValue(currentFile.data, rowIndex, columnName, value);
    setExcelFile(fileNumber, {
      ...currentFile,
      data: updatedData,
    });
  };

  const handleAddRow = (fileNumber: 1 | 2) => {
    const currentFile = fileNumber === 1 ? file1 : file2;
    if (!currentFile) return;

    logService.debug(`Adding row to file ${fileNumber}`);
    const newData = addRow(currentFile.data, currentFile.headers);
    setExcelFile(fileNumber, {
      ...currentFile,
      data: newData,
    });
    logService.success(`Row added`, `File ${fileNumber} now has ${newData.length} rows`);
  };

  const handleDeleteRow = (fileNumber: 1 | 2, rowIndex: number) => {
    const currentFile = fileNumber === 1 ? file1 : file2;
    if (!currentFile) return;

    logService.debug(`Deleting row ${rowIndex} from file ${fileNumber}`);
    const newData = deleteRow(currentFile.data, rowIndex);
    setExcelFile(fileNumber, {
      ...currentFile,
      data: newData,
    });
    logService.success(`Row deleted`, `File ${fileNumber} now has ${newData.length} rows`);
  };

  const handleAddColumn = (fileNumber: 1 | 2) => {
    const currentFile = fileNumber === 1 ? file1 : file2;
    if (!currentFile) return;

    logService.debug(`Adding column to file ${fileNumber}`);
    const columnName = prompt('Enter column name:');
    if (!columnName) return;

    const newData = addColumn(currentFile.data, columnName);
    const newHeaders = [...currentFile.headers, columnName];
    setExcelFile(fileNumber, {
      ...currentFile,
      data: newData,
      headers: newHeaders,
    });
  };

  const handleDeleteColumn = (fileNumber: 1 | 2, columnName: string) => {
    const currentFile = fileNumber === 1 ? file1 : file2;
    if (!currentFile) return;

    const newData = deleteColumn(currentFile.data, columnName);
    const newHeaders = currentFile.headers.filter((h) => h !== columnName);
    setExcelFile(fileNumber, {
      ...currentFile,
      data: newData,
      headers: newHeaders,
    });
  };

  const handleSaveFile = (fileNumber: 1 | 2) => {
    const currentFile = fileNumber === 1 ? file1 : file2;
    if (!currentFile) return;

    convertJsonToExcel(currentFile.data, `${currentFile.name.split('.')[0]}_updated.xlsx`);
  };

  const renderTable = (fileNumber: 1 | 2) => {
    const currentFile = fileNumber === 1 ? file1 : file2;
    if (!currentFile) return null;

    const isReadOnly = user?.role === 'read';

    return (
      <div className="table-container">
        <div className="table-controls">
          <h3>{currentFile.name}</h3>
          {!isReadOnly && (
            <>
              <button onClick={() => handleAddRow(fileNumber)} className="btn btn-secondary">
                + Add Row
              </button>
              <button onClick={() => handleAddColumn(fileNumber)} className="btn btn-secondary">
                + Add Column
              </button>
              <button onClick={() => handleSaveFile(fileNumber)} className="btn btn-primary">
                Save File
              </button>
            </>
          )}
        </div>

        <table className="excel-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>Action</th>
              {currentFile.headers.map((header) => (
                <th key={header}>
                  <div className="header-cell">
                    <span>{header}</span>
                    {!isReadOnly && (
                      <button
                        onClick={() => handleDeleteColumn(fileNumber, header)}
                        className="btn-delete-header"
                        title="Delete column"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentFile.data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td>
                  {!isReadOnly && (
                    <button
                      onClick={() => handleDeleteRow(fileNumber, rowIndex)}
                      className="btn-delete-row"
                      title="Delete row"
                    >
                      ×
                    </button>
                  )}
                </td>
                {currentFile.headers.map((header) => (
                  <td key={`${rowIndex}-${header}`}>
                    {isReadOnly ? (
                      <span>{row[header] || ''}</span>
                    ) : (
                      <input
                        type="text"
                        value={row[header] || ''}
                        onChange={(e) => handleCellChange(fileNumber, rowIndex, header, e.target.value)}
                        className="cell-input"
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="excel-manager">
      <h2>Excel File Manager</h2>

      <div className="file-upload-section">
        <div className="file-upload-box">
          <label htmlFor="file1-input">Excel File 1</label>
          <input
            id="file1-input"
            ref={file1Ref}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => handleFileUpload(e, 1)}
            disabled={loading}
            className="file-input"
          />
          {file1 && <span className="file-loaded">✓ {file1.name}</span>}
        </div>

        <div className="file-upload-box">
          <label htmlFor="file2-input">Excel File 2</label>
          <input
            id="file2-input"
            ref={file2Ref}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => handleFileUpload(e, 2)}
            disabled={loading}
            className="file-input"
          />
          {file2 && <span className="file-loaded">✓ {file2.name}</span>}
        </div>
      </div>

      <div className="tables-section">
        {file1 && <div className="table-wrapper">{renderTable(1)}</div>}
        {file2 && <div className="table-wrapper">{renderTable(2)}</div>}
      </div>

      {!file1 && !file2 && (
        <div className="empty-state">
          <p>Upload Excel files to get started</p>
        </div>
      )}
    </div>
  );
};
