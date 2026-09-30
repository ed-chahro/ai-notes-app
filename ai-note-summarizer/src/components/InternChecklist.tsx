import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Github, 
  Copy, 
  Check, 
  BookOpen
} from 'lucide-react';

export const InternChecklist: React.FC = () => {
  const [copiedGit, setCopiedGit] = useState(false);

  const gitSnippet = `# 1. Initialize git repository
git init

# 2. Add files and ignore sensitive credentials
git add .

# 3. Create initial commit
git commit -m "feat: complete Full-Stack Notes App with FastAPI, MySQL/SQLite, React, and OpenRouter AI"

# 4. Set default branch to main
git branch -M main

# 5. Link your GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/notes-ai-fastapi-react.git
git push -u origin main`;

  const handleCopyGit = () => {
    navigator.clipboard.writeText(gitSnippet);
    setCopiedGit(true);
    setTimeout(() => setCopiedGit(false), 1500);
  };

  const WEEKS = [
    {
      week: 'Week 1',
      title: 'Python Basics',
      topics: 'Variables, loops, lists, dictionaries, functions, text files, JSON.',
      status: 'Done',
      built: 'Practice scripts & terminal CRUD'
    },
    {
      week: 'Week 2',
      title: 'FastAPI + Database',
      topics: 'MySQL & SQLite, CRUD endpoints, SQLAlchemy models, Pydantic schemas.',
      status: 'Done',
      built: 'Relational Notes REST API'
    },
    {
      week: 'Week 3',
      title: 'AI + React Basics',
      topics: 'OpenRouter free LLM (Llama 3.1 8B), Vite setup, component state, fetch.',
      status: 'Done',
      built: 'AI summarizer & React UI'
    },
    {
      week: 'Week 4',
      title: 'Integration & Ship',
      topics: 'Wired frontend & backend, resolved CORS, README.md, GitHub push.',
      status: 'Complete',
      built: 'Full-stack application'
    },
  ];

  return (
    <div className="space-y-5">
      {/* Mentor & Submission Card */}
      <div className="bg-zinc-900/40 border border-white/[0.06] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                Intern Manual · Project #2
              </span>
            </div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Project Submission & Verification
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed italic">
              &ldquo;I wired the frontend and backend together into a single workflow. Users can create, read, edit, and delete notes stored in MySQL, and clicking an &apos;AI Summarize&apos; button sends the note text to OpenRouter to return a concise one-line summary in the UI. I wrapped up by resolving CORS and routing issues, writing a README.md with setup steps, and pushing the final repository to GitHub.&rdquo;
            </p>
          </div>

          <div className="self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] border border-white/[0.08] text-zinc-200 text-xs font-mono rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Ready</span>
            </span>
          </div>
        </div>
      </div>

      {/* Checklist from Page 6 of Intern Manual */}
      <div className="bg-zinc-900/40 border border-white/[0.06] rounded-xl p-5">
        <h3 className="text-xs font-semibold text-zinc-200 mb-3 flex items-center gap-1.5 font-mono uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
          <span>Manual Requirements (Page 6)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Backend Requirements */}
          <div className="p-3 bg-zinc-950/60 border border-white/[0.04] rounded-lg space-y-2">
            <h4 className="text-[11px] font-semibold text-zinc-400 uppercase font-mono">
              Backend
            </h4>
            <ul className="space-y-1.5 text-zinc-300 text-xs">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>FastAPI with 4 CRUD endpoints:</strong> GET, POST, PUT, DELETE for notes.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Database persistence:</strong> Relational schema with SQLite local fallback mode.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>OpenRouter AI endpoint:</strong> POST /ai/summarize generating 1-sentence summaries.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Key security:</strong> Secrets isolated to .env, protected by .gitignore.</span>
              </li>
            </ul>
          </div>

          {/* Frontend & Submission Requirements */}
          <div className="p-3 bg-zinc-950/60 border border-white/[0.04] rounded-lg space-y-2">
            <h4 className="text-[11px] font-semibold text-zinc-400 uppercase font-mono">
              Frontend & Ship
            </h4>
            <ul className="space-y-1.5 text-zinc-300 text-xs">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>React UI:</strong> Minimalist responsive views to add, view, edit, and delete notes.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>AI Button:</strong> One-click note summarization in UI and editor.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>CORS & Routing:</strong> Fully resolved without browser cross-origin blocks.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>README.md:</strong> Architecture docs, setup steps, and git commands.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4-Week Roadmap Progression */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {WEEKS.map((w) => (
          <div key={w.week} className="p-3.5 bg-zinc-900/40 border border-white/[0.06] rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1 text-[11px] font-mono">
                <span className="text-zinc-300 font-semibold">{w.week}</span>
                <span className="text-emerald-400">{w.status}</span>
              </div>
              <h4 className="text-xs font-semibold text-zinc-200 mb-1">{w.title}</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">{w.topics}</p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-white/[0.04] text-[10px] text-zinc-500 font-mono">
              {w.built}
            </div>
          </div>
        ))}
      </div>

      {/* GitHub Push Guide */}
      <div className="bg-zinc-900/40 border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Github className="w-4 h-4 text-zinc-300" />
            <h3 className="text-xs font-semibold text-zinc-200 font-mono">GitHub Setup & Push Commands</h3>
          </div>
          <button
            onClick={handleCopyGit}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-300 bg-white/[0.04] hover:bg-white/[0.08] rounded-md border border-white/[0.08] transition-colors font-mono"
          >
            {copiedGit ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedGit ? 'Copied' : 'Copy Commands'}</span>
          </button>
        </div>

        <div className="p-3.5 bg-zinc-950/80 rounded-lg border border-white/[0.06] overflow-x-auto">
          <pre className="font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {gitSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
};
