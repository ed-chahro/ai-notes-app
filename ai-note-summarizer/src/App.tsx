import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Sparkles, 
  RefreshCw, 
  X, 
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';
import { Header } from './components/Header';
import { NoteCard } from './components/NoteCard';
import { NoteModal } from './components/NoteModal';
import { MysqlInspector } from './components/MysqlInspector';
import { ApiTester } from './components/ApiTester';
import { CodeBrowser } from './components/CodeBrowser';
import { InternChecklist } from './components/InternChecklist';
import { fetchNotes, createNote, updateNote, deleteNote, summarizeText, fetchHealth } from './api';
import { Note, NoteCreateInput, HealthInfo } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'notes' | 'mysql' | 'api' | 'code' | 'checklist'>('notes');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [summarizingId, setSummarizingId] = useState<number | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 2800);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [notesData, healthData] = await Promise.all([
        fetchNotes(),
        fetchHealth().catch(() => null)
      ]);
      setNotes(notesData);
      setHealth(healthData);
    } catch (err: any) {
      console.error(err);
      showToast('Could not reach backend API', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered and Sorted Notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        const matchesCategory =
          selectedCategory === 'All' ||
          note.category.toLowerCase() === selectedCategory.toLowerCase();
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          note.title.toLowerCase().includes(q) ||
          note.content.toLowerCase().includes(q) ||
          (note.ai_summary && note.ai_summary.toLowerCase().includes(q));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === 'alphabetical') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [notes, selectedCategory, searchQuery, sortBy]);

  const categories = useMemo(() => {
    const set = new Set(['All']);
    notes.forEach((n) => {
      if (n.category) set.add(n.category);
    });
    return Array.from(set);
  }, [notes]);

  // Handle Save Note (Create or Edit)
  const handleSaveNote = async (data: NoteCreateInput) => {
    if (editingNote) {
      const updated = await updateNote(editingNote.id, data);
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      showToast(`Updated note #${updated.id}`);
    } else {
      const created = await createNote(data);
      setNotes((prev) => [created, ...prev]);
      showToast(`Created note #${created.id}`);
    }
    setEditingNote(null);
  };

  // Handle Direct AI Summarization on a Note Card
  const handleSummarizeNote = async (note: Note) => {
    setSummarizingId(note.id);
    try {
      const result = await summarizeText(note.content);
      const updated = await updateNote(note.id, { ai_summary: result.summary });
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      showToast(`Generated AI summary`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to generate AI summary', 'error');
    } finally {
      setSummarizingId(null);
    }
  };

  // Handle Delete
  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    const targetId = deleteConfirmId;
    try {
      await deleteNote(targetId);
      setNotes((prev) => prev.filter((n) => n.id !== targetId));
      showToast(`Deleted note #${targetId}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete note', 'error');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-white/20 selection:text-white">
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewNote={() => {
          setEditingNote(null);
          setIsModalOpen(true);
        }}
        health={health}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'notes' && (
          <div className="space-y-5">
            {/* Filter and Search Bar (Sleek, Minimalist, Clean) */}
            <div className="bg-zinc-900/40 border border-white/[0.06] rounded-xl p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notes..."
                    className="w-full pl-9 pr-8 py-1.5 text-xs bg-zinc-950/80 border border-white/[0.06] rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.2] transition-colors font-normal"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Sort dropdown & Refresh */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-950/80 border border-white/[0.06] rounded-lg text-xs text-zinc-400">
                    <SlidersHorizontal className="w-3 h-3 text-zinc-500" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent text-zinc-300 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="newest" className="bg-zinc-900">Newest</option>
                      <option value="oldest" className="bg-zinc-900">Oldest</option>
                      <option value="alphabetical" className="bg-zinc-900">A-Z</option>
                    </select>
                  </div>

                  <button
                    onClick={loadData}
                    disabled={loading}
                    className="p-2 text-zinc-400 hover:text-zinc-200 bg-zinc-950/80 hover:bg-white/[0.05] border border-white/[0.06] rounded-lg transition-colors"
                    title="Refresh data"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Category Segmented Controls */}
              <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-0.5 text-[11px] rounded-md transition-all font-mono ${
                        selectedCategory === cat
                          ? 'bg-zinc-100 text-zinc-950 font-medium shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] font-mono text-zinc-500 whitespace-nowrap pl-2">
                  <span>{filteredNotes.length} notes</span>
                </div>
              </div>
            </div>

            {/* Notes Grid */}
            {loading ? (
              <div className="py-20 text-center space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin text-zinc-400 mx-auto opacity-70" />
                <p className="text-xs text-zinc-500 font-mono">Loading notes...</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="border border-dashed border-white/[0.08] rounded-xl p-12 text-center space-y-2.5">
                <FolderOpen className="w-6 h-6 text-zinc-600 mx-auto" />
                <h3 className="text-xs font-semibold text-zinc-300">No notes found</h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  {searchQuery || selectedCategory !== 'All'
                    ? 'No matching notes. Try clearing your filter.'
                    : 'Your workspace is empty. Create your first note above.'}
                </p>
                <button
                  onClick={() => {
                    setEditingNote(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-950 bg-zinc-100 hover:bg-white rounded-lg transition-colors cursor-pointer mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Note</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={(n) => {
                      setEditingNote(n);
                      setIsModalOpen(true);
                    }}
                    onDelete={(id) => setDeleteConfirmId(id)}
                    onSummarize={handleSummarizeNote}
                    isSummarizing={summarizingId === note.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Database Schema & Records */}
        {activeTab === 'mysql' && (
          <MysqlInspector onRefreshNotes={loadData} />
        )}

        {/* Tab 3: FastAPI Swagger & REST Runner */}
        {activeTab === 'api' && (
          <ApiTester />
        )}

        {/* Tab 4: Backend Code Repository */}
        {activeTab === 'code' && (
          <CodeBrowser />
        )}

        {/* Tab 5: Roadmap & Git Submission */}
        {activeTab === 'checklist' && (
          <InternChecklist />
        )}
      </main>

      {/* Note Creation / Editing Modal */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        initialNote={editingNote}
      />

      {/* Minimalist Delete Confirmation Dialog */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-zinc-900 border border-white/[0.1] rounded-xl p-5 shadow-2xl text-zinc-100 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Delete note #{deleteConfirmId}?</h3>
              <p className="text-xs text-zinc-400 mt-1">This operation cannot be undone.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3.5 py-1.5 text-xs font-medium bg-rose-500/90 text-white hover:bg-rose-500 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-2 duration-150">
          <div
            className={`px-3 py-2 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 border ${
              toastMessage.type === 'error'
                ? 'bg-rose-950/90 border-rose-800 text-rose-200'
                : toastMessage.type === 'info'
                ? 'bg-blue-950/90 border-blue-800 text-blue-200'
                : 'bg-zinc-900/95 border-white/[0.1] text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
