'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

interface Citation {
  sourceNumber: number;
  filename: string;
  excerpt: string;
  pageNumber: number | null;
}

const suggestions = [
  'What are the main concepts in this document?',
  'Summarize the key points',
  'What technologies are mentioned?',
  'What are the conclusions?',
];

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState('Workspace');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      api.get(`/api/workspaces/${workspaceId}`)
        .then(res => setWorkspaceName(res.data.name))
        .catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.trim() === '') return <div key={i} style={{ height: 6 }} />;

      if (line.startsWith('## ')) return (
        <p key={i} style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4, marginTop: 12 }}>
          {line.replace('## ', '')}
        </p>
      );

      if (line.startsWith('### ')) return (
        <p key={i} style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 4, marginTop: 8 }}>
          {line.replace('### ', '')}
        </p>
      );

      if (line.startsWith('**') && line.endsWith('**') && line.length > 4) return (
        <p key={i} style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4, marginTop: 10 }}>
          {line.slice(2, -2)}
        </p>
      );

      if (line.startsWith('* ') || line.startsWith('- ')) {
        const content = line.replace(/^\* |^- /, '');
        return (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, paddingLeft: 4 }}>
            <span style={{ color: 'var(--blue)', flexShrink: 0, marginTop: 2, fontWeight: 700 }}>•</span>
            <span style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text)' }}>{renderInline(content)}</span>
          </div>
        );
      }

      if (/^\d+\. /.test(line)) {
        const num = line.match(/^(\d+)\. /)?.[1];
        const content = line.replace(/^\d+\. /, '');
        return (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, paddingLeft: 4 }}>
            <span style={{ color: 'var(--blue)', flexShrink: 0, fontWeight: 600, minWidth: 18 }}>{num}.</span>
            <span style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text)' }}>{renderInline(content)}</span>
          </div>
        );
      }

      return (
        <p key={i} style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', marginBottom: 4 }}>
          {renderInline(line)}
        </p>
      );
    });
  };

  const sendMessage = async (text?: string) => {
    const question = text || input.trim();
    if (!question || thinking) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setThinking(true);
    try {
      const res = await api.post('/api/chat/query', { workspaceId, question, sessionId });
      setSessionId(res.data.sessionId);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.answer,
        citations: res.data.citations,
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 20, height: 20, border: '2px solid var(--blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* Navbar */}
      <nav style={{ padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.push(`/workspace/${workspaceId}`)} style={{ color: 'var(--text2)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Back
          </button>
          <span style={{ color: 'var(--border2)' }}>/</span>
          <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{workspaceName}</span>
          <span style={{ color: 'var(--border2)' }}>/</span>
          <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>Chat</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href={`/graph/${workspaceId}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text2)', fontSize: 13 }}>
            🕸️ Graph
          </Link>
          <button
            onClick={() => { setMessages([]); setSessionId(null); }}
            style={{ padding: '6px 14px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}
          >
            New Chat
          </button>
        </div>
      </nav>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {/* Empty state */}
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <div style={{ width: 56, height: 56, background: 'var(--blue)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>💬</div>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Ask anything</h2>
              <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 32 }}>
                Ask questions about documents in <strong>{workspaceName}</strong>
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 480, margin: '0 auto' }}>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    style={{ padding: '12px 16px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer', textAlign: 'left', lineHeight: 1.4, transition: 'border-color 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--blue)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '82%' }}>

                  {/* Assistant label */}
                  {msg.role === 'assistant' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 26, height: 26, background: 'var(--blue)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>N</span>
                      </div>
                      <span style={{ color: 'var(--text2)', fontSize: 12, fontWeight: 500 }}>NexGrph</span>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user' ? 'var(--blue)' : 'var(--bg2)',
                    color: msg.role === 'user' ? 'white' : 'var(--text)',
                    fontSize: 14,
                    lineHeight: 1.7,
                    border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    {msg.role === 'user' ? msg.content : renderMarkdown(msg.content)}
                  </div>

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <p style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Sources</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {msg.citations.map((c, j) => (
                          <div key={j} style={{ padding: '10px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--blue)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ color: 'var(--blue)', fontSize: 11, fontWeight: 600 }}>[{c.sourceNumber}]</span>
                              <span style={{ color: 'var(--text2)', fontSize: 11, fontWeight: 500 }}>📄 {c.filename}</span>
                              {c.pageNumber && <span style={{ color: 'var(--text3)', fontSize: 11 }}>p.{c.pageNumber}</span>}
                            </div>
                            <p style={{ color: 'var(--text3)', fontSize: 12, lineHeight: 1.5 }}>{c.excerpt}...</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {thinking && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 26, height: 26, background: 'var(--blue)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>N</span>
                </div>
                <div style={{ padding: '12px 16px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ width: 6, height: 6, background: 'var(--text3)', borderRadius: '50%', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: '16px 32px 24px', background: 'var(--bg2)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your documents..."
            rows={1}
            style={{ flex: 1, padding: '11px 16px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14, outline: 'none', resize: 'none', lineHeight: 1.5 }}
            onFocus={(e) => e.target.style.borderColor = 'var(--blue)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || thinking}
            style={{ padding: '11px 20px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 500, cursor: (!input.trim() || thinking) ? 'not-allowed' : 'pointer', opacity: (!input.trim() || thinking) ? 0.5 : 1, whiteSpace: 'nowrap' }}
          >
            Send ↑
          </button>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 11, marginTop: 8 }}>Press Enter to send · Shift+Enter for new line</p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}