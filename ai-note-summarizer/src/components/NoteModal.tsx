import React, { useState, useEffect } from 'react';
import { X, Sparkles, RotateCw, Check } from 'lucide-react';
import { Note, NoteCreateInput } from '../types';
import { summarizeText } from '../api';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NoteCreateInput) => Promise<void>;
  initialNote?: Note | null;
}

const CATEGORIES = ['Work', 'Study', 'Personal', 'Ideas', 'Meeting', 'General'];

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialNote
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title);
      setContent(initialNote.content);
      setCategory(initialNote.category || 'General');
      setAiSummary(initialNote.ai_summary || '');
    } else {
      setTitle('');
      setContent('');
      setCategory('General');
      setAiSummary('');
    }
    setError(null);
  }, [initialNote, isOpen]);

  if (!isOpen) return null;

  const handleAiSummarize = async () => {
    if (!content.trim()) {
      setError('Please write some note content first.');
      return;
    }
    setError(null);
    setIsSummarizing(true);
    try {
      const res = await summarizeText(content);
      setAiSummary(res.summary);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate AI summary');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and note content are required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        category,
        ai_summary: aiSummary.trim() || null
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error saving note to database');
    } finally {
      setIsSaving(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-zinc-900 border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-zinc-400">
              {initialNote ? `Edit Note #${initialNote.id}` : 'New Note'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-2.5 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg">
              {error}
            </div>
          )}

          {/* Minimalist Title */}
          <div>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              className="w-full text-base font-medium text-zinc-100 placeholder:text-zinc-600 bg-transparent border-b border-white/[0.08] focus:border-zinc-400 pb-2 focus:outline-none transition-colors"
            />
          </div>

          {/* Category Selector (Segmented buttons) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] text-zinc-500 font-mono mr-1">Category:</span>
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-0.5 text-[11px] rounded-md transition-all font-mono ${
                  category === cat
                    ? 'bg-zinc-100 text-zinc-950 font-medium shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div>
            <textarea
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start typing your note..."
              className="w-full text-xs text-zinc-200 placeholder:text-zinc-600 bg-zinc-950/60 border border-white/[0.06] rounded-lg p-3 leading-relaxed focus:outline-none focus:border-white/[0.2] transition-colors resize-y min-h-[140px]"
            />
            <div className="mt-1 flex justify-end text-[10px] font-mono text-zinc-600">
              <span>{wordCount} words</span>
            </div>
          </div>

          {/* AI Summarize Block */}
          <div className="p-3 bg-zinc-950/50 border border-white/[0.06] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-400 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-zinc-400" />
                AI One-Line Summary
              </span>
              <button
                type="button"
                onClick={handleAiSummarize}
                disabled={isSummarizing || !content.trim()}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-zinc-200 bg-white/[0.06] hover:bg-white/[0.1] active:bg-white/[0.15] border border-white/[0.08] rounded-md transition-all disabled:opacity-40"
              >
                {isSummarizing ? (
                  <>
                    <RotateCw className="w-3 h-3 animate-spin text-zinc-400" />
                    <span>Summarizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-zinc-400" />
                    <span>{aiSummary ? 'Re-summarize' : 'Summarize with AI'}</span>
                  </>
                )}
              </button>
            </div>

            <input
              type="text"
              value={aiSummary}
              onChange={(e) => setAiSummary(e.target.value)}
              placeholder="Click 'Summarize with AI' above or enter a one-line summary..."
              className="w-full px-2.5 py-1.5 text-xs bg-zinc-900 border border-white/[0.06] rounded-md text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 italic font-normal"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-zinc-100 text-zinc-950 hover:bg-white active:bg-zinc-200 rounded-lg shadow-sm transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{initialNote ? 'Save Changes' : 'Create Note'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
