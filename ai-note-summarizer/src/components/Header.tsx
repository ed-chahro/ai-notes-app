import React, { useState } from 'react';
import { 
  FileText, 
  Database, 
  Terminal, 
  Code2, 
  CheckSquare, 
  Plus, 
  Key, 
  ExternalLink,
  X
} from 'lucide-react';
import { HealthInfo } from '../types';

interface HeaderProps {
  activeTab: 'notes' | 'mysql' | 'api' | 'code' | 'checklist';
  setActiveTab: (tab: 'notes' | 'mysql' | 'api' | 'code' | 'checklist') => void;
  onNewNote: () => void;
  health: HealthInfo | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewNote,
  health
}) => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('user_openrouter_key') || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('user_openrouter_key', apiKey.trim());
    } else {
      localStorage.removeItem('user_openrouter_key');
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowKeyModal(false);
    }, 1200);
  };

  const navItems = [
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'mysql', label: 'Database', icon: Database },
    { id: 'api', label: 'API Tester', icon: Terminal },
    { id: 'code', label: 'Backend Code', icon: Code2 },
    { id: 'checklist', label: 'Roadmap', icon: CheckSquare },
  ] as const;

  return (
    <>
      <header className="border-b border-white/[0.08] bg-[#09090b]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Brand Logo & Meta */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-zinc-100 font-semibold font-mono text-xs">
                N
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-zinc-100 text-sm tracking-tight">Notes AI</span>
                <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">
                  FastAPI · MySQL · OpenRouter
                </span>
              </div>
            </div>

            {/* Navigation Tabs (Minimalist Segmented Control) */}
            <nav className="hidden md:flex items-center p-0.5 bg-zinc-900/90 border border-white/[0.08] rounded-lg">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      isActive
                        ? 'bg-zinc-800 text-white shadow-sm border border-white/[0.08]'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 opacity-70" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Actions & Health Status */}
            <div className="flex items-center gap-2.5">
              {/* Quiet Health Status */}
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-400 px-2 py-1 bg-white/[0.03] rounded-md border border-white/[0.06] font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                <span>{health?.status === 'healthy' ? 'API Ready' : 'Connecting'}</span>
              </div>

              {/* API Key Modal Button */}
              <button
                onClick={() => setShowKeyModal(true)}
                title="Configure OpenRouter API Key"
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] rounded-md border border-transparent hover:border-white/[0.08] transition-colors"
              >
                <Key className="w-3.5 h-3.5" />
              </button>

              {/* Minimalist Create Note Button */}
              <button
                onClick={onNewNote}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-950 bg-zinc-100 hover:bg-white active:bg-zinc-200 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New Note</span>
              </button>
            </div>
          </div>

          {/* Mobile Navigation bar */}
          <div className="flex md:hidden items-center justify-between py-1.5 border-t border-white/[0.06] overflow-x-auto gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs whitespace-nowrap rounded-md ${
                    isActive ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* OpenRouter Key Settings Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-zinc-900 border border-white/[0.1] rounded-xl p-6 shadow-2xl text-zinc-100">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-zinc-300" />
                <h3 className="font-semibold text-sm">OpenRouter AI Configuration</h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md hover:bg-white/[0.05]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKey} className="mt-4 space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Connect your free OpenRouter API key for LLaMA 3.1 summarization, or leave empty to use the server&apos;s automatic fallback engine.
              </p>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  OpenRouter API Key (Optional)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full px-3 py-2 text-xs bg-zinc-950 border border-white/[0.1] rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 font-mono"
                />
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Saved locally in browser</span>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-300 hover:text-white hover:underline flex items-center gap-1"
                  >
                    Get free key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {savedSuccess && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg">
                  Settings saved.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.05] rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-medium bg-zinc-100 text-zinc-950 hover:bg-white rounded-lg transition-colors"
                >
                  Save Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
