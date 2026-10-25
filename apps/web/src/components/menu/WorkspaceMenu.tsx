import React, { useRef, useState } from 'react';
import type { LayerManager, ICountryDetailManager } from '@canvas/core';
import { serializeWorkspace } from '@canvas/core';

interface WorkspaceMenuProps {
  manager: LayerManager;
  countryDetailManager?: ICountryDetailManager;
  onImportSuccess?: () => void;
  onImportError?: (error: string) => void;
}

export const WorkspaceMenu: React.FC<WorkspaceMenuProps> = ({
  manager,
  countryDetailManager,
  onImportSuccess,
  onImportError,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExport = () => {
    try {
      const ws = manager.getWorkspace();
      if (countryDetailManager) {
        ws.countryDetailConfig = countryDetailManager.exportConfig();
      }
      const json = serializeWorkspace(ws);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = `${ws.title.toLowerCase().replace(/\s+/g, '-')}.canvas.json`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to export workspace';
      setErrorMessage(msg);
      if (onImportError) onImportError(msg);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        manager.deserialize(content);
        if (countryDetailManager) {
          countryDetailManager.loadConfig(manager.getWorkspace().countryDetailConfig);
        }
        setErrorMessage(null);
        if (onImportSuccess) onImportSuccess();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid workspace file format.';
        setErrorMessage(msg);
        if (onImportError) onImportError(msg);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const handleNewWorkspace = () => {
    if (window.confirm('Start a new workspace? Any unsaved changes will be cleared.')) {
      manager.reset();
      if (countryDetailManager) {
        countryDetailManager.loadConfig({ definitions: [], sublayerVisibilityOverrides: {} });
      }
      setErrorMessage(null);
      if (onImportSuccess) onImportSuccess();
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        onClick={handleNewWorkspace}
        data-testid="btn-new-workspace"
        style={{
          backgroundColor: '#2d3748',
          color: '#e2e8f0',
          border: '1px solid #4a5568',
          borderRadius: '4px',
          padding: '4px 10px',
          fontSize: '12px',
          cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        New
      </button>

      <button
        onClick={handleExport}
        data-testid="btn-export-workspace"
        style={{
          backgroundColor: '#2b6cb0',
          color: '#ffffff',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 10px',
          fontSize: '12px',
          cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        Export (.canvas.json)
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        data-testid="btn-import-workspace"
        style={{
          backgroundColor: '#319795',
          color: '#ffffff',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 10px',
          fontSize: '12px',
          cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        Import
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,.canvas.json"
        data-testid="input-workspace-file"
        style={{ display: 'none' }}
      />

      {errorMessage && (
        <div
          data-testid="workspace-error-banner"
          style={{
            position: 'fixed',
            top: '60px',
            right: '20px',
            backgroundColor: '#e53e3e',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span>⚠️ {errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
