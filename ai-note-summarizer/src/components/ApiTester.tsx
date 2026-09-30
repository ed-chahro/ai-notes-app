import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  Copy, 
  Check, 
  Clock, 
  ArrowRight,
  Code
} from 'lucide-react';

interface EndpointConfig {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  defaultPayload?: string;
  hasBody: boolean;
}

const ENDPOINTS: EndpointConfig[] = [
  {
    id: 'get-all',
    method: 'GET',
    path: '/api/notes',
    description: 'Retrieve all notes ordered by created_at DESC (supports ?search=&category=)',
    hasBody: false,
  },
  {
    id: 'create-note',
    method: 'POST',
    path: '/api/notes',
    description: 'Insert a new note into database',
    hasBody: true,
    defaultPayload: JSON.stringify({
      title: 'FastAPI + React Integration Test',
      content: 'Testing REST CRUD communication between React frontend and FastAPI backend.',
      category: 'Work',
      ai_summary: null
    }, null, 2),
  },
  {
    id: 'get-single',
    method: 'GET',
    path: '/api/notes/1',
    description: 'Retrieve a single note by ID',
    hasBody: false,
  },
  {
    id: 'update-note',
    method: 'PUT',
    path: '/api/notes/1',
    description: 'Update note fields in database',
    hasBody: true,
    defaultPayload: JSON.stringify({
      title: 'Updated Note Title',
      content: 'Updated content with revised requirements.',
      category: 'Work'
    }, null, 2),
  },
  {
    id: 'ai-summarize',
    method: 'POST',
    path: '/api/ai/summarize',
    description: 'Send text to OpenRouter free LLM for 1-sentence summary',
    hasBody: true,
    defaultPayload: JSON.stringify({
      text: 'Docker containerization makes deployment consistent across environments. It bundles the application with its system dependencies, runtime, and configuration into a single immutable image.',
      model: 'meta-llama/llama-3.1-8b-instruct:free'
    }, null, 2),
  },
  {
    id: 'delete-note',
    method: 'DELETE',
    path: '/api/notes/999',
    description: 'Delete a note by ID (returns 204 or 404)',
    hasBody: false,
  },
];

export const ApiTester: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointConfig>(ENDPOINTS[0]);
  const [requestUrl, setRequestUrl] = useState(ENDPOINTS[0].path);
  const [requestBody, setRequestBody] = useState(ENDPOINTS[0].defaultPayload || '');
  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const handleSelectEndpoint = (ep: EndpointConfig) => {
    setSelectedEndpoint(ep);
    setRequestUrl(ep.path);
    setRequestBody(ep.defaultPayload || '');
    setResponseStatus(null);
    setResponseData(null);
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setResponseStatus(null);
    setResponseData(null);
    const start = performance.now();

    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const customKey = localStorage.getItem('user_openrouter_key');
      if (customKey) {
        (options.headers as Record<string, string>)['x-openrouter-key'] = customKey;
      }

      if (selectedEndpoint.hasBody && requestBody.trim()) {
        options.body = requestBody;
      }

      const res = await fetch(requestUrl, options);
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setResponseStatus(res.status);

      if (res.status === 204) {
        setResponseData('// 204 No Content (Deleted Successfully)');
      } else {
        const json = await res.json().catch(() => null);
        setResponseData(json ? JSON.stringify(json, null, 2) : await res.text());
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setResponseStatus(500);
      setResponseData(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCurl = () => {
    let curl = `curl -X ${selectedEndpoint.method} "http://localhost:3000${requestUrl}"`;
    if (selectedEndpoint.hasBody && requestBody.trim()) {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBody.replace(/\n/g, '')}'`;
    }
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 1500);
  };

  const getMethodBadgeClass = (m: string) => {
    switch (m) {
      case 'GET': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'POST': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'PUT': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'DELETE': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-zinc-400 bg-white/[0.05] border-white/[0.08]';
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-zinc-900/40 border border-white/[0.06] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">REST API Runner</h2>
              <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                Directly execute endpoints with live status and latency benchmarks
              </p>
            </div>
          </div>
          <button
            onClick={handleCopyCurl}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-300 bg-white/[0.04] hover:bg-white/[0.08] rounded-md border border-white/[0.08] transition-colors font-mono self-start sm:self-auto"
          >
            {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Endpoint Directory */}
        <div className="lg:col-span-4 bg-zinc-900/40 border border-white/[0.06] rounded-xl p-3.5 space-y-1.5">
          <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-2 mb-2 font-mono">
            FastAPI Routes
          </h3>
          <div className="space-y-1">
            {ENDPOINTS.map((ep) => {
              const isSelected = selectedEndpoint.id === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between font-mono ${
                    isSelected
                      ? 'bg-zinc-800 text-white border border-white/[0.08]'
                      : 'hover:bg-white/[0.03] text-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getMethodBadgeClass(ep.method)}`}>
                      {ep.method}
                    </span>
                    <span className="truncate">{ep.path}</span>
                  </div>
                  <ArrowRight className={`w-3 h-3 ${isSelected ? 'text-zinc-200' : 'text-zinc-600'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Request & Response Playground */}
        <div className="lg:col-span-8 bg-zinc-900/40 border border-white/[0.06] rounded-xl p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold border ${getMethodBadgeClass(selectedEndpoint.method)}`}>
                {selectedEndpoint.method}
              </span>
              <span className="text-xs text-zinc-400">{selectedEndpoint.description}</span>
            </div>

            {/* URL Input Bar */}
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-zinc-950/80 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-300">
                <span className="text-zinc-600 mr-1">:3000</span>
                <input
                  type="text"
                  value={requestUrl}
                  onChange={(e) => setRequestUrl(e.target.value)}
                  className="bg-transparent flex-1 text-zinc-100 focus:outline-none"
                />
              </div>
              <button
                onClick={handleExecute}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{isLoading ? 'Executing...' : 'Send'}</span>
              </button>
            </div>
          </div>

          {/* Request Body Editor */}
          {selectedEndpoint.hasBody && (
            <div>
              <label className="block text-[11px] font-mono text-zinc-500 mb-1">Body (JSON)</label>
              <textarea
                rows={4}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full p-2.5 text-xs font-mono bg-zinc-950/80 border border-white/[0.08] rounded-lg text-zinc-300 focus:outline-none focus:border-white/[0.2]"
              />
            </div>
          )}

          {/* Response Section */}
          <div className="pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-400 font-mono">Response</span>
                {responseStatus !== null && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {responseStatus}
                  </span>
                )}
              </div>
              {responseTime !== null && (
                <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{responseTime} ms</span>
                </div>
              )}
            </div>

            <div className="bg-zinc-950/90 border border-white/[0.06] rounded-lg p-3 min-h-[140px] max-h-[300px] overflow-y-auto">
              {responseData ? (
                <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap">{responseData}</pre>
              ) : (
                <div className="h-28 flex flex-col items-center justify-center text-zinc-600 text-xs font-mono">
                  <Code className="w-5 h-5 mb-1.5 opacity-30" />
                  <span>Execute request to view response</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
