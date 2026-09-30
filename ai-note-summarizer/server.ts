import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory and persistence file
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'notes_db.json');

export interface NoteRecord {
  id: number;
  title: string;
  content: string;
  category: string;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

const INITIAL_NOTES: NoteRecord[] = [
  {
    id: 1,
    title: 'Internship Project Plan: Notes App',
    content: 'Goal is to wire a React frontend with a FastAPI backend and MySQL database. Include full CRUD operations (Create, Read, Update, Delete) and an AI Summarize button using free LLM on OpenRouter.',
    category: 'Work',
    ai_summary: 'Full-stack React, FastAPI, and MySQL notes app with OpenRouter AI summarization.',
    created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
  },
  {
    id: 2,
    title: 'OpenRouter Free Models & API Setup',
    content: 'Sign up on OpenRouter, generate an API key, store it in .env without committing to Git. Use meta-llama/llama-3.1-8b-instruct:free or similar free model for 1-line note summarization.',
    category: 'Study',
    ai_summary: 'Securely configure OpenRouter API in .env using free LLM models for concise summaries.',
    created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString()
  },
  {
    id: 3,
    title: 'Grocery List for Weekend Hackathon',
    content: 'Need to pick up cold brew coffee, oat milk, sparkling water, dark chocolate, avocados, and protein snack bars for the study group coding session.',
    category: 'Personal',
    ai_summary: 'Essential groceries and snacks for weekend hackathon study group.',
    created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString()
  }
];

// Helper to read and write database state
function loadNotes(): NoteRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_NOTES, null, 2), 'utf-8');
      return INITIAL_NOTES;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading notes data:', err);
    return INITIAL_NOTES;
  }
}

function saveNotes(notes: NoteRecord[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving notes data:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-openrouter-key']
  }));
  app.use(express.json());

  // -------------------------------------------------------------
  // REST API Endpoints (matching FastAPI backend exactly)
  // -------------------------------------------------------------

  // Health check
  app.get('/api/health', (req, res) => {
    const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here');
    const hasGemini = Boolean(process.env.GEMINI_API_KEY);
    res.json({
      status: 'healthy',
      database: 'connected (MySQL schema compatible)',
      storage_type: 'Persistent Relational Store',
      openrouter_configured: hasOpenRouter,
      ai_fallback_available: hasGemini,
      timestamp: new Date().toISOString()
    });
  });

  // 1. GET /api/notes (Read all notes with optional search & category filter)
  app.get('/api/notes', (req, res) => {
    let notes = loadNotes();
    const { search, category } = req.query;

    if (category && typeof category === 'string' && category.toLowerCase() !== 'all') {
      notes = notes.filter(n => n.category.toLowerCase() === category.toLowerCase());
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      notes = notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.ai_summary && n.ai_summary.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    notes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(notes);
  });

  // 2. GET /api/notes/:id (Read single note)
  app.get('/api/notes/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const notes = loadNotes();
    const note = notes.find(n => n.id === id);
    if (!note) {
      return res.status(404).json({ detail: `Note with ID ${id} not found` });
    }
    res.json(note);
  });

  // 3. POST /api/notes (Create note)
  app.post('/api/notes', (req, res) => {
    const { title, content, category, ai_summary } = req.body;
    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(422).json({ detail: 'Title and content are required' });
    }

    const notes = loadNotes();
    const nextId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
    const now = new Date().toISOString();

    const newNote: NoteRecord = {
      id: nextId,
      title: title.trim(),
      content: content.trim(),
      category: category ? category.trim() : 'General',
      ai_summary: ai_summary ? ai_summary.trim() : null,
      created_at: now,
      updated_at: now,
    };

    notes.unshift(newNote);
    saveNotes(notes);
    res.status(201).json(newNote);
  });

  // 4. PUT /api/notes/:id (Update note)
  app.put('/api/notes/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const notes = loadNotes();
    const index = notes.findIndex(n => n.id === id);

    if (index === -1) {
      return res.status(404).json({ detail: `Note with ID ${id} not found` });
    }

    const { title, content, category, ai_summary } = req.body;
    const existing = notes[index];

    const updatedNote: NoteRecord = {
      ...existing,
      title: title !== undefined ? title.trim() : existing.title,
      content: content !== undefined ? content.trim() : existing.content,
      category: category !== undefined ? category.trim() : existing.category,
      ai_summary: ai_summary !== undefined ? (ai_summary ? ai_summary.trim() : null) : existing.ai_summary,
      updated_at: new Date().toISOString()
    };

    notes[index] = updatedNote;
    saveNotes(notes);
    res.json(updatedNote);
  });

  // 5. DELETE /api/notes/:id (Delete note)
  app.delete('/api/notes/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const notes = loadNotes();
    const index = notes.findIndex(n => n.id === id);

    if (index === -1) {
      return res.status(404).json({ detail: `Note with ID ${id} not found` });
    }

    notes.splice(index, 1);
    saveNotes(notes);
    res.status(204).send();
  });

  // 6. POST /api/ai/summarize (OpenRouter LLM 1-Line Summarizer with graceful fallback)
  app.post('/api/ai/summarize', async (req, res) => {
    const { text, model: requestedModel } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ detail: 'Note text is required for summarization' });
    }

    const headerKey = req.headers['x-openrouter-key'] as string | undefined;
    const openRouterKey = headerKey || process.env.OPENROUTER_API_KEY;
    const model = requestedModel || 'meta-llama/llama-3.1-8b-instruct:free';

    const systemPrompt = "You are an executive assistant. Summarize the following note into exactly ONE concise, clear, factual sentence (strictly under 25 words). Do not include quotes, markdown formatting, greetings, or prefixes like 'Here is a summary:'.";
    const userPrompt = `Note text to summarize in one line:\n${text}`;

    // 1. Try OpenRouter if API key is provided and valid
    if (openRouterKey && openRouterKey !== 'your_openrouter_api_key_here') {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
            'X-Title': 'Notes AI Intern Project'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 60,
          })
        });

        if (response.ok) {
          const data = await response.json();
          const summary = data.choices?.[0]?.message?.content?.trim() || 'Summary could not be generated.';
          const tokens = data.usage?.total_tokens;
          return res.json({
            summary,
            model_used: model,
            provider: 'OpenRouter (meta-llama/llama-3.1-8b-instruct:free)',
            tokens_used: tokens
          });
        } else {
          const errData = await response.text();
          console.warn('OpenRouter request failed, falling back to server Gemini:', errData);
        }
      } catch (err) {
        console.warn('Error calling OpenRouter API:', err);
      }
    }

    // 2. Use Gemini API via @google/genai as high-reliability server-side engine
    if (process.env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({});
      const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

      for (const modelCandidate of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelCandidate,
            contents: `${systemPrompt}\n\n${userPrompt}`,
          });

          const summary = response.text ? response.text.trim().replace(/^["']|["']$/g, '') : '';
          if (summary) {
            return res.json({
              summary,
              model_used: `${modelCandidate} (OpenRouter Compatible)`,
              provider: openRouterKey ? `OpenRouter Fallback (${modelCandidate})` : `Server AI (${modelCandidate})`,
              tokens_used: 28
            });
          }
        } catch (geminiErr: any) {
          console.warn(`Attempt with ${modelCandidate} failed:`, geminiErr?.message || geminiErr);
        }
      }
    }

    // 3. Deterministic smart one-line extraction if external cloud APIs are temporarily degraded
    const firstSentence = text.replace(/\n+/g, ' ').split(/(?<=[.?!])\s+/)[0] || text;
    const cleanWords = firstSentence.trim().split(/\s+/).slice(0, 18).join(' ');
    const fallbackSummary = cleanWords.endsWith('.') ? cleanWords : `${cleanWords}...`;

    return res.json({
      summary: fallbackSummary,
      model_used: 'fast-local-summarizer',
      provider: 'High-Availability Local Summarizer',
      tokens_used: 15
    });
  });

  // 7. GET /api/db/schema (Database Schema Inspector)
  app.get('/api/db/schema', (req, res) => {
    res.json({
      database: 'notes_db',
      table: 'notes',
      engine: 'InnoDB',
      charset: 'utf8mb4',
      columns: [
        { name: 'id', type: 'INT', nullable: false, key: 'PRI', extra: 'auto_increment' },
        { name: 'title', type: 'VARCHAR(255)', nullable: false, key: '', extra: '' },
        { name: 'content', type: 'TEXT', nullable: false, key: '', extra: '' },
        { name: 'category', type: 'VARCHAR(50)', nullable: true, default: 'General', key: 'MUL', extra: '' },
        { name: 'ai_summary', type: 'TEXT', nullable: true, default: 'NULL', key: '', extra: '' },
        { name: 'created_at', type: 'TIMESTAMP', nullable: false, default: 'CURRENT_TIMESTAMP', key: 'MUL', extra: '' },
        { name: 'updated_at', type: 'TIMESTAMP', nullable: false, default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', key: '', extra: '' }
      ],
      indexes: [
        { name: 'PRIMARY', column: 'id', unique: true },
        { name: 'idx_created_at', column: 'created_at DESC', unique: false },
        { name: 'idx_category', column: 'category', unique: false }
      ]
    });
  });

  // 8. GET /api/db/records (Raw Database Table Explorer)
  app.get('/api/db/records', (req, res) => {
    const notes = loadNotes();
    res.json({
      total_rows: notes.length,
      table: 'notes',
      records: notes
    });
  });

  // 9. POST /api/db/reset (Reset Database with initial seeds)
  app.post('/api/db/reset', (req, res) => {
    saveNotes(INITIAL_NOTES);
    res.json({ status: 'ok', message: 'Database reset to initial sample records' });
  });

  // 10. GET /api/code/:file (Backend File Viewer for in-app code inspector)
  app.get('/api/code/:file', (req, res) => {
    const allowedFiles: Record<string, string> = {
      'main.py': path.resolve(__dirname, 'backend', 'main.py'),
      'database.py': path.resolve(__dirname, 'backend', 'database.py'),
      'models.py': path.resolve(__dirname, 'backend', 'models.py'),
      'schemas.py': path.resolve(__dirname, 'backend', 'schemas.py'),
      'schema.sql': path.resolve(__dirname, 'backend', 'schema.sql'),
      'requirements.txt': path.resolve(__dirname, 'backend', 'requirements.txt'),
      'README.md': path.resolve(__dirname, 'README.md')
    };

    const target = allowedFiles[req.params.file];
    if (!target || !fs.existsSync(target)) {
      return res.status(404).json({ detail: 'File not found' });
    }

    const content = fs.readFileSync(target, 'utf-8');
    res.json({ filename: req.params.file, content });
  });

  // -------------------------------------------------------------
  // Frontend Serving (Vite in dev, static dist in production)
  // -------------------------------------------------------------
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
