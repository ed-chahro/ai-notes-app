export interface Note {
  id: number;
  title: string;
  content: string;
  category: string;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteCreateInput {
  title: string;
  content: string;
  category?: string;
  ai_summary?: string | null;
}

export interface NoteUpdateInput {
  title?: string;
  content?: string;
  category?: string;
  ai_summary?: string | null;
}

export interface SummarizeResponse {
  summary: string;
  model_used: string;
  provider: string;
  tokens_used?: number;
}

export interface DatabaseSchema {
  database: string;
  table: string;
  engine: string;
  charset: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    default?: string;
    key: string;
    extra: string;
  }>;
  indexes: Array<{
    name: string;
    column: string;
    unique: boolean;
  }>;
}

export interface HealthInfo {
  status: string;
  database: string;
  storage_type: string;
  openrouter_configured: boolean;
  ai_fallback_available: boolean;
  timestamp: string;
}
