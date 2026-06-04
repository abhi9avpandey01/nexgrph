'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

interface Workspace { id: string; name: string; description: string; createdAt: string; }

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);
  useEffect(() => { if (user) fetchWorkspaces(); }, [user]);

  const fetchWorkspaces = async () => {
    try { const res = await api.get('/api/workspaces'); setWorkspaces(res.data); }
    catch (err) { console.error(err); }
  };

  const createWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/api/workspaces', { name: newName, description: newDesc });
      setNewName(''); setNewDesc(''); setShowForm(false); fetchWorkspaces();
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 20, height: 20, border: '2px solid var(--blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Navbar */}
      <nav style={{ padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: 'var(--blue)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>N</span>
          </div>
          <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: 15 }}>NexGrph</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#60a5fa', fontSize: 12, fontWeight: 600 }}>{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <span style={{ color: 'var(--text2)', fontSize: 13 }}>{user?.name}</span>
          </div>
          <button onClick={logout} style={{ padding: '6px 14px', background: 'none', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Workspaces</h1>
            <p style={{ color: 'var(--text2)', fontSize: 13 }}>Organize your documents and knowledge graphs</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New Workspace
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <form onSubmit={createWorkspace} style={{ marginBottom: 28, padding: '20px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <p style={{ color: 'var(--text)', fontWeight: 500, fontSize: 14, marginBottom: 16 }}>New Workspace</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              {[
                { label: 'Name', value: newName, setter: setNewName, placeholder: 'My Research' },
                { label: 'Description (optional)', value: newDesc, setter: setNewDesc, placeholder: 'What is this for?' },
              ].map((f) => (
                <div key={f.label}>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text2)', marginBottom: 5 }}>{f.label}</label>
                  <input
                    type="text" value={f.value} onChange={(e) => f.setter(e.target.value)}
                    placeholder={f.placeholder}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                    required={f.label === 'Name'}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={creating} style={{ padding: '8px 16px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        )}

        {/* Workspaces Grid */}
        {workspaces.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', border: '1px dashed var(--border2)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗂️</div>
            <p style={{ color: 'var(--text)', fontWeight: 500, marginBottom: 4 }}>No workspaces yet</p>
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>Create your first workspace to get started</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => router.push(`/workspace/${ws.id}`)}
                style={{ padding: '20px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--blue)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ fontSize: 28, marginBottom: 14 }}>🗂️</div>
                <p style={{ color: 'var(--text)', fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{ws.name}</p>
                <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>{ws.description || 'No description'}</p>
                <p style={{ color: 'var(--text3)', fontSize: 11 }}>
                  {new Date(ws.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}