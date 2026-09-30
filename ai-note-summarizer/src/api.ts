import { Note, NoteCreateInput, NoteUpdateInput, SummarizeResponse, DatabaseSchema, HealthInfo } from './types';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const customKey = localStorage.getItem('user_openrouter_key');
  if (customKey && customKey.trim()) {
    headers['x-openrouter-key'] = customKey.trim();
  }
  return headers;
}

export async function fetchHealth(): Promise<HealthInfo> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchNotes(params?: { search?: string; category?: string }): Promise<Note[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.category && params.category !== 'All') query.append('category', params.category);

  const url = `${API_BASE}/notes${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to load notes: ${res.statusText}`);
  return res.json();
}

export async function fetchNoteById(id: number): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Note ${id} not found`);
  return res.json();
}

export async function createNote(input: NoteCreateInput): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create note');
  }
  return res.json();
}

export async function updateNote(id: number, input: NoteUpdateInput): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update note');
  }
  return res.json();
}

export async function deleteNote(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to delete note');
  }
}

export async function summarizeText(text: string, model?: string): Promise<SummarizeResponse> {
  const res = await fetch(`${API_BASE}/ai/summarize`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text, model }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to generate AI summary');
  }
  return res.json();
}

export async function fetchDbSchema(): Promise<DatabaseSchema> {
  const res = await fetch(`${API_BASE}/db/schema`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to load database schema');
  return res.json();
}

export async function fetchDbRecords(): Promise<{ total_rows: number; table: string; records: Note[] }> {
  const res = await fetch(`${API_BASE}/db/records`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to load database records');
  return res.json();
}

export async function resetDatabase(): Promise<void> {
  const res = await fetch(`${API_BASE}/db/reset`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to reset database');
}

export async function fetchBackendCode(filename: string): Promise<{ filename: string; content: string }> {
  const res = await fetch(`${API_BASE}/code/${filename}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to load file ${filename}`);
  return res.json();
}
