import React, { useState, useEffect } from 'react';
import { 
  Code2, 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  FolderTree
} from 'lucide-react';
import { fetchBackendCode } from '../api';

const FILES = [
  { name: 'main.py', label: 'main.py (FastAPI App & CORS)', path: 'backend/main.py' },
  { name: 'database.py', label: 'database.py (MySQL & SQLite)', path: 'backend/database.py' },
  { name: 'models.py', label: 'models.py (SQLAlchemy Table)', path: 'backend/models.py' },
  { name: 'schemas.py', label: 'schemas.py (Pydantic Models)', path: 'backend/schemas.py' },
  { name: 'schema.sql', label: 'schema.sql (MySQL DDL)', path: 'backend/schema.sql' },
  { name: 'requirements.txt', label: 'requirements.txt', path: 'backend/requirements.txt' },
  { name: 'README.md', label: 'README.md (Setup & GitHub)', path: 'README.md' },
];

export const CodeBrowser: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState(FILES[0].name);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchBackendCode(selectedFile)
      .then((data) => {
        if (isMounted) setFileContent(data.content);
      })
      .catch((err) => {
        if (isMounted) setFileContent(`// Error loading file: ${err.message}`);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedFile]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const lines = fileContent.split('\n');

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-zinc-900/40 border border-white/[0.06] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Backend Codebase</h2>
              <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                Clean Python repository with SQLAlchemy models, Pydantic validation, and SQLite fallback
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 self-start sm:self-auto font-mono text-xs">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 text-zinc-300 bg-white/[0.04] hover:bg-white/[0.08] rounded-md border border-white/[0.08] transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-2.5 py-1 text-zinc-300 bg-white/[0.04] hover:bg-white/[0.08] rounded-md border border-white/[0.08] transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* File Tree Selector */}
        <div className="lg:col-span-3 bg-zinc-900/40 border border-white/[0.06] rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 uppercase tracking-wider px-2 mb-2">
            <FolderTree className="w-3 h-3" />
            <span>Files</span>
          </div>
          <div className="space-y-1">
            {FILES.map((f) => {
              const isSelected = selectedFile === f.name;
              return (
                <button
                  key={f.name}
                  onClick={() => setSelectedFile(f.name)}
                  className={`w-full text-left p-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 ${
                    isSelected
                      ? 'bg-zinc-800 text-white font-medium border border-white/[0.08]'
                      : 'hover:bg-white/[0.03] text-zinc-400'
                  }`}
                >
                  <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-zinc-200' : 'text-zinc-500'}`} />
                  <span className="truncate">{f.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Code Content Viewer */}
        <div className="lg:col-span-9 bg-zinc-900/40 border border-white/[0.06] rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-2 bg-zinc-950/80 border-b border-white/[0.06] flex items-center justify-between text-xs font-mono text-zinc-500">
            <span>{FILES.find(f => f.name === selectedFile)?.path || selectedFile}</span>
            <span>{lines.length} lines</span>
          </div>

          <div className="p-4 bg-zinc-950/90 overflow-x-auto max-h-[560px] overflow-y-auto">
            {loading ? (
              <div className="py-20 text-center text-xs text-zinc-500 font-mono">
                Loading...
              </div>
            ) : (
              <pre className="font-mono text-xs leading-relaxed text-zinc-300">
                {lines.map((line, idx) => (
                  <div key={idx} className="flex hover:bg-white/[0.02]">
                    <span className="w-9 pr-3 text-right text-zinc-600 select-none text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="flex-1 whitespace-pre">{line}</span>
                  </div>
                ))}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
