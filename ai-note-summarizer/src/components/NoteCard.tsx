import React, { useState } from 'react';
import { 
  Sparkles, 
  Edit2, 
  Trash2, 
  Copy, 
  Check, 
  RotateCw
} from 'lucide-react';
import { Note } from '../types';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
  onSummarize: (note: Note) => Promise<void>;
  isSummarizing: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onSummarize,
  isSummarizing
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!note.ai_summary) return;
    navigator.clipboard.writeText(note.ai_summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  const wordCount = note.content ? note.content.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <article className="group bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/[0.06] hover:border-white/[0.14] rounded-xl p-5 transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Unboxed Metadata Header (Zero-Pill Rule) */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-2 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-300 font-medium">{note.category || 'General'}</span>
            <span aria-hidden="true" className="text-zinc-700">·</span>
            <span>{formatDate(note.created_at)}</span>
            <span aria-hidden="true" className="text-zinc-700">·</span>
            <span>{wordCount}w</span>
          </div>

          <span className="text-zinc-600">#{note.id}</span>
        </div>

        {/* Note Title */}
        <h3 className="text-sm font-semibold text-zinc-100 tracking-tight mb-2 group-hover:text-white transition-colors">
          {note.title}
        </h3>

        {/* Note Content */}
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 whitespace-pre-wrap font-normal">
          {note.content}
        </p>

        {/* AI Summary Block (Minimalist & Understated) */}
        {note.ai_summary ? (
          <div className="mt-3.5 pt-2.5 border-t border-white/[0.05] bg-white/[0.02] rounded-lg p-2.5 border-l-2 border-l-zinc-400">
            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mb-1">
              <span className="flex items-center gap-1 text-zinc-300 font-medium">
                <Sparkles className="w-2.5 h-2.5 text-zinc-400" />
                AI Summary
              </span>
              <button
                onClick={handleCopySummary}
                className="text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
                title="Copy AI summary"
              >
                {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-xs text-zinc-300 leading-snug italic font-normal">
              &ldquo;{note.ai_summary}&rdquo;
            </p>
          </div>
        ) : null}
      </div>

      {/* Card Footer Actions */}
      <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between">
        {/* AI Summarize Trigger */}
        <button
          onClick={() => onSummarize(note)}
          disabled={isSummarizing}
          className={`flex items-center gap-1.5 px-2 py-1 text-[11px] rounded-md transition-all font-mono ${
            note.ai_summary
              ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
              : 'text-zinc-200 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08]'
          }`}
          title={note.ai_summary ? 'Re-generate summary' : 'Generate 1-line AI summary'}
        >
          {isSummarizing ? (
            <RotateCw className="w-3 h-3 animate-spin text-zinc-400" />
          ) : (
            <Sparkles className="w-3 h-3 text-zinc-400" />
          )}
          <span>{isSummarizing ? 'Summarizing...' : note.ai_summary ? 'Re-summarize' : 'AI Summarize'}</span>
        </button>

        {/* Edit and Delete Actions */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onEdit(note)}
            className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] rounded-md transition-colors"
            title="Edit note"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-white/[0.05] rounded-md transition-colors"
            title="Delete note"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </article>
  );
};
