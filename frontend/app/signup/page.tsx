'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signup(name, email, password);
      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    background: 'var(--bg3)', border: '1px solid var(--border2)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text)',
    fontSize: 14, outline: 'none'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 32, height: 32, background: 'var(--blue)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>N</span>
          </div>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>NexGrph</span>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Create an account</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 28 }}>Start building your knowledge graph</p>

        {error && (
          <div style={{ marginBottom: 20, padding: '12px 14px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: 13 }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'Full name', type: 'text', value: name, setter: setName, placeholder: 'Abhinav Pandey' },
            { label: 'Email address', type: 'email', value: email, setter: setEmail, placeholder: 'you@example.com' },
            { label: 'Password', type: 'password', value: password, setter: setPassword, placeholder: '••••••••' },
          ].map((field) => (
            <div key={field.label}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>{field.label}</label>
              <input
                type={field.type} value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                placeholder={field.placeholder} required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--blue)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border2)'}
              />
            </div>
          ))}
          <button
            type="submit" disabled={loading}
            style={{ padding: '11px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#60a5fa' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}