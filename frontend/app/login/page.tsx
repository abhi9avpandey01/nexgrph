'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Left Panel */}
      <div style={{
        width: '45%', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '48px',
        background: 'var(--bg2)', borderRight: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 32, height: 32, background: 'var(--blue)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>N</span>
          </div>
          <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: 16 }}>NexGrph</span>
        </div>

        <div>
          <h2 style={{ fontSize: 36, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, marginBottom: 16 }}>
            Turn documents into<br />
            <span style={{ color: '#60a5fa' }}>knowledge graphs</span>
          </h2>
          <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.7 }}>
            Upload PDFs, extract entities and relationships, explore your knowledge visually with AI.
          </p>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { icon: '📄', title: 'Upload any document', desc: 'PDF, DOCX, TXT, Markdown' },
              { icon: '🕸️', title: 'Auto-generate knowledge graphs', desc: 'AI extracts entities and relationships' },
              { icon: '💬', title: 'Chat with your documents', desc: 'Get cited answers from your content' },
            ].map((item) => (
              <div key={item.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <div>
                  <p style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500 }}>{item.title}</p>
                  <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 2 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p style={{ color: 'var(--text3)', fontSize: 12 }}>© 2026 NexGrph</p>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Welcome back</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 28 }}>Sign in to your account</p>

          {error && (
            <div style={{ marginBottom: 20, padding: '12px 14px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Email address</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 14, outline: 'none' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--blue)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border2)'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 14, outline: 'none' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--blue)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border2)'}
              />
            </div>
            <button
              type="submit" disabled={loading}
              style={{ padding: '11px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
            Don't have an account?{' '}
            <Link href="/signup" style={{ color: '#60a5fa' }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}