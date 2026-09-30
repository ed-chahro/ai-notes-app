import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Table, 
  RefreshCw, 
  Play, 
  Check, 
  Copy, 
  RotateCcw,
  Key,
  ShieldCheck,
  Info
} from 'lucide-react';
import { fetchDbSchema, fetchDbRecords, resetDatabase } from '../api';
import { DatabaseSchema, Note } from '../types';

interface MysqlInspectorProps {
  onRefreshNotes: () => void;
}

export const MysqlInspector: React.FC<MysqlInspectorProps> = ({ onRefreshNotes }) => {
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [records, setRecords] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [customQuery, setCustomQuery] = useState('SELECT id, title, category, ai_summary, created_at FROM notes ORDER BY created_at DESC;');
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, rData] = await Promise.all([fetchDbSchema(), fetchDbRecords()]);
      setSchema(sData);
      setRecords(rData.records);
      executeMockSql(customQuery, rData.records);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetData = async () => {
    if (!confirm('Reset table back to initial sample records?')) return;
    setIsResetting(true);
    try {
      await resetDatabase();
      await loadData();
      onRefreshNotes();
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  const executeMockSql = (sql: string, currentRecords: Note[]) => {
    setQueryError(null);
    try {
      const normalized = sql.trim().toLowerCase();
      if (!normalized.startsWith('select')) {
        setQueryError('Inspector allows read-only SELECT queries.');
        return;
      }

      let res = [...currentRecords];
      if (normalized.includes("category = 'work'") || normalized.includes('category="work"')) {
        res = res.filter(r => r.category.toLowerCase() === 'work');
      } else if (normalized.includes("category = 'study'") || normalized.includes('category="study"')) {
        res = res.filter(r => r.category.toLowerCase() === 'study');
      } else if (normalized.includes("category = 'personal'") || normalized.includes('category="personal"')) {
        res = res.filter(r => r.category.toLowerCase() === 'personal');
      } else if (normalized.includes('where ai_summary is not null')) {
        res = res.filter(r => Boolean(r.ai_summary));
      }

      setQueryResult(res);
    } catch (err: any) {
      setQueryError(err.message);
    }
  };

  const handleRunQuery = (e: React.FormEvent) => {
    e.preventDefault();
    executeMockSql(customQuery, records);
  };

  const handleCopySchemaSql = () => {
    const ddl = `-- Schema for Notes App
CREATE DATABASE IF NOT EXISTS notes_db;
USE notes_db;

CREATE TABLE notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'General',
    ai_summary TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at DESC),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
    navigator.clipboard.writeText(ddl);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 1500);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-zinc-900/40 border border-white/[0.06] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-100">Database & Schema Inspector</h2>
                <span className="font-mono text-xs text-zinc-400">notes_db.notes</span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                Engine: InnoDB (utf8mb4) · Automatic SQLite local fallback supported
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopySchemaSql}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-300 bg-white/[0.04] hover:bg-white/[0.08] rounded-md border border-white/[0.08] transition-colors font-mono"
            >
              {copiedQuery ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedQuery ? 'Copied' : 'Copy DDL'}</span>
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] rounded-md border border-white/[0.06] transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleResetData}
              disabled={isResetting}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] rounded-md border border-white/[0.06] transition-colors font-mono"
            >
              <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Informational Guidance */}
        <div className="mt-4 pt-3 border-t border-white/[0.05] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-zinc-950/60 border border-white/[0.04] rounded-lg">
            <div className="flex items-center gap-1.5 font-medium text-zinc-300 mb-1">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Config Active</span>
            </div>
            <p className="text-zinc-500 leading-relaxed text-[11px]">
              No MySQL server setup is required. All notes, relations, and AI summaries persist in real time.
            </p>
          </div>

          <div className="p-3 bg-zinc-950/60 border border-white/[0.04] rounded-lg">
            <div className="flex items-center gap-1.5 font-medium text-zinc-300 mb-1">
              <Info className="w-3.5 h-3.5 text-zinc-400" />
              <span>SQLite Fallback Mode</span>
            </div>
            <p className="text-zinc-500 leading-relaxed text-[11px]">
              The Python backend (<code className="text-zinc-400 font-mono">database.py</code>) auto-detects if MySQL is running; if not, it automatically runs off <code className="text-zinc-400 font-mono">notes.db</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Schema Columns & Properties */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Table Schema Columns */}
        <div className="lg:col-span-2 bg-zinc-900/40 border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Table className="w-3.5 h-3.5 text-zinc-400" />
              <h3 className="text-xs font-semibold text-zinc-200">Table Schema: notes</h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">7 Columns</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.06] text-zinc-500 font-medium">
                  <th className="py-2 px-2.5">Column</th>
                  <th className="py-2 px-2.5">Type</th>
                  <th className="py-2 px-2.5">Nullable</th>
                  <th className="py-2 px-2.5">Key</th>
                  <th className="py-2 px-2.5">Default</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {schema?.columns.map((col) => (
                  <tr key={col.name} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-2.5 font-medium text-zinc-200 flex items-center gap-1.5">
                      {col.key === 'PRI' && <Key className="w-3 h-3 text-zinc-400 inline" />}
                      {col.name}
                    </td>
                    <td className="py-2 px-2.5 text-zinc-400">{col.type}</td>
                    <td className="py-2 px-2.5 text-zinc-500">{col.nullable ? 'YES' : 'NO'}</td>
                    <td className="py-2 px-2.5">
                      {col.key === 'PRI' ? (
                        <span className="text-zinc-200 font-semibold">PRI</span>
                      ) : col.key === 'MUL' ? (
                        <span className="text-zinc-400">IDX</span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-zinc-500">{col.default || 'NULL'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Properties */}
        <div className="bg-zinc-900/40 border border-white/[0.06] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <h3 className="text-xs font-semibold text-zinc-200">Engine & Indexes</h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-zinc-950/60 border border-white/[0.04] rounded-lg">
              <span className="text-zinc-500 text-[11px] block">Engine</span>
              <span className="text-zinc-300 font-mono text-xs">InnoDB (ACID Compliant)</span>
            </div>

            <div className="p-2.5 bg-zinc-950/60 border border-white/[0.04] rounded-lg">
              <span className="text-zinc-500 text-[11px] block">Collation</span>
              <span className="text-zinc-300 font-mono text-xs">utf8mb4_unicode_ci</span>
            </div>

            <div className="p-2.5 bg-zinc-950/60 border border-white/[0.04] rounded-lg">
              <span className="text-zinc-500 text-[11px] block mb-1">Indexes</span>
              <ul className="space-y-0.5 font-mono text-[11px] text-zinc-400">
                <li>PRIMARY: id</li>
                <li>idx_created_at: created_at DESC</li>
                <li>idx_category: category ASC</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* SQL Query Console & Live Results */}
      <div className="bg-zinc-900/40 border border-white/[0.06] rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-3.5 h-3.5 text-zinc-400" />
            <h3 className="text-xs font-semibold text-zinc-200">SQL Query Simulator</h3>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">Test queries on live dataset</span>
        </div>

        <form onSubmit={handleRunQuery} className="flex gap-2">
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs font-mono bg-zinc-950/80 border border-white/[0.08] rounded-lg text-zinc-200 focus:outline-none focus:border-white/[0.2]"
            placeholder="SELECT * FROM notes WHERE category = 'Work';"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg transition-colors cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run</span>
          </button>
        </form>

        {queryError && (
          <div className="p-2.5 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg font-mono">
            {queryError}
          </div>
        )}

        {/* Live Table Records Display */}
        <div className="border border-white/[0.06] rounded-lg overflow-x-auto bg-zinc-950/80">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.06] text-zinc-500 bg-zinc-950">
                <th className="py-2 px-3 w-12">#id</th>
                <th className="py-2 px-3">title</th>
                <th className="py-2 px-3">category</th>
                <th className="py-2 px-3">ai_summary</th>
                <th className="py-2 px-3 whitespace-nowrap">created_at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {(queryResult || records).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-zinc-600">
                    No records found
                  </td>
                </tr>
              ) : (
                (queryResult || records).map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3 text-zinc-400 font-medium">{row.id}</td>
                    <td className="py-2 px-3 font-medium text-zinc-200 max-w-[220px] truncate">
                      {row.title}
                    </td>
                    <td className="py-2 px-3 text-zinc-400">{row.category}</td>
                    <td className="py-2 px-3 text-zinc-400 italic max-w-[260px] truncate">
                      {row.ai_summary || <span className="text-zinc-600 font-normal">NULL</span>}
                    </td>
                    <td className="py-2 px-3 text-zinc-500 whitespace-nowrap text-[11px]">
                      {row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
